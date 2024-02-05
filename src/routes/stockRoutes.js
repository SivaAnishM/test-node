const express = require("express");
const stockRoute = express.Router();

const {
    addStockItemDataInDb,
    addStockGroupDataInDb,
} = require("../controller/tally/stockItems");

const {
    sendStockData,
    fetchPrimaryGroups,
    fetchSelectedGroups,
} = require("../../mobile/controller/stocks/stocks");
const { authentication } = require("../middleware/auth");
const {
    stockGroupPermissionAuthorization,
} = require("../../mobile/controller/masterPermissionAuth/stockGroupPermission");

const {
    itemSummaryDetailViewP,
    itemCustomersDetailviewP,
    itemSuppliersDetailViewP,
} = require("../../mobile/controller/stocks/stockDetailView");

//-------------FROM CONNECTOR------------//

stockRoute.post("/fetchStockGrouplist", addStockGroupDataInDb);
stockRoute.post("/addstockitemindb", addStockItemDataInDb);

//-------------FOR MOBILE--------------//

stockRoute.get(
    "/fetch",
    authentication,
    stockGroupPermissionAuthorization,
    sendStockData
);
stockRoute.get(
    "/fetchprimarystockgrouplist",
    authentication,
    stockGroupPermissionAuthorization,
    fetchPrimaryGroups
);
stockRoute.get("/fetchselectedgroup", authentication, fetchSelectedGroups);

stockRoute.get("/itemsummaryview", authentication, itemSummaryDetailViewP);
stockRoute.get("/itemcustomersview", authentication, itemCustomersDetailviewP);
stockRoute.get("/itemsuppliersview", authentication, itemSuppliersDetailViewP);

module.exports = stockRoute;
