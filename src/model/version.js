const mongoose = require("mongoose");

const versionSchema = new mongoose.Schema({}, { strict: false });

module.exports = { versionSchema };
