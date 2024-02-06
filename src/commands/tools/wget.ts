import { promisify } from 'node:util';

import { exec } from 'child_process';

import { sanitizeURI } from './codecs';

export async function wget(
  imageSource: string,
  destination: string,
  shell = '/bin/bash'
) {
  const sourceUrl = sanitizeURI(imageSource);
  const destinationPath = `/downloads/${decodeURIComponent(destination)}`;
  const execCommand = `/usr/bin/wget --debug -nc "${sourceUrl}" -P "${destinationPath}"`;

  // BUG: Debbuging using a temporary halt on this function call....
  // promisify(exec);
  // execCommand;
  // {
  //   shell;
  // }
  // console.log({ destination });
  // return 'dummy load';
  // FIX: Debbuging using a temporary halt on this function call....

  return promisify(exec)(execCommand, { shell });
}
