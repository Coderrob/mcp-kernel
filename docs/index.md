# MCP Kernel

![MCP Kernel: modular teal K surrounding a golden core](assets/mcp-kernel-logo.png)

`@coderrob/mcp-kernel` composes Model Context Protocol servers from typed tools, resources, prompts, and plugins. Applications supply their dependencies and authentication through the context factory and SDK transport.

- [Getting started](getting-started.md): install the package and create a server.
- [Runtime and policies](runtime.md): lifecycle, middleware, authorization, caching, and errors.
- [Development](development.md): build, checks, documentation, and release validation.
- [Audit](audit.md): reviewed areas, regression fixes, and verification limits.

The supported import path is `@coderrob/mcp-kernel`. The package provides ESM, CommonJS, and bundled TypeScript declarations. It requires Node.js 24.15 or newer, the MCP TypeScript SDK 2.x server and client packages, and Zod 4.2 or newer.

Keep service clients, domain schemas, and authentication configuration in the consuming application.

Licensed under [GPL-3.0-only](https://github.com/Coderrob/mcp-kernel/blob/main/LICENSE).
