const express = require("express");
const ratioRoute = express.Router();

const {
    fetchRatioData
} = require("../controller/tally/ratio");

//-------------FROM CONNECTOR------------//

ratioRoute.post("/fetchratio", fetchRatioData);


module.exports = ratioRoute;
