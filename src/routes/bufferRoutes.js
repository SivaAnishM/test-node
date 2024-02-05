const express = require("express");
const bufferRoute = express.Router();
const { authentication } = require('../middleware/auth');

const {
    fetchBufferData,
    updateBufferById,
    deleteBufferById,
    fetchVoucherFromBufferByUserId,
    fetchPendingVouchers,
    fetchCompletedVouchers,
} = require("../controller/buffer/buffer");


//-------------FOR MOBILE AND CONNECTOR--------------//

bufferRoute.get("/fetch", fetchBufferData);
bufferRoute.put("/update/:id", updateBufferById);
bufferRoute.put("/delete/:id", deleteBufferById);
bufferRoute.get("/myvouchers", authentication, fetchVoucherFromBufferByUserId);
bufferRoute.get("/mypendingvouchers", authentication, fetchPendingVouchers);
bufferRoute.get("/mycompletevouchers", authentication, fetchCompletedVouchers);

module.exports = bufferRoute;
