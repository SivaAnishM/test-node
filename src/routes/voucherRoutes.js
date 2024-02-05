const express = require("express");
const voucherRoute = express.Router();

//--------------FOR CONNECTOR-------------//
const {
    AddCoreVouchersInDb,
    AddAccoutingVouchersDataInDb,
    AddVouchersInventoryDataInDb,
    AddVouchersBillDataInDb
} = require("../controller/tally/voucher");
const { authentication } = require('../middleware/auth');
const { addVoucherPermissionAuthorization } = require("../../mobile/controller/vouhcerPermissionAuth/voucherPermissionAuth");

//--------------------sql---------------//
voucherRoute.post("/addcorevouchers", AddCoreVouchersInDb);
voucherRoute.post("/addaccountingvouchers", AddAccoutingVouchersDataInDb);
voucherRoute.post("/addinventoryvouchers", AddVouchersInventoryDataInDb);
voucherRoute.post("/addbillvouchers", AddVouchersBillDataInDb);


//---------------FOR MOBILE-------------------//
const {
    addVoucher,
    VoucherForDayBook,
    // checkInactiveCustomer,
} = require("../../mobile/controller/voucher/voucherDataForMobile");
const { fetchInvoiceP } = require("../../mobile/controller/voucher/invoice");

voucherRoute.get("/fetchinvoice", authentication, fetchInvoiceP);
voucherRoute.post("/create", authentication, addVoucherPermissionAuthorization, addVoucher);
voucherRoute.get("/daybook/fetch", authentication, VoucherForDayBook);



module.exports = voucherRoute;
