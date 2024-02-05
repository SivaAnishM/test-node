const mongoose = require("mongoose");

const syncedCompanySchema = new mongoose.Schema({}, { strict: false });

module.exports = { syncedCompanySchema }