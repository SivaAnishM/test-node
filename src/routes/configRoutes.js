const express = require("express");
const configRoute = express.Router();
const { createCompaniesConfig, } = require("../controller/config/companiesConfig");
const { createPermissionConfig } = require("../controller/config/permissionConfig");
const { getCompaniesConfig, getCompaniesByName } = require("../../mobile/controller/companies")
const { authentication, connectorAuthentication } = require('../middleware/auth');
const { upSertConnectorConfigInDB, fetchConnectorConfig } = require("../controller/config/connectorConfig");

//-------------FROM CONNECTOR------------//
configRoute.post("/createCompaniesConfig", createCompaniesConfig);
configRoute.post("/createpermissionconfig", createPermissionConfig);
configRoute.put("/createconnectorconfig", connectorAuthentication, upSertConnectorConfigInDB);
configRoute.get("/fetchconnectorconfig", fetchConnectorConfig);


//-------------FOR MOBILE--------------//
configRoute.get("/getcompaniesconfig", authentication, getCompaniesConfig);
configRoute.post("/getcompaniesname", getCompaniesByName);
// companiesConfigRoute.get("/getpermissionconfig", fetchPermissionConfig);
//companiesConfigRoute.get("/get/:configId", getConfigById);
// configRoute.put("/update/:configId", updateConfig);
// configRoute.delete("/delete/:configId", deleteConfig);


module.exports = { configRoute };