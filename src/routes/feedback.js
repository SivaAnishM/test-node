const express = require("express");
const userRoute = express.Router();
const { authentication, connectorAuthentication } = require("../middleware/auth");

const {
  feedback
} = require("../controller/feedback/feedback"); 


userRoute.post("/givefeedback", feedback);

module.exports = userRoute;