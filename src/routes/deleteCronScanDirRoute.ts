import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { cronScanDirQueue } from '../workers/Queue.js';

export default (app: FastifyInstance) => async (req: FastifyRequest<{
  Body: { key: string } }>, res: FastifyReply) => {
  await cronScanDirQueue.removeRepeatableByKey(req.body.key);
  return res.send({});
};
