# Documentation assets

Assets in this directory explain reusable MCP Kernel behavior and identity. Application-specific diagrams belong in the consuming application's repository. The surrounding Markdown remains the accessible source of operational detail.

| Asset                                        | Purpose                                                               | Update when                                                               |
| -------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| [`mcp-kernel-logo.png`](mcp-kernel-logo.png) | Project identity used by the repository and documentation home pages  | The project identity or approved artwork changes                          |
| [`logo-prompt.txt`](logo-prompt.txt)         | Provenance note for the generated logo                                | The logo is regenerated from revised source instructions                  |
| [`tool-lifecycle.png`](tool-lifecycle.png)   | Feature flow from definition and validation through protocol response | Definition, compilation, registration, invocation, or result flow changes |

When replacing a diagram, verify its labels against the implementation, keep text readable at documentation width, and use meaningful Markdown alt text. Optimize large binaries without changing their appearance, then update this inventory whenever an asset is added, renamed, or removed.
