import { FastifyError, FastifyInstance } from 'fastify';
import ApiError from './ApiError.js';
import ClientError from './ClientError.js';

type ErrorHandler = Parameters<FastifyInstance['setErrorHandler']>[0];
type SetErrorHandlerParams = Parameters<ErrorHandler>;

const errorHandler:ErrorHandler = function errorHandler(
  ...[error, request, reply]: SetErrorHandlerParams
) {
  if (error instanceof ClientError) {
    this.log.error({ err: error, xlog: true });
    // Send error response
    return reply
      .setApi({ message: error.message, status: error.status, code: error.code })
      .status(400)
      .send({ ...error.data, error: error.originalError });
  }

  if (error instanceof ApiError) {
    this.log.error({ err: error, xlog: true });
    // Send error response
    return reply
      .setApi({ message: error.message, status: error.status, code: error.code })
      .status(500)
      .send({ ...error.data, error: error.originalError });
  }

  const fastifyError = error as FastifyError;

  this.log.fatal({ err: error, xlog: true });

  return reply
    .setApi({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unknown error has occured.',
    })
    .status(500)
    .send({
      error: {
        message: error.message,
        stack: error.stack,
        code: fastifyError.code === undefined ? '500' : fastifyError.code,
      },
    });
};

export default errorHandler;
