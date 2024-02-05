const moment = require("moment");

const {
  connectToDatabaseAndSwitch,
} = require("../../../src/util/dynamicDBcreateAndSwitch");

const fetchLedgerVoucherAccordingToDateAndParent = async (
  fromDate,
  toDate,
  companyName,
  vchType
) => {
  try {
    console.log("inside try", fromDate, toDate, companyName, vchType)
    const db = connectToDatabaseAndSwitch(companyName);
    const voucherModel = db.model("voucher", voucherSchema);
    const voucherData = await voucherModel.find({
      DATE: { $gt: fromDate, $lt: toDate },
      PARENT: vchType,
    });
    console.log(voucherData)
    return voucherData;
  } catch (err) {
    console.log(err);
  }
};

const checkLedgerHasVouchersInDateRange = async (
  fromDate,
  toDate,
  companyName
) => {
  try {
    // const { companyName } = req.query;
    const db = connectToDatabaseAndSwitch(companyName);
    const voucherModel = db.model("voucher", voucherSchema);

    const voucherData = await voucherModel.find({
      DATE: { $gt: fromDate, $lt: toDate },
    });
    return voucherData;
  } catch (error) {
    console.log("error", error);
  }
};

const filterPartiesTransactedAccToVchType = async (data, vchType) => {
  let transactionsArray = [];
  const groupedData = data.reduce((groups, voucher) => {
    const partyKey = voucher.PARENT;
    if (!groups[partyKey]) {
      groups[partyKey] = [];
    }
    let obj = {};
    if (voucher.debitAmount > 0) {
      obj["partyName"] = voucher.PARTYLEDGERNAME;
      obj["amount"] = voucher.debitAmount;
      // console.log(obj);
    }
    if (voucher.creditAmount > 0) {
      obj["partyName"] = voucher.PARTYLEDGERNAME;
      obj["amount"] = voucher.creditAmount;
      // console.log(obj);
    }
    // transactionsArray.push(obj)
    // groups[partyKey].push(voucher.PARTYLEDGERNAME);
    groups[partyKey].push(obj);
    return groups;
  }, {});
  // console.log(transactionsArray)
  return groupedData[vchType];
};

const removeDuplicatesAndSumAmount = async (data, vchType) => {
  const uniqueSalesData = data.reduce((result, currentParty) => {
    const existingItem = result.find(
      (item) => item.partyName === currentParty.partyName
    );
    if (existingItem) {
      existingItem.amount += currentParty.amount;
    } else {
      result.push({
        partyName: currentParty.partyName,
        amount: currentParty.amount,
      });
    }

    return result;
  }, []);
  return uniqueSalesData;
};

const filterLedgerVouchersByVchType = async (data, partyName) => {
  const groupedData = data.reduce((groups, voucher) => {
    const partyKey = voucher.PARTYLEDGERNAME;
    if (!groups[partyKey]) {
      groups[partyKey] = [];
    }

    groups[partyKey].push(voucher);
    return groups;
  }, {});
  return groupedData[partyName];
};

//--May not be used

const filterPartiesTransacted = async (data) => {
  const partiesThatTranscated = [];
  const groupedData = data.reduce((groups, voucher) => {
    // console.log(voucher)
    const partyKey = voucher.PARTYLEDGERNAME;
    partiesThatTranscated.push(partyKey);
  }, {});
  // console.log(partiesThatTranscated)
  return partiesThatTranscated;
};

module.exports = {
  fetchLedgerVoucherAccordingToDateAndParent,
  checkLedgerHasVouchersInDateRange,
  filterPartiesTransactedAccToVchType,
  removeDuplicatesAndSumAmount,
  filterPartiesTransacted,
  filterLedgerVouchersByVchType,
};
