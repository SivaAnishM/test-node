const mongoose = require("mongoose");

const balanceSheetSchema = new mongoose.Schema({}, { strict: false });

module.exports = { balanceSheetSchema };
