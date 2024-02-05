const express = require("express");
const voucherTypeRoute = express.Router();
const { authentication } = require('../middleware/auth');

const { addVoucherTypeDataInDb, fillTheEmptyReserveName } = require("../controller/tally/voucherTypes");

const { sendvoucherTypeData, fetchChildsOfVoucherType } = require("../../mobile/controller/voucher/voucherTypes");

//-------------FROM CONNECTOR------------//
voucherTypeRoute.post("/addvouchertypeindb", addVoucherTypeDataInDb);
voucherTypeRoute.put("/updateemptyreservename", fillTheEmptyReserveName);


//-------------FOR MOBILE--------------//
voucherTypeRoute.get("/getvouchertype", authentication, sendvoucherTypeData);
voucherTypeRoute.get("/fetchchild", authentication, fetchChildsOfVoucherType);

module.exports = voucherTypeRoute;
