const express = require('express');
const ledgerRoute = express.Router();


const { addLedgerDataInDb } = require('../controller/tally/ledger');
const { authentication } = require('../middleware/auth');
const { ledgerGroupPermissionAuthorization } = require('../../mobile/controller/masterPermissionAuth/ledgerGroupPermission');
const { sendLedgerDataP, sendLedgerForonnector, vouchersAccordingToPartyName, ledgerInfo } = require('../../mobile/controller/ledger/ledgerForMobile');
const { ledgerSummaryDetailViewP, ledgerSoldDetailViewP, ledgerPurchaseDetailViewP } = require("../../mobile/controller/ledger/ledgerDetailView");
const { viewVoucherPermissionAuthorization } = require('../../mobile/controller/vouhcerPermissionAuth/voucherPermissionAuth');
const { VouchersAccToLedgers } = require('../../mobile/controller/voucher/voucherAccordingToLedger');

//-------------FROM CONNECTOR------------//
ledgerRoute.post("/fetchallledgerdata", addLedgerDataInDb)

ledgerRoute.get("/ledgerforconnector", sendLedgerForonnector)

//-------------FOR MOBILE--------------//
ledgerRoute.get("/fetch", authentication, ledgerGroupPermissionAuthorization, sendLedgerDataP);
ledgerRoute.get("/ledgerSummaryViewp", authentication, ledgerSummaryDetailViewP)
ledgerRoute.get("/ledgerSoldView", authentication, ledgerSoldDetailViewP)
ledgerRoute.get("/ledgerpurchaseView", authentication, ledgerPurchaseDetailViewP)

ledgerRoute.get("/fetchallvoucherbypartyname", authentication, vouchersAccordingToPartyName)
ledgerRoute.get("/ledgerinfo", authentication, ledgerInfo)

// ledgerRoute.get("/ledgerpurchaseView", authentication,viewVoucherPermissionAuthorization, ledgerPurchaseDetailView)


//---------------TO DASHBOARD DETAIL VIEW-----------//
ledgerRoute.get("/getvouchersbyledger", authentication, VouchersAccToLedgers)

module.exports = ledgerRoute