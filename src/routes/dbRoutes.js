const express = require("express");
const dbRoute = express.Router();

const { checkAndCreateDb } = require("../util/checkAndCreateDb");
const { connectorAuthentication } = require("../middleware/auth");

dbRoute.post("/checkandcreatedb",connectorAuthentication, checkAndCreateDb);

module.exports = dbRoute;