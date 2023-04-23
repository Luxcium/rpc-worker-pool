import { normalize } from 'node:path';
/**
 * Returns the relative paths of two absolute paths to their closest common parent folder, excluding common segments.
 *
 * @param {string} path1 - The first absolute path.
 * @param {string} path2 - The second absolute path.
 * @returns {string[]} An array containing the relative paths of both files to their closest common parent folder,
 * excluding the common segments. If there is no common parent folder, the array contains the full paths.
 * @example
 * const paths = getRelativePaths("/path/to/file1.txt", "/path/to/file2.txt");
 * console.log(paths); // ["./file1.txt", "./file2.txt"]
 */
// path.normalize
export function getRelativePaths(path1: string, path2: string): string[] {
  const segments1 = normalize(path1).split('/');
  const segments2 = normalize(path2).split('/');
  const commonSegments = [];
  let i = 0;

  // find the common segments
  while (
    i < segments1.length &&
    i < segments2.length &&
    segments1[i] === segments2[i]
  ) {
    commonSegments.push(segments1[i]);
    i++;
  }

  // remove the common segments from both paths
  segments1.splice(0, commonSegments.length);
  segments2.splice(0, commonSegments.length);

  // if there are no remaining segments, return the file names
  if (segments1.length === 0 && segments2.length === 0) {
    return [
      `.${path1.substring(path1.lastIndexOf('/'))}`,
      `.${path2.substring(path2.lastIndexOf('/'))}`,
    ];
  }

  // create the relative paths
  let relative1 = `.${segments1.map(s => `/${s}`).join('')}`;
  let relative2 = `.${segments2.map(s => `/${s}`).join('')}`;

  // if there are no common segments, add the leading "/"
  if (commonSegments.length === 0) {
    relative1 = `.${path1.substring(0, path1.indexOf(relative1))}${relative1}`;
    relative2 = `.${path2.substring(0, path2.indexOf(relative2))}${relative2}`;
  }

  return [relative1, relative2];
}
