const express = require("express");
const dashBoardConfigRoute = express.Router();
const { authentication } = require('../middleware/auth');

const {
    createDashBoardConfig,
    getAllDashBoardConfig,
    getConfigById,
    updateConfig,
    deleteConfig
} = require("../../mobile/controller/dashBoardConfig");


//-------------FROM CONNECTOR------------//
dashBoardConfigRoute.post("/create", createDashBoardConfig);

//-------------FOR MOBILE--------------//
dashBoardConfigRoute.get("/get", getAllDashBoardConfig);
dashBoardConfigRoute.get("/get/:configId", getConfigById);
dashBoardConfigRoute.put("/update/:configId", authentication, updateConfig);
dashBoardConfigRoute.delete("/delete/:configId", authentication, deleteConfig);


module.exports = dashBoardConfigRoute;