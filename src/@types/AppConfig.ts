export type DatabaseConfigType = {
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER?: string;
  DB_PASSWORD?: string;
  DB_DEBUG: boolean;
};

export type RedisConfigType = {
  REDIS_SENTINEL?: string;
  REDIS_SENTINEL_MASTER?: string;
  REDIS_PASS?: string;
  REDIS_DB?: number;
  REDIS_PORT?: number;
  REDIS_HOST?: string;
};

export type ScanDirConfigType = {
  SCAN_DIR_ENABLED: boolean;
  SCAN_DIR_EXT: string[];
  SCAN_DIR_SKIP_EXISTING: boolean;
  SCAN_DIR_CRON: string;
  SCAN_DIR_NUM_WORKERS: number;
  SCAN_DIR_EXTRACT_COVER: 'always' | 'noCoverOnly' | 'never' ;
};

export type FTPConfigType = {
  DISABLE_FTP_SERVER?: boolean;
  FTP_HOST?: string;
  FTP_PORT?: number;
  FTP_USER?: string;
  FTP_PASSWORD?: string;
  FTP_ROOT: string;
  FTP_PASV_URL?: string;
  FTP_PASV_PORT_MIN: number;
  FTP_PASV_PORT_MAX: number;
};

export type AppConfig = ScanDirConfigType &
RedisConfigType &
DatabaseConfigType & {
  MANGA_DIR: string;
  MANGA_DIR_TEMP: string;
  DOWNLOADERS_DIR: string;
  LOG_LEVEL: string;
  NODE_ENV: string;
  PORT: number;
  HOST: string;
  NUM_CHAPTER_WORKERS: number;
};
