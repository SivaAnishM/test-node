const express = require("express");
const { fetchExpenses } = require("../../mobile/controller/report/expenses");
const { connectorAuthentication } = require("../middleware/auth");
const { topReports } = require("../../mobile/controller/report/topReports");
const reportRoute = express.Router();

reportRoute.get("/expenses", connectorAuthentication, fetchExpenses)
reportRoute.get("/topreport", connectorAuthentication, topReports)

module.exports = reportRoute;