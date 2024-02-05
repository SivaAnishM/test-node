const mongoose = require("mongoose");

const dbIndexSchema = new mongoose.Schema({}, { strict: false });

module.exports = { dbIndexSchema };
