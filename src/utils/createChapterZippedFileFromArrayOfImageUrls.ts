/* eslint-disable no-console */

import path from 'path';
import { unlink } from 'fs/promises';
import { AxiosRequestHeaders } from 'axios';
import { FastifyBaseLogger } from 'fastify';
import convertWebpToJpg from './convertWebpToJpg.js';
import downloadImage from './downloadImage.js';

function createChapterZippedFileFromArrayOfImageUrls(
  images: string[],
  dirPath: string,
  log: FastifyBaseLogger,
  config?: { headers?: Partial<AxiosRequestHeaders> },
) {
  return images.reduce<Promise<boolean>>(async (prev, img, index):
  Promise<boolean> => {
    if (index > 0) await prev;

    if (img && index !== undefined) {
      const extension = path.extname(img);
      const imgSaveAs = path.join(dirPath, `${index.toString().padStart(3, '0')}${extension}`);
      log.info('Downloading %s as %s', img, imgSaveAs);
      return downloadImage(
        img,
        imgSaveAs,
        config,
      )
        .then(() => {
          if (process.env.SKIP_CONVERT_WEBP) {
            return true;
          }
          if (extension.toLowerCase() === '.webp') {
            log.info('Converting webp %s', imgSaveAs);
            return convertWebpToJpg(imgSaveAs, path.join(dirPath, `${index.toString().padStart(3, '0')}.jpg`));
          }
          return true;
        })
        .then(() => {
          if (process.env.SKIP_CONVERT_WEBP) {
            return true;
          }
          if (extension.toLowerCase() === '.webp') {
            log.info('Deleting webp %s', imgSaveAs);
            return unlink(imgSaveAs)
              .then(() => true);
          }
          return true;
        });
    }
    throw new Error('Error image not found');
  }, Promise.resolve(true));
}

export default createChapterZippedFileFromArrayOfImageUrls;
