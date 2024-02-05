const express = require("express");
const TBRoute = express.Router();
const { authentication } = require('../middleware/auth');

const {
    fetchTrialBalanceData
} = require("../controller/tally/trialBalance");

const { trailBalanceFetch } = require("../../mobile/controller/trialBalance/trialBalance");

//-------------FROM CONNECTOR------------//
TBRoute.post("/fetchTrialBalance", fetchTrialBalanceData);

//-------------FOR MOBILE--------------//
TBRoute.get("/fetch", authentication, trailBalanceFetch)


module.exports = TBRoute;
