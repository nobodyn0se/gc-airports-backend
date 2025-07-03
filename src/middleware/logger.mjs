import winston from 'winston';
const { combine, timestamp, printf, colorize, align } = winston.format;

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    colorize({ all: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS A' }),
    align(),
    printf(
      (log) =>
        `[${log.level}] ${log.timestamp}: ${log.statusCode ? `Status ${log.statusCode}` : ''} ${log.message} ${log.url ? `URL: ${log.url}` : ''}`
    )
  ),
  transports: [new winston.transports.Console()],
});

export default logger;
