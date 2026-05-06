export function sanitizeStringFields<T>(obj: T, exclude: string[] = ['password']): T {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (obj instanceof Date) {
    return obj;
  }

  // Handle arrays explicitly if we want to sanitize strings inside arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeStringFields(item, exclude)) as unknown as T;
  }

  const result: any = { ...obj };

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
      result[key] = sanitizeStringFields(value, exclude);
    }
  }

  return result;
}
