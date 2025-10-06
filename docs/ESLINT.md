# ESLint Configuration Guide

This document explains the ESLint configuration for the MyTradeJournal project and how to use it for maintaining code quality.

## Overview

ESLint is configured with Vue 3, JavaScript ES2022, and best practices for code consistency. The configuration includes:

- Vue 3 Composition API support
- JavaScript ES2022 features
- Consistent formatting rules
- Vue-specific linting rules
- Accessibility guidelines

## Configuration Files

### `eslint.config.js`
Main ESLint configuration using the new flat config format with:
- Vue 3 recommended rules
- JavaScript best practices
- Custom formatting rules (2-space indentation, single quotes, no semicolons)
- Browser globals (window, localStorage, setTimeout, etc.)
- File-specific overrides

### `.vscode/settings.json`
VS Code integration for automatic linting and formatting on save.

### `.vscode/extensions.json`
Recommended VS Code extensions for optimal development experience.

## Available Scripts

```bash
# Check for linting issues (no fixes)
npm run lint:check

# Fix auto-fixable linting issues
npm run lint:fix

# Alias for lint:fix
npm run lint
```

## Key Rules Enforced

### JavaScript Rules
- **Indentation**: 2 spaces
- **Quotes**: Single quotes preferred
- **Semicolons**: Not required (no-semi)
- **No unused variables**: Variables must be used or prefixed with `_`
- **Prefer const**: Use `const` over `let` when possible
- **Template literals**: Prefer template literals over string concatenation

### Vue.js Rules
- **Component naming**: PascalCase for component names
- **Prop naming**: camelCase for props
- **HTML formatting**: Consistent indentation and closing brackets
- **Attribute formatting**: Consistent hyphenation and spacing
- **Single-file component structure**: Enforced order of blocks

### Code Quality Rules
- **No console**: Warnings for console statements (except in Firebase services)
- **No debugger**: Error for debugger statements
- **No duplicate imports**: Prevent duplicate import statements
- **Object shorthand**: Prefer shorthand object syntax

## VS Code Integration

The configuration includes VS Code settings for:
- **Auto-fix on save**: Automatically fixes ESLint issues when saving files
- **Format on save**: Applies formatting using ESLint
- **Real-time linting**: Shows linting errors as you type
- **Recommended extensions**: Suggests installing ESLint extension

## File Exclusions

ESLint ignores these files/directories:
- `node_modules/`
- `dist/` and build directories
- Environment files (`.env*`)
- Log files
- Cache directories
- Public assets
- Configuration files (where appropriate)

## Common Issues and Solutions

### 1. Unused Variables
**Error**: `'variable' is assigned a value but never used`
**Solution**: Either use the variable or prefix with `_` (e.g., `_props`)

### 2. Console Statements
**Warning**: `Unexpected console statement`
**Solution**: Remove console logs or add ESLint disable comment:
```javascript
// eslint-disable-next-line no-console
console.log('debug info')
```

### 3. Prop Definition Issues
**Error**: `Prop should be optional`
**Solution**: Add `required: false` or remove the default value

### 4. Indentation Errors
**Error**: `Expected indentation of X spaces`
**Solution**: Run `npm run lint:fix` to auto-fix formatting

## Customizing Rules

To modify ESLint rules, edit `eslint.config.js`:

```javascript
// Example: Disable a specific rule
'no-console': 'off'

// Example: Change rule severity
'vue/multi-word-component-names': 'warn'

// Example: Configure rule options
'indent': ['error', 4] // Change to 4 spaces
```

## Pre-commit Integration

Consider adding a pre-commit hook to run linting:

```bash
# Install husky for git hooks
npm install --save-dev husky

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run lint:check"
```

## Continuous Integration

Add linting to your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Run ESLint
  run: npm run lint:check
```

## Best Practices

1. **Run linting regularly**: Use `npm run lint:fix` during development
2. **Fix errors before committing**: Ensure code passes linting checks
3. **Use VS Code integration**: Enable auto-fix on save for better workflow
4. **Understand the rules**: Learn why rules exist to write better code
5. **Consistent formatting**: Let ESLint handle formatting to maintain consistency

## Troubleshooting

### ESLint not working in VS Code
1. Ensure ESLint extension is installed
2. Check VS Code settings are properly configured
3. Restart VS Code after configuration changes

### Rules not applying
1. Verify `eslint.config.js` syntax is correct
2. Check file paths in ignore patterns
3. Ensure files have correct extensions

### Performance issues
1. Add more specific ignore patterns
2. Exclude large directories from linting
3. Use file-specific overrides instead of global rules

## Migration Notes

This project uses the new ESLint flat config format (v9+). Key differences from legacy config:
- Uses `eslint.config.js` instead of `.eslintrc.js`
- Uses `ignores` property instead of `.eslintignore`
- Flat array structure for configuration
- Different plugin syntax

For more information, see the [ESLint migration guide](https://eslint.org/docs/latest/use/configure/migration-guide).
