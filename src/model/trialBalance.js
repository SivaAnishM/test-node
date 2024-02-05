const mongoose = require("mongoose");

const trialBalanceSchema = new mongoose.Schema({}, { strict: false });

module.exports = { trialBalanceSchema };
