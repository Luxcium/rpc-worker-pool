# Package Manager Policy

## Strict Requirements - NO EXCEPTIONS

To ensure consistency and avoid dependency issues across the project, the following package manager rules must be strictly followed with **NO EXCEPTIONS**:

### Inside monorepo-one

- ✅ Use **ONLY** Rush commands:
  - `rush update` - Update dependencies
  - `rush build` - Build projects
  - `rush add -m -p <package>` - Add a production dependency
  - `rush remove -p <package>` - Remove a dependency
  - `rushx <script>` - Run a script defined in package.json

- ❌ **NEVER** use pnpm, npm, yarn, or npx directly inside monorepo-one when a Rush command exists for the same purpose

### Outside monorepo-one

- ✅ Use **ONLY** pnpm/pnpx commands:
  - `pnpm add <package>` - Add a production dependency
  - `pnpm add -D <package>` - Add a development dependency
  - `pnpm update <package>` - Update a package
  - `pnpm remove <package>` - Remove a package
  - `pnpx <command>` - Run a package executable

- ❌ **NEVER** use npm, yarn, or npx anywhere in the project

## Why This Matters

- **Consistent Lockfiles**: Using multiple package managers creates conflicting lockfiles
- **Dependency Resolution**: Different package managers resolve dependencies differently
- **Caching**: Consistent package manager usage ensures proper caching
- **Monorepo Integrity**: Rush is specifically designed to handle our monorepo structure

## Automatic Detection

CI workflows are configured to detect and fail if incorrect package managers are used. Any PR containing npm or yarn artifacts will be automatically rejected.
