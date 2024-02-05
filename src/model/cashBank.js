const mongoose = require("mongoose");

const cashBankSchema = new mongoose.Schema({}, { strict: false });

module.exports = { cashBankSchema };
