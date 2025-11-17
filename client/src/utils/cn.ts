/**
 * Utility function for conditionally joining classNames together
 * This is a simple alternative to clsx/classnames libraries
 * 
 * @param classes - Array of class strings, objects, or falsy values
 * @returns Combined class string
 * 
 * @example
 * cn('base-class', condition && 'conditional-class', { 'active': isActive })
 * cn(styles.button, styles['button--primary'], { [styles.disabled]: isDisabled })
 */

type ClassValue = string | number | boolean | undefined | null | { [key: string]: boolean | undefined | null };

export function cn(...classes: ClassValue[]): string {
  const result: string[] = [];

  for (const cls of classes) {
    if (!cls) continue;

    if (typeof cls === 'string' || typeof cls === 'number') {
      result.push(String(cls));
    } else if (typeof cls === 'object') {
      for (const [key, value] of Object.entries(cls)) {
        if (value) {
          result.push(key);
        }
      }
    }
  }

  return result.join(' ');
}

/**
 * Alternative export for those who prefer clsx naming
 */
export const clsx = cn;

/**
 * Utility for CSS Modules - combines base classes with CSS module classes
 * 
 * @param styles - CSS module styles object
 * @param classes - Class names to apply
 * @returns Combined class string using CSS module classes
 * 
 * @example
 * cxm(styles, 'button', 'primary', { disabled: isDisabled })
 */
export function cxm(styles: Record<string, string>, ...classes: ClassValue[]): string {
  return cn(...classes.map(cls => {
    if (typeof cls === 'string') {
      return styles[cls] || cls;
    }
    if (typeof cls === 'object' && cls !== null) {
      const mapped: Record<string, boolean | undefined | null> = {};
      for (const [key, value] of Object.entries(cls)) {
        mapped[styles[key] || key] = value as boolean | undefined | null;
      }
      return mapped;
    }
    return cls;
  }));
}

export default cn;
