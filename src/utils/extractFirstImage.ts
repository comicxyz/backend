import Jimp from 'jimp';
import yauzl from 'yauzl';
import logger from '../workers/logger.js';

export default async function extractFirstImage(
  zipFilePath: string,
): Promise<string> {
  return new Promise((res, rej) => {
    const buff: Uint8Array[] = [];
    yauzl.open(zipFilePath, { lazyEntries: true }, (err, zipFile) => {
      if (err) rej(err);

      try {
        zipFile.readEntry();

        zipFile.on('error', (error: Error) => {
          rej(error);
        });

        zipFile.on('entry', (entry: yauzl.Entry) => {
          if (entry.fileName !== 'ComicInfo.xml') {
            zipFile.openReadStream(entry, (errorOpenStream, readStream) => {
              if (errorOpenStream) rej(errorOpenStream);
              readStream.on('data', (d: Uint8Array) => buff.push(d));
              readStream.on('end', () => {
                zipFile.close();
                const buffer = Buffer.concat(buff);
                Jimp.read(buffer)
                  .then((image) => {
                    let img = image;
                    const w = image.getWidth();
                    const h = image.getHeight();
                    if (w / h > 1.8) {
                      // width is more than twice the height
                      img = img.crop(0, 0, (h * 200) / 300, h);
                    } else if (h / w > 2) { // height is more than twice the width
                      img = img.crop(0, 0, w, (w * 300) / 200);
                    }
                    img
                      .scaleToFit(140, 300)
                      .getBase64Async(Jimp.MIME_PNG)
                      .then((base64) => {
                        res(base64);
                      });
                  })
                  .catch((errRead: Error) => {
                    logger.error({ err: errRead }, 'Error reading image file.');
                    rej(err);
                  });
              });
            });
          } else {
            zipFile.readEntry();
          }
        });

        zipFile.on('end', () => {
          zipFile.close();
          rej(new Error("Couldn't find any image in zip file"));
        });
      } catch (errReadEntry) {
        rej(errReadEntry);
      }
    });
  });
}
