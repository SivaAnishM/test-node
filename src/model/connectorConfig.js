const mongoose = require("mongoose");

const connectorConfigSchema = new mongoose.Schema({}, { strict: false });

module.exports = { connectorConfigSchema };
