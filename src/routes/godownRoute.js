const express = require("express");
const godownRoute = express.Router();
const { authentication } = require('../middleware/auth');
const { createGodownInDb } = require("../controller/tally/godown");
const { fetchGodowns } = require("../../mobile/controller/stocks/godowns");
const { createUnitsInDb } = require("../controller/tally/units");

//-------------FROM CONNECTOR------------//
godownRoute.post("/creategodown", createGodownInDb)
godownRoute.post("/createunit", createUnitsInDb)

//-------------FOR MOBILE--------------//
godownRoute.get("/fetchgodowns", authentication, fetchGodowns)

module.exports = godownRoute;