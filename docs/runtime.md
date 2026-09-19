# Runtime and policies

## Lifecycle and context

`createMcpServer` validates the server identity, plugin names, feature names, and tool policies at construction. `start` creates the application context, runs plugin setup in declaration order, registers SDK features, and connects the transport. A context may be `undefined` for an application without dependencies.

`stop` aborts the application signal, closes the SDK server, disposes initialized plugins in reverse order, and disposes the context. Stop is idempotent. An application cannot be restarted after stopping. A plugin whose setup fails must release resources it acquired before throwing; only successfully initialized plugins are disposed by the kernel.

Handlers receive `input`, `context`, and `request`. Request metadata includes the request ID, plugin, feature, transport, start time, abort signal, and optional principal. Middleware wraps handlers in declaration order and may observe, short-circuit, or delegate execution.

## Tool policies

| Policy           | Behavior                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------ |
| `requiredScopes` | Requires an authenticated principal with every listed scope.                               |
| `timeoutMs`      | Overrides the application `defaultTimeoutMs` for that tool.                                |
| `rateLimit`      | Limits requests per tool and principal within a time window. Cache hits count as requests. |
| `cache`          | Caches successful results for `ttlMs`; requires `annotations.readOnlyHint: true`.          |
| `invalidates`    | Invalidates cached results with matching tags after a successful handler result.           |

For example, a read-only tool can combine scopes, rate limits, and a tagged cache:

```typescript
annotations: { readOnlyHint: true },
policy: {
  requiredScopes: ['records:read'],
  timeoutMs: 5_000,
  rateLimit: { maxRequests: 30, windowMs: 60_000 },
  cache: { ttlMs: 30_000, tags: ['records'] },
},
```

A successful writer can use `policy: { invalidates: ['records'] }` to clear those cached reads. The application must authenticate the caller in its transport and provide a stable `clientId`; a scope string alone does not verify a token.

Authorization is checked before the cache. Cache entries are isolated by principal ID by default; `varyByPrincipal: false` explicitly shares results. Anonymous requests have a separate identity from every authenticated principal, including a principal literally named `anonymous`.

The transport supplies the v2 SDK's `http.authInfo`; the kernel uses its `clientId` as the principal ID and copies its scopes. Use unique IDs for identities that must not share cached data or rate limits. Scope checks do not authenticate tokens themselves. Resources and prompts do not have tool policies; apply their authorization in middleware or handlers.

Cache and rate-limit state is local to the application and bounded by `cacheCapacity` and `rateLimitCapacity`. These options require positive safe integers. Old records may be evicted at capacity, so local rate limits are not a durable or distributed abuse-prevention system. Cached tools should use JSON-compatible input values and results. Avoid caching results that vary with mutable authorization attributes under a single principal ID.

Timeouts reject the invocation and signal cancellation. JavaScript handlers are not forcibly terminated: pass `request.signal` to cancellable work and honor it before side effects. Shutdown also signals cancellation; handlers should stop using application dependencies promptly.

## Schemas and errors

Tool schemas are passed intact to the SDK, preserving strict object validation. SDK-validated inputs reach handlers without being parsed a second time, so property transforms execute once. Direct application tool invocations validate their own input. Successful structured output must satisfy `outputSchema` when one is declared.

`jsonResult` produces text and structured content; use JSON-compatible objects for protocol responses. `textResult` produces plain text. `errorResult` creates an explicit tool failure. Typed `McpHarnessError` failures expose their declared message and details; unexpected failures return a sanitized internal error and request ID. Only put caller-safe information in typed error details.

Use `createStderrLogger` with stdio transports so logs do not corrupt stdout protocol messages. It redacts sensitive structured field names; avoid placing secrets inside free-form log messages.
