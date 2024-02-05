const mongoose = require("mongoose");

const dumpSchema = new mongoose.Schema({}, { strict: false });

module.exports = { dumpSchema };
