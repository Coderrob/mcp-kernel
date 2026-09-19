# MCP Kernel

![MCP Kernel: modular teal K surrounding a golden core](assets/mcp-kernel-logo.png)

`@coderrob/mcp-kernel` helps a TypeScript application compose an MCP server from typed tools, resources, prompts, and plugins. It manages feature registration, lifecycle, middleware, tool policies, protocol results, and an in-memory SDK test connection. Your application remains responsible for domain integrations, credentials, authentication, and its executable entry point.

Version `0.2.0` uses the MCP TypeScript SDK v2 server and client packages and Zod 4. For the earlier SDK v1 release, see the [v0.1.1 documentation](https://github.com/Coderrob/mcp-kernel/blob/v0.1.1/README.md).

## Choose your next step

| Goal                                                                                   | Guide                                 |
| -------------------------------------------------------------------------------------- | ------------------------------------- |
| Create a server and test it through MCP                                                | [Getting started](getting-started.md) |
| Understand what the kernel owns                                                        | [Architecture](architecture.md)       |
| Configure middleware, authorization scopes, caching, rate limits, timeouts, and errors | [Runtime and policies](runtime.md)    |
| Verify, package, or release a change                                                   | [Development](development.md)         |

The supported consumer import path is `@coderrob/mcp-kernel`. The package provides ESM, CommonJS, and bundled TypeScript declarations. It requires Node.js 24.15 or newer on this branch.

The [audit](audit.md) records historical review findings and verification limits; use current tests and CI to assess the latest code. The package is licensed under [GPL-3.0-only](https://github.com/Coderrob/mcp-kernel/blob/main/LICENSE).
