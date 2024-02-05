const express = require("express");
const dashboardRoute = express.Router();
const { authentication } = require("../middleware/auth");

const {
  fetchDashboard,
  fetchDashboardDetailsTransactionList,
  fetchDashboardLedgerTransactions,
  fetchDashboardItemDetails,
} = require("../../mobile/controller/dashboard/dashboard");
const { fetchCashData, fetchBankData } = require("../../mobile/controller/dashboard/dashBoardUtil");

//-------------FOR MOBILE--------------//

dashboardRoute.get("/fetch", authentication, fetchDashboard);
dashboardRoute.get(
  "/fetchdetaillist",
  authentication,
  fetchDashboardDetailsTransactionList
);
dashboardRoute.get(
  "/fetchdetail",
  authentication,
  fetchDashboardLedgerTransactions
);
dashboardRoute.get("/fetchselectedtile", authentication, fetchDashboardItemDetails);
dashboardRoute.get("/fetchcash", authentication, fetchCashData);
dashboardRoute.get("/fetchbank", authentication, fetchBankData);


module.exports = dashboardRoute;
