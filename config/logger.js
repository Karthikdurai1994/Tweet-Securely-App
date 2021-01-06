const { json } = require("body-parser");
const { createLogger, transports, format } = require("winston");
const winston = require("winston");
const { splat, combine, timestamp, printf } = winston.format;
require("winston-mongodb");

//Formatting Log Data
const myFormatter = winston.format((info) => {
  const { message } = info;
  if (info) {
    info.message = info.message.data;
  }
  return info;
})();

//Creating Log Structure
const logger = createLogger({
  format: winston.format.combine(
    winston.format.timestamp({
      format: "DD-MM-YYYY hh:mm:ss A",
    }),
    myFormatter
  ),
  transports: [
    new transports.File({
      filename: "info.log",
      level: "info",
      format: format.combine(format.timestamp(), format.json()),
    }),
    new transports.MongoDB({
      level: "info",
      db: process.env.MONGODB_PATH,
      format: format.combine(format.timestamp(), format.json()),
      options: { useUnifiedTopology: true },
    }),
  ],
});

module.exports = logger;
