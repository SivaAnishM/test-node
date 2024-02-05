const express = require("express");
const cashBankRoute = express.Router();
const { fetchCashBankData } = require("../controller/tally/cashBankData");


//-------------FROM CONNECTOR------------//
cashBankRoute.post("/fetchcashbankdata", fetchCashBankData)

module.exports = cashBankRoute;