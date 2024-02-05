const express = require("express");
const billRoute = express.Router();
const { authentication } = require('../middleware/auth');

const { fetchBillByLedgerName } = require("../../mobile/controller/transaction/bills");

//-------------FOR MOBILE--------------//
billRoute.get("/fetchbill",authentication, fetchBillByLedgerName);

module.exports = billRoute;