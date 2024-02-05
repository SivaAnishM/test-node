const express = require("express");
const payableRoute = express.Router();


const { fetchPayable } = require("../controller/tally/payable")

//-------------FROM CONNECTOR------------//
payableRoute.post("/fetch", fetchPayable)


module.exports = payableRoute; 