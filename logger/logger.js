const winston = require('winston');
const path = require('path');
const fs = require('fs');
const moment = require('moment');

// Define the directory path for your log files
const logDir = path.join(__dirname, 'allLoges');

// Ensure the log folder exists
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const customTimestamp = () => {
    return moment().format('DD-MM-YYYY HH:mm:ss');
};

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: customTimestamp }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
        new winston.transports.File({ filename: path.join(logDir, 'combined.log') })
    ],
});

module.exports = logger;
