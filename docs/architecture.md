# Architecture

MCP Kernel is the application layer between the official Model Context Protocol TypeScript SDK and an application's domain integrations. It owns feature composition, lifecycle, middleware, execution policies, protocol results, transports, and test connections. A consuming application owns credentials, service clients, domain schemas, and business behavior.

![Six-stage feature lifecycle: define with Zod schemas, validate, compile, register, invoke through middleware and policies, and respond with an MCP result.](assets/tool-lifecycle.png)

## Ownership boundaries

| Concern                         | Owner                  | Reason                                                               |
| ------------------------------- | ---------------------- | -------------------------------------------------------------------- |
| Credentials and token checks    | Consuming application  | Authentication depends on the deployment and identity provider.      |
| Service clients and domain work | Consuming application  | Business behavior stays outside the reusable kernel.                 |
| Context creation and disposal   | Kernel and application | The kernel orders lifecycle calls; the application creates values.   |
| Feature composition             | Kernel                 | Definitions, plugins, validation, and manifests are shared behavior. |
| Middleware and tool policies    | Kernel                 | Every invocation uses one consistent execution boundary.             |
| Protocol framing and validation | Official MCP SDK       | The SDK implements MCP wire behavior and transport contracts.        |

Applications import the supported package root, `@coderrob/mcp-kernel`, and supply dependencies through `createContext`. The kernel calls application-provided hooks but never imports application code.

```text
MCP client
  <-> official MCP SDK transport
  <-> McpApplication
       -> middleware
       -> tool policies (tools only)
       -> plugin feature handler
       -> application-owned service client

application -> @coderrob/mcp-kernel -> @modelcontextprotocol/server
testing helper ---------------------> @modelcontextprotocol/client
kernel -X-> application modules
```

Only the package root is a supported consumer boundary. Internal source paths are absent from package exports so implementation modules can change without creating accidental public contracts.

## Runtime components

