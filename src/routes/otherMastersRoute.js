const express = require("express");
const otherMasterRoute = express.Router();


const { addcostCategoryIndb } = require("../controller/tally/otherMasters/costCategory");
const { addgstEffectiveRateIndb } = require("../controller/tally/otherMasters/gsteffectiveRate");
const { addcostCentreIndb } = require("../controller/tally/otherMasters/costCentre");
const { addOpeningBatchAllocationIndb } = require("../controller/tally/otherMasters/openingBatchAllocation");
const { addOpeningBillAllocationIndb } = require("../controller/tally/otherMasters/openingBillAllocation");


otherMasterRoute.post("/createcostcategory", addcostCategoryIndb)
otherMasterRoute.post("/createcostcentre", addcostCentreIndb)
otherMasterRoute.post("/creategsteffectiverate", addgstEffectiveRateIndb)
otherMasterRoute.post("/createopeningbatchallocation", addOpeningBatchAllocationIndb)
otherMasterRoute.post("/createopeningbillallocation", addOpeningBillAllocationIndb)



module.exports = otherMasterRoute;