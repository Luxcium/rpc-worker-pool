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
