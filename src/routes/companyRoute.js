const express = require("express");
const { saveCompaniesData, checkTallyLicence, deleteCompany, updateCompanyInfo } = require("../controller/company/company");
const { connectorAuthentication } = require("../middleware/auth");
const { companyInfoThroughToken } = require("../util/incrementalSyncUtil/incrementalSync");
const { previouslyCompanyExists } = require("../util/dbPreviouslyExits");
const companyRoute = express.Router();


//-------------FROM CONNECTOR------------//

companyRoute.post("/create", saveCompaniesData);
companyRoute.post("/check", checkTallyLicence);
companyRoute.delete("/delete", connectorAuthentication, deleteCompany);
companyRoute.get("/companiesinfofromtoken", connectorAuthentication, companyInfoThroughToken);

companyRoute.get("/dbexistcheck", connectorAuthentication, previouslyCompanyExists);
companyRoute.patch("/updatecompanyinfo",connectorAuthentication, updateCompanyInfo);

module.exports = companyRoute;
