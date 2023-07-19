import { pino } from 'pino';

type BaseLogger = pino.BaseLogger & {
  child(bindings: pino.Bindings, options?: pino.ChildLoggerOptions): BaseLogger
};

export default BaseLogger;
