const express = require("express");
connectorVersionRoute = express.Router();

const { getCurrentConnectorVersion } = require("../controller/ConnectorVersion/ConnectorVersion");

connectorVersionRoute.get("/getconnectorversion", getCurrentConnectorVersion);

module.exports = connectorVersionRoute;