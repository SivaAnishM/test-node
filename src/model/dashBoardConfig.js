const mongoose = require("mongoose");

const dashboardConfigSchema = new mongoose.Schema({}, { strict: false });
module.exports = { dashboardConfigSchema };
