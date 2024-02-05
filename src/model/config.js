const mongoose = require("mongoose");

const configSchema = new mongoose.Schema({}, { strict: false });

module.exports = { configSchema };
