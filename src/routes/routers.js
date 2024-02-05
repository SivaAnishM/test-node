const express = require("express");
const route = express.Router();

const ledgerRoute = require("./ledgerRoutes");
const voucherRoute = require("./voucherRoutes");
const stockRoute = require("./stockRoutes");
const TBRoute = require("./trialBalanceRoutes");
const ratioRoute = require("./ratioRoutes");
const profitLossRoute = require("./profitLossRoutes");
const dashBoardConfigRoute = require("./dashBoardConfig");
const bufferRoute = require("./bufferRoutes");
const voucherTypeRoute = require("./voucheraTypeRoute");
const accVoucherLedgerRoute = require("./accVoucherLedger");
const groupRoute = require("./group");
const balanceSheetRoute = require("./balanceSheet");
const cashBankRoutes = require("./cashBankRoute");
const userRoute = require("./user");
const dashboardRoute = require("./dashboard");
const receivableRoute = require("./receivable");
const payableRoute = require("./payable");
const billRoute = require("./billsRoute");
const godownRoute = require("./godownRoute");
const companyRoute = require("./companyRoute");
const otherMasterRoute = require("./otherMastersRoute");
const getCurrentVersion = require("./versionRoute");
const getCurrentConnectorVersion = require("./connectorVersionRoute");
const feedback = require("./feedback");
const reSync = require("./reSyncRoute");
const reportRoute = require("./reportRoutes");
const dbRoute = require("./dbRoutes");

//FUNCTION FOR CHECKING COLLECTION IS PRESENT OR NOT
route.get("/", (req, res) => {
  res.status(200).send({ msg: "Tally-cloud is running..", active: true });
});

const { collectionCheck } = require("../util/collectionCheck");

route.post("/collectioncheck", collectionCheck);

//-------------------------------------//
const { configRoute } = require("./configRoutes");

const {
  inactiveCustomers,
} = require("../../mobile/controller/inactiveData/inactiveCustomer");
const {
  inactiveItems,
} = require("../../mobile/controller/inactiveData/inactiveItem");
const {
  authentication,
  connectorAuthentication,
} = require("../middleware/auth");
const {
  fetchLetestAlterIdFromPg,
  checkIfCompanyExistsUnderUser,
} = require("../util/incrementalSyncUtil/incrementalSync");

route.get("/inactivecustomers", authentication, inactiveCustomers);
route.get("/inactiveitems", authentication, inactiveItems);
route.get("/fetchletestalterid", fetchLetestAlterIdFromPg);
route.get(
  "/checkifcompanyexistsunderuser",
  connectorAuthentication,
  checkIfCompanyExistsUnderUser
);

//-----------------------------------//

route.use("/accvoucherledger", accVoucherLedgerRoute);
route.use("/balancesheet", balanceSheetRoute);
route.use("/bill", billRoute);
route.use("/buffer", bufferRoute);
route.use("/cashbank", cashBankRoutes);
route.use("/companiesconfig", configRoute); //Config
route.use("/dashboard", dashboardRoute);
route.use("/config", dashBoardConfigRoute);
route.use("/godown", godownRoute);
route.use("/group", groupRoute);
route.use("/ledger", ledgerRoute);
route.use("/payable", payableRoute);
route.use("/profitloss", profitLossRoute);
route.use("/ratio", ratioRoute);
route.use("/receivable", receivableRoute);
route.use("/stock", stockRoute);
route.use("/trialbalance", TBRoute);
route.use("/user", userRoute);
route.use("/feedback", feedback);
route.use("/vouchertype", voucherTypeRoute);
route.use("/voucher", voucherRoute);
route.use("/company", companyRoute);
route.use("/othermaster", otherMasterRoute);
route.use("/currentVersion", getCurrentVersion);
route.use("/currentConnectorVersion", getCurrentConnectorVersion);
route.use("/resync", reSync);
route.use("/report", reportRoute);
route.use("/db", dbRoute);
const {
  checkIfCompanyExists,
} = require("../controller/checkcompany/checkCompany");
const coodsModel = require("../model/coodsModel");
route.get("/checkcompanyexists", checkIfCompanyExists);

route.post("/api/postDummyData", async (req, res) => {
  // console.log("Received data from background task:",);
  // Handle the data as needed
  const data = await coodsModel.create(req.body[0].coords);
  console.log(req.body[0].coords);
  res.status(200).send({ data: data, msg: "Data received successfully" });
});

route.get("/api/getDummyData", async (req, res) => {
  let { code } = req.query;
  console.log(code);
  const data = await coodsModel.find({ code: code });
  return res.status(200).send({ data: data });
});

module.exports = route;