| Component                                                                                                                                                                 | Responsibility                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| [`definitions.ts`](https://github.com/Coderrob/mcp-kernel/blob/main/src/mcp/definitions.ts)                                                                               | Preserve schema inference and create immutable tool, resource, prompt, and plugin definitions.          |
| [`registry.ts`](https://github.com/Coderrob/mcp-kernel/blob/main/src/mcp/registry.ts)                                                                                     | Validate composition, detect collisions, compile ordered features, and produce deterministic manifests. |
| [`sdk-adapter.ts`](https://github.com/Coderrob/mcp-kernel/blob/main/src/mcp/sdk-adapter.ts)                                                                               | Translate compiled features into MCP SDK v2 registration calls.                                         |
| [`application.ts`](https://github.com/Coderrob/mcp-kernel/blob/main/src/mcp/application.ts)                                                                               | Own state, context, startup, shutdown, dispatch, cancellation, and tool policies.                       |
| [`middleware.ts`](https://github.com/Coderrob/mcp-kernel/blob/main/src/mcp/middleware.ts)                                                                                 | Compose cross-cutting behavior around feature execution.                                                |
| [`results.ts`](https://github.com/Coderrob/mcp-kernel/blob/main/src/mcp/results.ts) and [`errors.ts`](https://github.com/Coderrob/mcp-kernel/blob/main/src/mcp/errors.ts) | Create protocol results and map safe application failures.                                              |
| [`transports.ts`](https://github.com/Coderrob/mcp-kernel/blob/main/src/mcp/transports.ts)                                                                                 | Create named transport factories, including stdio.                                                      |
| [`testing.ts`](https://github.com/Coderrob/mcp-kernel/blob/main/src/mcp/testing.ts)                                                                                       | Connect an official SDK client and server over linked in-memory transports.                             |

Production modules import internal symbols from the file that defines them. The only production re-export surface is [`src/index.ts`](https://github.com/Coderrob/mcp-kernel/blob/main/src/index.ts).

## From definition to protocol response

The lifecycle visual summarizes six distinct stages:

1. **Define.** `defineTool`, `defineResource`, `defineResourceTemplate`, and `definePrompt` retain Zod 4 schema inference. `definePlugin` groups features with optional setup and disposal hooks.
2. **Validate.** `createMcpServer` checks identity and capacity options. The registry checks plugin and feature names, version presence, namespace collisions, and tool-policy constraints. Invalid composition fails before application dependencies or a transport are created.
3. **Compile.** The registry stores features in deterministic plugin declaration order. `app.manifest()` serializes the same definitions and inline JSON Schemas without starting the application.
4. **Register.** During startup, the SDK adapter registers the compiled tools, resources, resource templates, and prompts with an MCP SDK v2 `McpServer`.
5. **Invoke.** The SDK parses protocol input and supplies v2 request context. The application adds its context and request metadata, composes middleware, and enters the feature-specific execution path.
6. **Respond.** Handlers return native MCP results. Successful structured tool output is validated before cache invalidation or insertion. Expected failures preserve caller-safe details; unexpected failures are sanitized.

Tool schemas are passed to SDK registration as complete Standard Schema objects. SDK-validated tool input is not parsed again, so Zod transforms run once. Direct calls to `app.invokeTool` still validate input because they bypass the SDK boundary.

## Lifecycle and cleanup

An application moves through these terminal states:

```text
created -> starting -> running -> stopping -> stopped
              |                       ^
              +---- failure ----------+
```

`start` performs these operations in order:

1. create the application context;
2. run plugin setup hooks in declaration order;
3. create the SDK server and register compiled features; and
4. create and connect the selected transport.

`stop` aborts the application signal, closes the SDK server, disposes successfully initialized plugins in reverse order, disposes the application context, and clears local policy state. It is idempotent and terminal; restarting requires a new application instance.

Cleanup follows acquisition ownership:

| Failure point                    | Cleanup responsibility                                                                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- |
| `createContext` throws           | The application releases anything acquired before it threw.                                  |
| A plugin's `setup` throws        | That plugin releases its partial resources; the kernel disposes earlier plugins and context. |
| Registration or connection fails | The kernel closes the SDK server, disposes initialized plugins, and disposes context.        |
| Shutdown cleanup throws          | The kernel logs the failure and continues releasing remaining owned resources.               |

A call to `stop` during startup aborts the root signal and waits for startup cleanup to settle before shutdown completes.

## Request execution

For every feature, the application combines the root application signal with the SDK request signal and builds request metadata containing the request ID, plugin, feature, transport, start time, cancellation signal, and optional principal. In SDK v2, request ID and cancellation come from `ServerContext.mcpReq`; HTTP authentication metadata comes from `ServerContext.http.authInfo`.

Middleware wraps the terminal feature path in declaration order: the first declared middleware is outermost. Middleware may observe, delegate, replace the result, or short-circuit. A short-circuit does not enter tool policies or the feature handler, so authorization that must cover every feature belongs in middleware or the handler.

The terminal path for a tool runs in this order:

1. require every configured scope;
2. count and enforce the per-principal rate limit;
3. return an eligible cached result;
4. invoke the handler;
5. reject work cancelled during the handler;
6. validate successful structured output; and
7. invalidate tagged entries and cache the successful result when eligible.

Authorization and rate limiting therefore run before cache lookup, and cache hits count toward rate limits. Resources and prompts do not have tool policies; protect them in middleware or their handlers.

The effective timeout wraps middleware and the terminal handler. Timeout, request cancellation, and shutdown signal cooperative cancellation through `request.signal`; JavaScript work and side effects cannot be forcibly stopped.

## Results, errors, and logging

Feature handlers return native MCP results. `jsonResult`, `textResult`, and `errorResult` create common tool-result shapes. Typed `McpHarnessError` failures retain their declared caller-safe message and details. Unknown tool failures become a sanitized internal error containing a request ID for correlation.

For stdio servers, stdout belongs exclusively to JSON-RPC. `createStderrLogger` keeps operational logs on stderr and redacts sensitive structured field names. Applications must still keep secrets out of free-form log messages.

## Transports and protocol tests

`stdioTransport` provides the packaged stdio boundary. `defineTransport` accepts a factory for another official SDK transport and records a stable transport name in request metadata. The application owns each created transport through the SDK server lifecycle.

For HTTP transports, verified authentication metadata populates SDK `ServerContext.http.authInfo`. The kernel trusts that metadata and does not authenticate credentials itself. It copies `clientId`, scopes, and extra attributes into the request principal used by tool policies.

`connectTestClient` starts a fresh application and connects official SDK client and server instances through linked in-memory transports. It exercises discovery, protocol validation, registration, invocation, and cleanup without a child process. Closing the connection closes the client and stops the application even when client cleanup fails.

Use `connectTestClient` for package-level contract tests. Add process-level tests in the consuming application for packaged stdio or HTTP startup, deployment authentication, and real service integrations.

## Choosing an extension point

| Change needed                               | Extension point                                             |
| ------------------------------------------- | ----------------------------------------------------------- |
| Add a business capability                   | Define a feature and include it in an application plugin.   |
| Share service clients or configuration      | Return them from `createContext`.                           |
| Apply behavior across feature kinds         | Add middleware.                                             |
| Configure caching, rate limiting, or scopes | Declare a tool policy.                                      |
| Support another SDK transport               | Wrap its factory with `defineTransport`.                    |
| Change protocol registration behavior       | Update the SDK adapter and add an in-memory protocol test.  |
| Change startup or ownership rules           | Update `McpApplication` and test failure and cleanup paths. |

Keep service-specific retries, data mapping, and credentials in the consuming application. Add kernel behavior only when it applies across MCP applications.

See [Getting started](getting-started.md) for a working composition example and [Runtime and policies](runtime.md) for policy configuration and operational limits.
