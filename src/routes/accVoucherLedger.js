const express = require("express");
const accVoucherLedgerRoute = express.Router();

const { authentication } = require('../middleware/auth');
const { taxLedger } = require("../../mobile/controller/accountingLedgerForVoucher/taxLedger")
const { fetchSalesLedgerData } = require('../../mobile/controller/accountingLedgerForVoucher/salesLedger');
const { fetchCashAndBankList } = require("../../mobile/controller/accountingLedgerForVoucher/cashAndBankList");


//-------------FOR MOBILE--------------//
accVoucherLedgerRoute.get("/fetch", authentication, fetchSalesLedgerData)
accVoucherLedgerRoute.get("/fetchtax", authentication, taxLedger)
accVoucherLedgerRoute.get("/fetchcashbanklist", authentication, fetchCashAndBankList) // To be implemented later as it's not present in Postgres

module.exports = accVoucherLedgerRoute;