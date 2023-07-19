// Adjust FastifyInstance interace at src/@types/fastify/index.d.ts
//
// declare module 'fastify' {
//     interface FastifyInstance {
//         config : {
//             ...... // your config matching schema
//         }
//     }
// }

export const ScanDirConfigSchema = {
  SCAN_DIR_ENABLED: { type: 'boolean', default: true },
  SCAN_DIR_NUM_WORKERS: { type: 'integer', default: 1 },
  SCAN_DIR_PATH: { type: 'string', minLength: 1 },
  SCAN_DIR_EXT: { type: 'array', items: { type: 'string' }, default: ['.cbz'] },
  SCAN_DIR_SKIP_EXISTING: { type: 'boolean', default: true },
  SCAN_DIR_CRON: { type: 'string', minLength: 1, default: '0 0 * * *' },
  // true = always
  // ifNoCover = only if no cover (new files will be updated too)
  // newOnly = only new files
  // false = never
  SCAN_DIR_EXTRACT_COVER: {
    type: 'string',
    enum: ['always', 'noCoverOnly', 'newOnly', 'never',
      'always-deferred', 'noCoverOnly-deferred', 'newOnly-deferred'],
    default: 'never',
  },
};

const configSchema = {
  type: 'object',
  required: ['PORT', 'NODE_ENV', 'LOG_LEVEL'],
  properties: {
    ...ScanDirConfigSchema,
    SCAN_DIR_EXT: {
      separator: ',',
      type: 'string',
      default: '.cbz',
    },
    MANGA_DIR: {
      type: 'string',
      default: '/manga/',
    },
    MANGA_DIR_TEMP: {
      type: 'string',
      default: '/manga-temp/',
    },
    DOWNLOADERS_DIR: {
      type: 'string',
      default: 'dist/downloaders',
    },
    NUM_CHAPTER_WORKERS: {
      type: 'number',
      default: 5,
    },
    HOST: {
      type: 'string',
      default: '0.0.0.0',
    },
    PORT: {
      type: 'number',
      default: 3000,
    },
    DEBUG_DB: {
      type: 'boolean',
      default: false,
    },
    NODE_ENV: {
      type: 'string',
      enum: ['development', 'production', 'test', 'local'],
      default: 'development',
    },
    LOG_LEVEL: {
      type: 'string',
      enum: ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'],
      default: 'trace',
    },
    REDIS_HOST: {
      type: 'string',
      default: 'localhost',
    },
    REDIS_DB: {
      type: 'number',
      default: 0,
    },
    REDIS_PORT: {
      type: 'number',
      default: 6379,
    },
    REDIS_SENTINEL_MASTER: {
      type: 'string',
    },
    REDIS_SENTINEL: {
      type: 'string',
    },
    REDIS_PASS: {
      type: 'string',
    },
    DB_HOST: {
      type: 'string',
      default: 'localhost',
    },
    DB_NAME: {
      type: 'string',
    },
    DB_PORT: {
      type: 'number',
      default: 5432,
    },
    DB_USER: {
      type: 'string',
    },
    DB_PASSWORD: {
      type: 'string',
    },
    DISABLE_FTP_SERVER: {
      type: 'boolean',
      default: false,
    },
    FTP_HOST: {
      type: 'string',
      default: '0.0.0.0',
    },
    FTP_PORT: {
      type: 'number',
      default: 21,
    },
    FTP_USER: {
      type: 'string',
      default: 'user',
    },
    FTP_PASSWORD: {
      type: 'string',
      default: 'password',
    },
    FTP_ROOT: {
      type: 'string',
      default: '/',
      enum: ['/', '/all', '/read', '/unread'],
    },
    FTP_PASV_URL: {
      type: 'string',
    },
    FTP_PASV_PORT_MIN: {
      type: 'number',
      default: 10000,
    },
    FTP_PASV_PORT_MAX: {
      type: 'number',
      default: 10100,
    },
  },
};

export default configSchema;
