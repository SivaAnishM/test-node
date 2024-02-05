const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({}, { strict: false });

module.exports = { companySchema }