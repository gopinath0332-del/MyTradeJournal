# GitHub Copilot Instructions

## Priority Guidelines

When generating code for this repository:

1. **Version Compatibility**: Always detect and respect the exact versions of languages, frameworks, and libraries used in this project
2. **Context Files**: Prioritize patterns and standards defined in the .github/copilot directory
3. **Codebase Patterns**: When context files don't provide specific guidance, scan the codebase for established patterns
4. **Architectural Consistency**: Maintain our Layered architectural style and established boundaries
5. **Code Quality**: Prioritize maintainability, performance, and accessibility in all generated code

## Technology Version Detection

Before generating code, scan the codebase to identify:

1. **Language Versions**: Detect the exact versions of programming languages in use
   - **Vue**: Version 3.5.21 (Composition API with `<script setup>`)
   - **TypeScript**: Version 5.9.2 (ES2020 target)
   - **JavaScript**: ES2022 features (ESNext modules)
   - **Node.js**: Compatible with current LTS versions
   - Never use language features beyond the detected version

2. **Framework Versions**: Identify the exact versions of all frameworks
   - **Vite**: Version 7.1.5 (build tool and dev server)
   - **Vue Router**: Version 4.5.1 (for client-side routing)
   - **Firebase**: Version 12.2.1 (for backend services)
   - **ESLint**: Version 9.36.0 (for code quality)
   - Respect version constraints when generating code

3. **Library Versions**: Note the exact versions of key libraries and dependencies
   - **uuid**: Version 13.0.0 (for generating unique identifiers)
   - **idb**: Version 8.0.3 (for IndexedDB operations)
   - Never use APIs or features not available in the detected versions

## Codebase Scanning Instructions

When context files don't provide specific guidance:

1. Identify similar files to the one being modified or created
2. Analyze patterns for:
   - **Naming conventions**: PascalCase for components, camelCase for variables/functions
   - **Code organization**: Composables pattern, component-based architecture
   - **Error handling**: Try-catch blocks with logger utility
   - **Logging approaches**: Centralized logger utility with structured logging
   - **Documentation style**: JSDoc comments for functions, inline comments for complex logic
   - **Testing patterns**: Component-based testing (when implemented)
   
3. Follow the most consistent patterns found in the codebase
4. When conflicting patterns exist, prioritize patterns in newer files or files with higher complexity
5. Never introduce patterns not found in the existing codebase

## Code Quality Standards

### Maintainability
- Write self-documenting code with clear naming following codebase conventions
- Follow Vue 3 Composition API patterns consistently
- Keep functions focused on single responsibilities
- Limit function complexity and length to match existing patterns (typically < 50 lines)
- Use composables for reusable logic following the `use*` naming pattern

### Performance
- Follow Vue 3 performance patterns: reactive refs, computed properties, watch effects
- Use lazy loading for routes as demonstrated in router configuration
- Apply caching strategies consistent with existing cache service patterns
- Optimize bundle size following Vite configuration patterns
- Handle large datasets with virtual scrolling as shown in VirtualScroll component

### Accessibility
- Follow existing accessibility patterns in the codebase
- Maintain keyboard navigation support with proper tabindex usage
- Apply proper ARIA attributes following component examples
- Ensure minimum 44px touch targets for mobile (as shown in mobile CSS)
- Follow established color contrast patterns from CSS custom properties

## Documentation Requirements

- Follow the exact documentation format found in the codebase
- Match JSDoc style for functions and complex logic blocks
- Document parameters, returns, and exceptions following existing patterns
- Use inline comments for non-obvious business logic
- Follow existing patterns for component prop documentation

## Architecture Guidelines

### Component Structure
Follow the established layered architecture:

```
src/
├── components/           # Vue components organized by feature
│   ├── charts/          # Chart and visualization components
│   ├── dashboard/       # Dashboard-specific components
│   ├── trade/           # Trade management components
│   ├── ui/              # Reusable UI components
│   └── statistics/      # Statistics and analytics components
├── composables/         # Reusable composition functions
├── firebase/            # Firebase configuration and services
├── router/              # Vue Router configuration
├── styles/              # CSS stylesheets
├── types/               # TypeScript type definitions
└── utils/               # Utility functions
```

