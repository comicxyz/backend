import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { readdir, stat } from 'fs/promises';
import path from 'path';
import { GetInfoFunctionType } from '../@types/DownloaderInterfaces';

export default function getDownloadersRoute(app: FastifyInstance) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // get all directories using fs in services
    // return them as an array
    const dirs = await readdir(app.config.DOWNLOADERS_DIR);
    const services = await Promise.all(dirs.map(async (dir) => {
      const isDir = (await stat(path.join('.', app.config.DOWNLOADERS_DIR, dir))).isDirectory();
      if (!isDir) {
        return undefined;
      }

      try {
        const info = await import(`../../${app.config.DOWNLOADERS_DIR}/${dir}/getInfo.js`) as { default: GetInfoFunctionType };
        if (info) {
          return { ...info.default(), dir };
        }
        return {};
      } catch (err) {
        return { dir, err: (err as Error).message };
      }
    }));
    return reply.send({ services: services.filter((x) => !!x) });
  };
}
