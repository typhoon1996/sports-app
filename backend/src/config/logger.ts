import winston from 'winston';

const level = process.env.NODE_ENV === 'development' ? 'debug' : 'info';

const logger = winston.createLogger({
  level: level,
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} ${level}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
  ],
});

export default logger;