const express = require("express");
const balanceSheetRoute = express.Router();
const { authentication } = require('../middleware/auth');

const {
    fetchbalanceSheetData
} = require("../controller/tally/balanceSheet");
const {
    balanceSheetFetch
} = require("../../mobile/controller/balanceSheet/balanceSheet");

//-------------FROM CONNECTOR------------//
balanceSheetRoute.post("/fetchbalancesheet", fetchbalanceSheetData);


//-------------FOR MOBILE--------------//
balanceSheetRoute.get("/sendbalancesheet", authentication, balanceSheetFetch);


module.exports = balanceSheetRoute;
