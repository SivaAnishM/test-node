const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({}, { strict: false });

module.exports = { sessionSchema }