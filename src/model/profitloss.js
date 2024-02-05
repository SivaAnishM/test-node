const mongoose = require("mongoose");

const profitLossSchema = new mongoose.Schema({}, { strict: false });

module.exports = { profitLossSchema };
