const mongoose = require("mongoose");

const payableSchema = new mongoose.Schema({}, { strict: false });

module.exports = { payableSchema };
