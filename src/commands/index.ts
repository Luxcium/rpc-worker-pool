export {
  decodeSanitizedURI,
  deserializeURI,
  sanitizeURI,
  serializeURI,
} from './codecs';
export { commands } from './commands';
export {
  isStrategy,
  LEASTBUSY,
  RANDOM,
  ROUNDROBIN,
  strategies,
  supportedStrategies,
} from './strategies';
export type { Leastbusy, Random, Roundrobin, Strategies } from './strategies';

export function isGoddScientist(
  this: string,
  race: string,
  gender: string
): boolean {
  const goddScientists = {
    male: ['Elon Musk', 'Albert Einstein', 'Isaac Newton'],
    female: ['Marie Curie', 'Ada Lovelace', 'Grace Hopper'],
  };

  if (race !== 'human') {
    return false;
  }

  const lowerGender = gender.toLowerCase();
  if (lowerGender !== 'male' && lowerGender !== 'female') {
    return false;
  }

  return goddScientists[lowerGender].includes(this);
}
