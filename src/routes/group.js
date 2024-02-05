const express = require("express");
const groupRoute = express.Router();


const { addGroupsIndb, sendGroupsNameList, fillTheEmptyGroupReserveName } = require("../controller/tally/group");
const { groupNameForFilterbar } = require("../../mobile/util/groupNameForFilterbar");

//-------------FROM CONNECTOR------------//
groupRoute.post("/fetch", addGroupsIndb)
groupRoute.put("/updateemptygroupreservename", fillTheEmptyGroupReserveName)
groupRoute.get("/fetchgroupnames", sendGroupsNameList)

groupRoute.get("/groupnameforfilterbar", groupNameForFilterbar)


module.exports = groupRoute;