const mongoose = require("mongoose");

const connectorVersionSchema = new mongoose.Schema({}, { strict: false });

module.exports = { connectorVersionSchema };