const mongoose = require("mongoose");

const godownSchema = new mongoose.Schema({}, { strict: false });

module.exports = { godownSchema };
