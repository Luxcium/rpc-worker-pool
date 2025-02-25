# Contributing to RPC Worker Pool

## Development Environment Setup

### Prerequisites

1. Node.js v22 or later
1. pnpm package manager
1. Docker (optional, for containerized development)
1. Git

### Initial Setup

1. Fork the repository
2. Clone your fork:

   ```bash
   git clone <your-fork-url>
   cd rpc-worker-pool
   ```

3. Install dependencies:

   ```bash
   pnpm install
   ```

4. Build the project:

   ```bash
   pnpm run build
   ```

## Development Workflow

### Branch Strategy

- `main` - Stable release branch
- `develop` - Development branch
- Feature branches: `feature/<feature-name>`
- Bug fixes: `fix/<bug-description>`
- Hotfixes: `hotfix/<description>`

### Coding Standards

#### TypeScript Guidelines

1. **Type Safety**
   - Enable strict TypeScript configuration
   - Avoid using `any` type
   - Use interface declarations for object shapes

1. **Naming Conventions**
   - PascalCase for interfaces, types, and classes
   - camelCase for methods and variables
   - UPPER_CASE for constants

1. **File Organization**
   - One class per file
   - Clear module boundaries
   - Consistent import ordering

1. **Documentation**
   - JSDoc comments for public APIs
   - Clear inline comments for complex logic
   - Updated README for new features

#### Code Style

The project uses ESLint and Prettier for code formatting:

```bash
# Format code
pnpm run prettier

# Run linter
pnpm run lint

# Fix linting issues
pnpm run lint:fix
```

### Testing

#### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test file
pnpm test <path-to-test-file>
```

#### Writing Tests

1. **Unit Tests**
   - Test individual components
   - Mock dependencies
   - Focus on behavior, not implementation

1. **Integration Tests**
   - Test component interactions
   - Verify system workflows
   - Test error scenarios

1. **Test Coverage**
   - Aim for high coverage
   - Cover edge cases
   - Include error scenarios

### Documentation

1. **Code Documentation**
   - Clear and concise comments
   - Updated JSDoc
   - TypeScript declarations

1. **Project Documentation**
   - README.md updates
   - ARCHITECTURE.md for design changes
   - API documentation updates

## Pull Request Process

1. **Before Creating a PR**
   - Update documentation
   - Add/update tests
   - Run linter and tests
   - Rebase on latest main

1. **PR Guidelines**
   - Clear description of changes
   - Reference related issues
   - Include test results
   - Add screenshots if applicable

1. **Review Process**
   - Address review comments
   - Keep PR focused
   - Maintain clean commit history

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```template
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Types:

- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- style: Code style updates
- refactor: Code refactoring
- test: Test updates
- chore: Maintenance tasks

Example:

```plaintext
feat(worker-pool): add dynamic scaling capability

- Implement automatic worker pool scaling
- Add configuration options
- Update documentation

Closes #123
```

## Development Tips

### Debugging

1. **Local Development**

```bash
pnpm run debug
```

1. **Docker Development**

```bash
# Build development image
pnpm run docker:build

# Run with development configuration
pnpm run docker:live:server
```

### Common Issues

1. **Worker Thread Issues**
   - Check resource limits
   - Verify message serialization
   - Monitor memory usage

1. **Performance Problems**
   - Profile worker execution
   - Check task queue size
   - Monitor system resources

1. **Type Errors**
   - Verify interface implementations
   - Check generic type constraints
   - Review type declarations

## Getting Help

- Check existing issues
- Review documentation
- Join development discussions
- Ask questions in pull requests

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.
