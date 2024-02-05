const mongoose = require('mongoose');

function connectToDatabaseAndSwitch(dbName) {
    const db = mongoose.connection.useDb(dbName);
    return db
}

module.exports = { connectToDatabaseAndSwitch };