### Vue 3 Composition API Patterns

**Component Structure**: Follow this exact pattern found throughout the codebase:

```vue
<template>
  <!-- Template following semantic HTML structure -->
</template>

<script setup>
import { ref, computed, onMounted, provide } from 'vue'
import { composableName } from '@/composables/composableName'

// Props definition
const props = defineProps({
  propName: {
    type: Type,
    required: Boolean,
    default: () => defaultValue
  }
})

// Reactive state
const loading = ref(false)
const error = ref(null)
const data = ref([])

// Computed properties
const computedValue = computed(() => {
  // Logic here
})

// Composables
const { state, methods } = composableName()

// Methods
const methodName = async () => {
  // Implementation
}

// Lifecycle
onMounted(() => {
  // Initialization
})
</script>

<style scoped>
/* Component-specific styles */
</style>
```

### Composables Pattern

Follow the established composables pattern:

```javascript
export function useFeatureName() {
  // Reactive state
  const loading = ref(false)
  const error = ref(null)
  const data = ref([])

  // Computed
  const computedValues = computed(() => {
    // Logic
  })

  // Methods
  const methodName = async () => {
    try {
      loading.value = true
      // Implementation
    } catch (err) {
      error.value = err.message
      logger.error('Error message:', err)
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    loading,
    error,
    data,
    
    // Computed
    computedValues,
    
    // Methods
    methodName
  }
}
```

## Styling Guidelines

### CSS Architecture
Follow the established CSS patterns:

1. **CSS Custom Properties**: Use the comprehensive set defined in `/src/styles/dashboard.css`
2. **Mobile-First Design**: Start with mobile styles, then add desktop breakpoints
3. **Responsive Breakpoints**: Use consistent breakpoints (480px, 768px, 1024px)
4. **Component Scoping**: Use scoped styles with fallback CSS custom properties

### Mobile-First Responsive Pattern

```css
/* Mobile first (default) */
.component {
  padding: 0.75rem;
  font-size: 0.875rem;
}

/* Small screens */
@media (min-width: 480px) {
  .component {
    padding: 1rem;
    font-size: 0.9rem;
  }
}

/* Tablets */
@media (min-width: 768px) {
  .component {
    padding: 1.25rem;
    font-size: 1rem;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .component {
    padding: 1.5rem;
  }
}
```

### CSS Custom Properties Usage

Always use the established custom properties:

```css
.component {
  background: white;
  border-radius: var(--dashboard-radius-md);
  padding: var(--dashboard-spacing-lg);
  box-shadow: var(--dashboard-shadow-sm);
  color: var(--text-color, #1f2937);
  border: 1px solid var(--border-color, #e5e7eb);
}
```

## Firebase Integration Patterns

### Service Layer Pattern

Follow the established service pattern in `tradeService.ts`:

```javascript
// Service method structure
const methodName = async (params) => {
  try {
    // Validation
    if (!params) {
      throw new Error('Parameters required')
    }

    // Firebase operation
    const result = await firebaseOperation(params)
    
    // Transform data if needed
    return transformData(result)
  } catch (error) {
    logger.error('Service error:', error)
    throw error
  }
}
```

### Error Handling Pattern

```javascript
// Component error handling
const handleOperation = async () => {
  loading.value = true
  error.value = null
  
  try {
    const result = await serviceMethod()
    // Handle success
  } catch (err) {
    error.value = err.message || 'Operation failed'
    logger.error('Component error:', err)
  } finally {
    loading.value = false
  }
}
```

## ESLint Compliance

Follow the established ESLint configuration:

