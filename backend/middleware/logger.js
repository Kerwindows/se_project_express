const winston = require('winston');
const expressWinston = require('express-winston');

const requestLogger = expressWinston.logger({
  transports: [
    new winston.transports.File({ filename: './errors/request.log' }),
  ],
  format: winston.format.json(),
});

const errorLogger = expressWinston.errorLogger({
  transports: [new winston.transports.File({ filename: './errors/error.log' })],
  format: winston.format.json(),
});

module.exports = { requestLogger, errorLogger };
