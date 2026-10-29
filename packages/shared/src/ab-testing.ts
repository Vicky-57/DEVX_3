import { Experiment, Variant } from './types.js';

/**
 * FNV-1a 32-bit hash implementation for fast, deterministic hashing of strings.
 */
function fnv1a(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return hash >>> 0;
}

/**
 * Deterministically assigns a visitor to an experiment variant based on traffic percentages.
 * Sticky for the same visitorId + experimentId.
 */
export function assignVariant(visitorId: string, experiment: Experiment): Variant {
  if (!experiment.variants || experiment.variants.length === 0) {
    throw new Error(`Experiment ${experiment.id} has no variants.`);
  }

  if (experiment.variants.length === 1) {
    return experiment.variants[0];
  }

  // Calculate deterministic bucket 0..99
  const key = `${experiment.id}:${visitorId}`;
  const hash = fnv1a(key);
  const bucket = hash % 100;

  let cumulative = 0;
  for (const variant of experiment.variants) {
    cumulative += variant.trafficPct;
    if (bucket < cumulative) {
      return variant;
    }
  }

  // Fallback to the last variant in case cumulative total didn't reach 100
  return experiment.variants[experiment.variants.length - 1];
}
