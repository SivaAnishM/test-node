const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({}, { strict: false });

module.exports = { feedbackSchema };