1. **Import Order**: Vue imports first, then composables, then utilities
2. **Naming Conventions**: PascalCase for components, camelCase for everything else
3. **Code Style**: 2-space indentation, single quotes, no semicolons
4. **Vue-Specific**: Follow vue/recommended rules
5. **Unused Variables**: Prefix with underscore if needed: `_unusedParam`

## Performance Optimization Patterns

### Virtual Scrolling
For large datasets, follow the VirtualScroll component pattern:

```javascript
// Virtual scrolling setup
const props = defineProps({
  items: Array,
  itemHeight: { type: Number, default: 60 },
  containerHeight: { type: Number, default: 400 }
})

const visibleItems = computed(() => {
  // Calculate visible range
  return props.items.slice(startIndex, endIndex)
})
```

### Caching Strategy
Follow the established caching patterns:

```javascript
// Cache implementation
const cache = ref(new Map())
const getCachedData = async (key) => {
  if (cache.value.has(key)) {
    return cache.value.get(key)
  }
  
  const data = await fetchData(key)
  cache.value.set(key, data)
  return data
}
```

## Testing Approach

When implementing tests, follow these patterns observed in the codebase:

### Component Testing Structure
```javascript
// Component test structure (when implemented)
describe('ComponentName', () => {
  it('should render correctly', () => {
    // Test implementation following Vue Test Utils patterns
  })
  
  it('should handle user interactions', () => {
    // Test event handling
  })
  
  it('should manage state correctly', () => {
    // Test reactive state changes
  })
})
```

## Router Configuration

Follow the established lazy loading pattern:

```javascript
// Lazy loading components
const ComponentName = () => import('../components/ComponentName.vue')

// Route definition
{
  path: '/route-path',
  name: 'RouteName',
  component: ComponentName,
  meta: {
    title: 'Page Title'
  }
}
```

## TypeScript Integration

### Type Definitions
Follow the established type patterns in `/src/types/`:

```typescript
// Interface definitions
export interface DataInterface {
  id: string
  name: string
  value: number
  optional?: string
}

// Composable return types
export interface UseFeatureReturn {
  data: Ref<DataInterface[]>
  loading: Ref<boolean>
  error: Ref<string | null>
  methods: (...args: any[]) => Promise<void>
}
```

### Vue Component Types
```typescript
// Component props with TypeScript
interface Props {
  items: DataInterface[]
  loading?: boolean
}

const props = defineProps<Props>()
```

## File Organization

### Import Organization
Follow this exact import order found throughout the codebase:

```javascript
// 1. Vue core imports
import { ref, computed, onMounted } from 'vue'

// 2. External libraries
import { useRouter } from 'vue-router'

// 3. Local components
import ComponentName from './ComponentName.vue'

// 4. Composables
import { useFeature } from '@/composables/useFeature'

// 5. Services
import { serviceMethod } from '@/firebase/service'

// 6. Utilities
import { logger } from '@/utils/logger'

// 7. Types (if using TypeScript)
import type { DataType } from '@/types'
```

## Project-Specific Best Practices

1. **Always use the logger utility** for error tracking and debugging
2. **Follow the dashboard CSS custom properties** for consistent styling
3. **Implement proper loading and error states** in all data-fetching operations
4. **Use the established composables pattern** for reusable logic
5. **Follow mobile-first responsive design** principles
6. **Maintain consistency** with existing component structure and naming
7. **Use Vite's path aliases** (@/) for clean imports
8. **Follow the established Firebase service patterns** for data operations

## Version Control Guidelines

- Follow Semantic Versioning patterns as indicated by version 0.0.0 in package.json
- Match existing commit message patterns if present
- Follow the established branch naming conventions

## General Best Practices

- Follow naming conventions exactly as they appear in existing code
- Match code organization patterns from similar files
- Apply error handling consistent with existing patterns
- Follow the same approach to testing as seen in the codebase structure
- Match logging patterns using the centralized logger utility
- Use the same approach to configuration as seen in Vite and Firebase setup
- Prioritize consistency with existing code over external best practices
- When in doubt, scan similar components for established patterns