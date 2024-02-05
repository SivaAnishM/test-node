const express = require("express");
const profitLossRoute = express.Router();
const { authentication } = require('../middleware/auth');

const {
    fetchProfitLossData
} = require("../controller/tally/profitLoss");

const {
    profitLossFetch
} = require("../../mobile/controller/profitLoss/profitLoss");

 
//-------------FROM CONNECTOR------------//
profitLossRoute.post("/fetchprofitloss", fetchProfitLossData);

//-------------FOR MOBILE--------------//
profitLossRoute.get("/sendprofitLoss", authentication, profitLossFetch);


module.exports = profitLossRoute;       