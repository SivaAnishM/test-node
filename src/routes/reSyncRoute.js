const express = require("express");
const { resyncForNonOwnedCompany } = require("../util/reSyncClickOperation");
const { connectorAuthentication } = require("../middleware/auth");
const reSyncRoute = express.Router();

reSyncRoute.delete("/onresync", connectorAuthentication, resyncForNonOwnedCompany);

module.exports = reSyncRoute;