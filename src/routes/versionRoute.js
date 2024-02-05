const express = require("express");
versionRoute = express.Router();

const { getCurrentVersion } = require("../controller/Version/version");

versionRoute.get("/getversion", getCurrentVersion);

module.exports = versionRoute;
