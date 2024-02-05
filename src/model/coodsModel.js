const mongoose = require("mongoose");

const coodsModel = new mongoose.Schema({}, { strict: false });

module.exports = mongoose.model("cood", coodsModel);
