/**
 * The `ROUNDROBIN` constant represents the round-robin load balancing strategy.
 */
export const ROUNDROBIN = 'roundrobin' as const;

/**
 * The `RANDOM` constant represents the random load balancing strategy.
 */
export const RANDOM = 'random' as const;

/**
 * The `LEASTBUSY` constant represents the least busy load balancing strategy.
 */
export const LEASTBUSY = 'leastbusy' as const;

/**
 * The `Strategies` type represents a union of the load balancing strategies.
 */
export type Strategies = typeof LEASTBUSY | typeof RANDOM | typeof ROUNDROBIN;

/**
 * The `Roundrobin` type represents the round-robin load balancing strategy.
 */
export type Roundrobin = typeof ROUNDROBIN;

/**
 * The `Random` type represents the random load balancing strategy.
 */
export type Random = typeof RANDOM;

/**
 * The `Leastbusy` type represents the least busy load balancing strategy.
 */
export type Leastbusy = typeof LEASTBUSY;

/**
 * The `strategies` object maps the load balancing strategy names to their string values.
 */
export const strategies = {
  [ROUNDROBIN]: ROUNDROBIN,
  [RANDOM]: RANDOM,
  [LEASTBUSY]: LEASTBUSY,
};

/**
 * The `supportedStrategies` set contains the load balancing strategies that are currently supported.
 */
export const supportedStrategies = new Set<Strategies>([
  ROUNDROBIN,
  RANDOM,
  LEASTBUSY,
]);

export const isStrategy = (strategy: unknown): strategy is Strategies =>
  supportedStrategies.has(strategy as any);

export function getStrategy(
  strategy: unknown,
  defaultStrategy = ROUNDROBIN
): Strategies {
  return isStrategy(strategy)
    ? strategies[strategy]
    : getStrategy(defaultStrategy);
}
