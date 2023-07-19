import { createHash } from 'crypto';
// import path from 'path';

function generateHash(str: string) {
  return createHash('sha1').update(str).digest('hex');
}

export default function generateHashFromZipFilePath(zipPath: string) {
  // const source = zipPath.split('/');
  // const randomName = generateHash(path.join(source[source.length - 2],
  // source[source.length - 1]));
  // return randomName;
  return generateHash(zipPath);
}
