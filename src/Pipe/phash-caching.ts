import createRedisClient from '@luxcium/redis-services';

// Helper function to generate a redis key from an image path
const generateKey = (path: string) => `image:${path}:phash`;

// Higher-order function to create a caching function for phashes
export function createPhashCachingFunction(
  redisClient: typeof createRedisClient,
  computePhash: (path: string) => Promise<string>,
  convertToBinary: (phash: string) => Promise<string>
) {
  return async function (path: string): Promise<string> {
    const key = generateKey(path);
    const redis = redisClient({});
    // Check cache
    let phash = await redis.get(key);

    // If not found in cache, compute phash and store in cache
    if (!phash) {
      try {
        phash = await computePhash(path);
        const binaryPhash = await convertToBinary(phash);
        redis.set(key, binaryPhash);
      } catch (e) {
        // In case of any error, return an empty string
        console.error(e);
        return '';
      }
    }

    return phash || '';
  };
}
