import Redis from 'ioredis';
import { Knex } from 'knex';
import models from '../../models/index.js';
import { redisCache } from '../../plugins/RedisCache.js';
import AppConfig from '../AppConfig.js';

type Config = AppConfig;

declare module 'fastify' {
  export declare namespace fastifyObjectionjs {
    export interface FastifyObjectionObject {
      knex: Knex
      models: typeof models
    }
  }

  interface FastifyInstance {
    config: Config
    objection: fastifyObjectionjs.FastifyObjectionObject
    redis: Redis
    cache: typeof redisCache
  }

  export interface FastifyRequest {
  }

  export interface FastifyReply {
    setApi: (apiObj:{
      status?: string,
      code: string, message: string,
    }) => FastifyReply;
    api: {
      message: string;
      code: string;
      status: string;
    };
  }
}
