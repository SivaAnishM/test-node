const mongoose = require("mongoose");

const receivableSchema = new mongoose.Schema({}, { strict: false });

module.exports = { receivableSchema };
