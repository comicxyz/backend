import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { rimraf } from 'rimraf';
import path from 'path';
import downloadImage from '../utils/downloadImage.js';
import unzip from '../utils/unzip.js';
import generateHashFromZipFilePath from '../utils/generateHashFromZipFilePath.js';

export default function downloadDownloaderRoute(app: FastifyInstance) {
  return async (request: FastifyRequest<{ Body: { url: string } }>, reply: FastifyReply) => {
    const { url } = request.body;
    const tempFilename = generateHashFromZipFilePath(url);
    const tempFilepath = path.join('.', app.config.DOWNLOADERS_DIR, tempFilename);

    // ESM doesnot support __dirname
    const currentDir = path.resolve();

    await downloadImage(url, tempFilepath);
    await unzip(tempFilepath, path.join(currentDir, `${app.config.DOWNLOADERS_DIR}`));
    await rimraf(tempFilepath);
    reply.send('ok');
  };
}
