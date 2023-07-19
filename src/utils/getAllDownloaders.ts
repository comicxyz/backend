import recursiveReadDir from 'recursive-readdir';
import { join } from 'path';
import { GetInfoFunctionType } from '../@types/DownloaderInterfaces';

export default async function getAllDownloaders(dir: string) {
  const services: Record<string, string> = {};

  const files = await recursiveReadDir(join('.', dir));
  await Promise.all(
    files.map(async (file) => {
      if (file.endsWith('getInfo.js')) {
        const { default: getInfo } = await import(`../../${file}`) as { default: GetInfoFunctionType };
        const info = getInfo();
        const parentDir = file.split('/').slice(-2)[0];
        info.domains.forEach((domain) => {
          services[domain] = parentDir;
        });
      }
      return file;
    }),
  );
  return services;
}
