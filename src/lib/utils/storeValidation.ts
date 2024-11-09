import type { StoreDependencyConfig } from "$lib/types/stores";

// src/lib/utils/storeValidation.ts
export function validateStoreDependencies(
  dependencies: Record<string, any>,
  config: StoreDependencyConfig
): void {
  const missing = config.required.filter(dep => !dependencies[dep]);
  if (missing.length > 0) {
    throw new Error(`Missing required store dependencies: ${missing.join(', ')}`);
  }
}