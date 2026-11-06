import { TraceNode } from '@erixcel/traceflow';

export class StringFunction {
  @TraceNode({ name: 'string.sanitizeStringFields', type: 'method' })
  static sanitizeStringFields<T>(obj: T, exclude: string[] = ['password']): T {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (obj instanceof Date) {
      return obj;
    }

    // Handle arrays explicitly if we want to sanitize strings inside arrays
    if (Array.isArray(obj)) {
      return obj.map((item) => StringFunction.sanitizeStringFields(item, exclude)) as unknown as T;
    }

    const result = { ...obj } as Record<string, unknown>;

    for (const key of Object.keys(result)) {
      // Skip excluded keys (case-sensitive check)
      if (exclude.includes(key)) {
        continue;
      }

      const value = result[key];

      if (typeof value === 'string') {
        // Apply transforms: trim, lowercase, replace multiple spaces with single space
        result[key] = value.trim().toLowerCase().replace(/\s+/g, ' ');
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects
        result[key] = StringFunction.sanitizeStringFields(value, exclude);
      }
    }

    return result as T;
  }
}
