# Package Manager Usage in the RPC Worker Pool Service

## Strict Package Manager Policy

This project enforces a strict package manager policy with absolutely no exceptions:

- Inside monorepo-one, use **ONLY** Rush commands
- Outside monorepo-one, use **ONLY** pnpm/pnpx commands
- NEVER use npm, yarn, or npx anywhere for any reason
- NEVER use pnpm directly inside monorepo-one when a Rush command exists for the same purpose

## Common Rush Commands

When working within the monorepo-one repository:

| Action | Command | Notes |
|--------|---------|-------|
| Install dependencies | `rush update` | Updates all dependencies according to lockfile |
| Add a production dependency | `rush add -m -p <package-name>` | Adds to all projects with `-m` flag |
| Add a dev dependency | `rush add -m -d <package-name>` | Adds as development dependency |
| Remove a dependency | `rush remove -p <package-name>` | Removes from current project |
| Build all projects | `rush build` | Builds in the correct dependency order |
| Clean build all projects | `rush rebuild` | Complete clean build |
| Run project-specific script | `rushx <script-name>` | Runs script from package.json |

## Common PNPM Commands

When working outside the monorepo-one repository:

| Action | Command | Notes |
|--------|---------|-------|
| Install dependencies | `pnpm install` | Installs all dependencies |
| Add a production dependency | `pnpm add <package-name>` | Adds as production dependency |
| Add a dev dependency | `pnpm add -D <package-name>` | Adds as development dependency |
| Add a global package | `pnpm add -g <package-name>` | Installs globally |
| Remove a dependency | `pnpm remove <package-name>` | Removes dependency |
| Run a script | `pnpm run <script-name>` | Runs script from package.json |
| Run a package executable | `pnpx <command>` | Runs executable from a package |

## CI/CD Integration

Our CI/CD pipelines are configured to enforce the correct package manager usage. Any code that relies on npm or yarn will fail CI checks. This ensures consistency across our codebase and development environments.

## Troubleshooting

If you encounter dependency issues:

1. Ensure you're using the correct package manager for your context
2. Run `rush purge` to clean cached dependencies, then `rush update`
3. Check for duplicate dependencies with `rush-pnpm check`
4. Verify your Rush and PNPM versions match the project requirements
