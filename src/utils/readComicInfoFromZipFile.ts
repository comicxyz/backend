import yauzl from 'yauzl';
import logger from '../workers/logger.js';

export default async function readComicInfoFromZipFile(
  zipFilePath: string,
): Promise<string | null> {
  return new Promise((res, rej) => {
    const buff: Uint8Array[] = [];
    yauzl.open(zipFilePath, { lazyEntries: true }, (err, zipFile) => {
      if (err) {
        logger.error({ err, zipFilePath }, 'Error opening zip file');
        return rej(err);
      }

      zipFile.readEntry();

      zipFile.on('error', (error: Error) => rej(error));

      zipFile.on('entry', (entry: yauzl.Entry) => {
        if (entry.fileName === 'ComicInfo.xml') {
          zipFile.openReadStream(entry, (errorOpenStream, readStream) => {
            if (errorOpenStream) throw errorOpenStream;
            readStream.on('data', (d: Uint8Array) => buff.push(d));
            readStream.on('end', () => {
              zipFile.close();
              res(Buffer.concat(buff).toString());
            });
          });
        } else {
          zipFile.readEntry();
        }
      });

      zipFile.on('end', () => {
        zipFile.close();
        res(null);
      });

      return zipFile;
    });
  });
}
