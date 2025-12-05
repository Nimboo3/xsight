import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: isDev ? 'debug' : 'info',
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
          singleLine: false,
        },
      }
    : undefined,
  base: {
    env: process.env.NODE_ENV,
  },
  redact: {
    paths: ['req.headers.authorization', 'accessToken', 'password'],
    censor: '[REDACTED]',
  },
});

// Child logger factory for specific modules
export function createLogger(module: string) {
  return logger.child({ module });
}

export default logger;

