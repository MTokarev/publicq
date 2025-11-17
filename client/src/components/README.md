# Component Folder Structure Template

This document outlines the standard folder structure for React components using CSS Modules in this project.

## Standard Component Structure

```
src/components/ComponentName/
├── ComponentName.tsx              # Main component file
├── ComponentName.module.css       # CSS Modules styles
├── ComponentName.test.tsx         # Unit tests (optional)
├── ComponentName.stories.tsx      # Storybook stories (optional)
└── index.ts                       # Barrel export
```

## Example: Button Component

```
src/components/Button/
├── Button.tsx                     # Main Button component
├── Button.module.css              # Button styles using design tokens
├── Button.test.tsx                # Button tests
├── Button.stories.tsx             # Storybook stories
└── index.ts                       # Export { Button, ButtonProps }
```

## CSS Modules Naming Conventions

### File Naming
- Use `.module.css` extension for CSS Modules
- Match the component name: `Button.module.css` for `Button.tsx`

### Class Naming (BEM-inspired)
```css
/* Block */
.button { }

/* Block with modifier */
.button--primary { }
.button--secondary { }
.button--lg { }
.button--sm { }

/* Element */
.button__icon { }
.button__text { }

/* Element with modifier */
.button__icon--left { }
.button__icon--right { }
```

### Design Token Usage
Always use CSS custom properties (design tokens) instead of hard-coded values:

```css
/* ✅ Good - Using design tokens */
.button {
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-primary);
  border-radius: var(--radius);
  transition: var(--transition);
}

/* ❌ Bad - Hard-coded values */
.button {
  padding: 8px 16px;
  background-color: #3b82f6;
  border-radius: 8px;
  transition: all 0.2s ease;
}
```

## Component Implementation Pattern

### 1. Import CSS Modules
```tsx
import styles from './ComponentName.module.css';
import { cn } from '../../utils/cn';
```

### 2. Define Props Interface
```tsx
export interface ComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  // ... other props
}
```

### 3. Use CSS Modules with Conditional Classes
```tsx
export const Component: React.FC<ComponentProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        styles.component,
        styles[`component--${variant}`],
        styles[`component--${size}`],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
```

## Shared Component Styles

For styles shared across multiple components, create files in `src/styles/components/`:

```
src/styles/components/
├── form.module.css               # Shared form styles
├── modal.module.css              # Shared modal styles
└── card.module.css               # Shared card styles
```

## Integration with Existing Components

When migrating existing components:

1. Create `.module.css` file alongside the component
2. Move inline styles to CSS classes using design tokens
3. Replace `style={}` with `className` using `cn()` utility
4. Keep the same component interface for backward compatibility

## Example Migration

### Before (inline styles)
```tsx
const Button = ({ variant, children }) => (
  <button
    style={{
      padding: '8px 16px',
      backgroundColor: variant === 'primary' ? '#3b82f6' : '#6b7280',
      color: 'white',
      borderRadius: '8px',
    }}
  >
    {children}
  </button>
);
```

### After (CSS Modules)
```tsx
import styles from './Button.module.css';
import { cn } from '../../utils/cn';

const Button = ({ variant = 'primary', children, className }) => (
  <button
    className={cn(
      styles.button,
      styles[`button--${variant}`],
      className
    )}
  >
    {children}
  </button>
);
```

```css
/* Button.module.css */
.button {
  padding: var(--spacing-sm) var(--spacing-md);
  color: var(--color-white);
  border-radius: var(--radius);
  transition: var(--transition);
}

.button--primary {
  background-color: var(--color-primary);
}

.button--secondary {
  background-color: var(--color-secondary);
}
```

This pattern ensures consistency, maintainability, and type safety across all components.