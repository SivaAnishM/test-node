const express = require("express");
const receivableRoute = express.Router();


const { fetchReceivable } = require("../controller/tally/receivable");
const { fetchOutstanding } = require("../../mobile/controller/outstanding/outstanding");
const { authentication } = require("../middleware/auth");

//-------------FROM CONNECTOR------------//

receivableRoute.post("/fetch", fetchReceivable)

receivableRoute.get("/fetchoutstanding", authentication, fetchOutstanding)

module.exports = receivableRoute;      