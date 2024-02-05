const moment = require("moment");
const {
  fetchFinancialData,
  fetchAllPayables,
  fetchAllReceivables,
  fetchPurchaseData,
  fetchSalesData,
  fetchReceiptData,
  fetchPaymentData,
  fetchBankList,
  fetchCashList,
  fetchCreditNoteData,
  fetchDebitNoteData,
  fetchPurchaseOrderData,
  fetchSalesOrderData,
} = require("./dashBoardUtil");
const {
  checkLedgerHasVouchersInDateRange,
  filterLedgerVouchersByVchType,
  filterPartiesTransactedAccToVchType,
  removeDuplicatesAndSumAmount,
} = require("../../util/ledgerVouchers/fetchLedgerVouchers");
const { dbNameFromCLPCode } = require("../../util/dbNameFromCLPCode");

const fetchDashboard = async (req, res) => {
  try {
    let { fromDate, toDate, companyName } = req.query;
    fromDate = moment(fromDate, "D MMM YY").format("YYYYMMDD");
    toDate = moment(toDate, "D MMM YY").format("YYYYMMDD");

    if (!companyName) {
      return res.status(400).send({
        status: false,
        message: "Please provide company name in query.",
      });
    }
    const dbName = await dbNameFromCLPCode(companyName);
    if (!dbName) {
      return res.status(400).send({
        status: false,
        message: `No db exist with this company name: ${companyName} or company name is not given in params.`
      });
    }

    const dashBoardObj = await fetchFinancialData(
      fromDate,
      toDate,
      dbName
    );

    return res.status(201).json({
      status: true,
      message: "dashboard data fetched successfully.",
      dashBoardObj,
    });
  } catch (error) {
    return res.status(500).send({
      status: false,
      error: error.message,
    });
  }
};

const fetchDashboardDetailsTransactionList = async (req, res) => {
  try {
    let fromDate = moment(req.query.fromDate, "D MMM YY").format("YYYYMMDD");
    let toDate = moment(req.query.toDate, "D MMM YY").format("YYYYMMDD");
    let { companyName } = req.query;
    // const dateAndTypeFilteredVouchers = await fetchLedgerVoucherAccordingToDateAndParent(fromDate, toDate, companyName, req.query.vchType)
    if (!companyName) {
      return res.status(400).send({
        status: false,
        message: "Please provide company name in query.",
      });
    }
    const dbName = await dbNameFromCLPCode(companyName);
    if (!dbName) {
      return res.status(400).send({
        status: false,
        message: `No db exist with this company name: ${companyName} or company name is not given in params.`
      });
    }
    const dateRangeFiltered = await checkLedgerHasVouchersInDateRange(
      fromDate,
      toDate,
      dbName
    );
    // console.log(dateRangeFiltered)
    const filterVchTypeData = await filterPartiesTransactedAccToVchType(
      dateRangeFiltered,
      req.query.vchType
    );

    const sumAmountAndRemoveDuplicate = await removeDuplicatesAndSumAmount(
      filterVchTypeData
    );
    return res.status(201).json({
      status: true,
      message: "dashboard data fetched successfully.",
      sumAmountAndRemoveDuplicate,
    });
  } catch (error) { }
};

const fetchDashboardLedgerTransactions = async (req, res) => {
  try {
    // console.log("fetch dashboard details hit");
    // console.log(req.query, "req.params ");
    let fromDate = moment(req.query.fromDate, "D MMM YY").format("YYYYMMDD");
    let toDate = moment(req.query.toDate, "D MMM YY").format("YYYYMMDD");
    let { companyName } = req.query; //   console.log(fromDate, toDate)
    if (!companyName) {
      return res.status(400).send({
        status: false,
        message: "Please provide company name in query.",
      });
    }
    const dbName = await dbNameFromCLPCode(companyName);
    if (!dbName) {
      return res.status(400).send({
        status: false,
        message: `No db exist with this company name: ${companyName} or company name is not given in params.`
      });
    }
    const dateRangeFiltered = await checkLedgerHasVouchersInDateRange(
      fromDate,
      toDate,
      dbName
    );
    const ledgerFiltered = await filterLedgerVouchersByVchType(
      dateRangeFiltered,
      req.query.partyName
    );
    return res.status(201).json({
      status: true,
      message: "dashboard data fetched successfully.",
      ledgerFiltered,
    });
  } catch (error) {
    return res.status(500).send({
      status: false,
      error: error.message,
    });
  }
};

const fetchDashboardItemDetails = async (req, res) => {
  try {
    const { tileName, companyName } = req.query;
    let fromDate = moment(req.query.fromDate, "D MMM YY").format("YYYYMMDD");
    let toDate = moment(req.query.toDate, "D MMM YY").format("YYYYMMDD");
    if (!companyName) {
      return res.status(400).send({
        status: false,
        message: "Please provide company name in query.",
      });
    }
    const dbName = await dbNameFromCLPCode(companyName);
    if (!dbName) {
      return res.status(400).send({
        status: false,
        message: `No db exist with this company name: ${companyName} or company name is not given in params.`
      });
    }

    const tileActions = {
      async Sales(dbName, fromDate, toDate) {
        const salesData = await fetchSalesData(dbName, fromDate, toDate);
        return res.status(200).send({
          status: true,
          total: salesData.totalSales,
          data: salesData.resultArray,
        });
      },
      async Purchase(dbName, fromDate, toDate) {
        const purchaseData = await fetchPurchaseData(
          dbName,
          fromDate,
          toDate
        );

        return res.status(200).send({
          status: true,
          total: purchaseData.totalPurchase,
          data: purchaseData.resultArray,
        });
      },
      async Receipt(dbName, fromDate, toDate) {
        const receiptData = await fetchReceiptData(
          dbName,
          fromDate,
          toDate
        );

        return res.status(200).send({
          status: true,
          total: receiptData.totalReceipt,
          data: receiptData.resultArray,
        });
      },
      async Payment(dbName, fromDate, toDate) {
        const paymentData = await fetchPaymentData(
          dbName,
          fromDate,
          toDate
        );

        return res.status(200).send({
          status: true,
          total: paymentData.totalPayment,
          data: paymentData.resultArray,
        });
      },
      async Receivables(dbName, fromDate, toDate) {
        const ReceivablesData = await fetchAllReceivables(
          dbName,
          fromDate,
          toDate
        );

        return res.status(200).send({
          status: true,
          total: ReceivablesData.total,
          data: ReceivablesData.data,
        });
      },
      async Payables(dbName, fromDate, toDate) {
        const payableData = await fetchAllPayables(
          dbName,
          fromDate,
          toDate
        );

        return res.status(200).send({
          status: true,
          total: payableData.total,
          data: payableData.data,
        });
      },
      async Cash(dbName, fromDate, toDate) {
        const data = await fetchCashList(dbName, fromDate, toDate);

        return res.status(200).send({
          status: true,
          total: data.total,
          data: data.data,
        });
      },
      async Bank(dbName, fromDate, toDate) {
        const data = await fetchBankList(dbName, fromDate, toDate);

        return res.status(200).send({
          status: true,
          total: data.total,
          data: data.data,
        });
      },
      async "Credit Note"(dbName, fromDate, toDate) {
        const creditNoteData = await fetchCreditNoteData(
          dbName,
          fromDate,
          toDate
        );

        return res.status(200).send({
          status: true,
          total: creditNoteData.total,
          data: creditNoteData.resultArray,
        });
      },
      async "Debit Note"(dbName, fromDate, toDate) {
        const debitNoteData = await fetchDebitNoteData(
          dbName,
          fromDate,
          toDate
        );

        return res.status(200).send({
          status: true,
          total: debitNoteData.total,
          data: debitNoteData.resultArray,
        });
      },
      async "Purchase Order"(dbName, fromDate, toDate) {
        const purchaseOrderData = await fetchPurchaseOrderData(
          dbName,
          fromDate,
          toDate
        );

        return res.status(200).send({
          status: true,
          total: purchaseOrderData.total,
          data: purchaseOrderData.resultArray,
        });
      },
      async "Sales Order"(dbName, fromDate, toDate) {
        const salesOrderData = await fetchSalesOrderData(
          dbName,
          fromDate,
          toDate
        );

        return res.status(200).send({
          status: true,
          total: salesOrderData.total,
          data: salesOrderData.resultArray,
        });
      },
    };

    if (tileName in tileActions) {
      await tileActions[tileName](dbName, fromDate, toDate);
    } else {
      return res.status(400).send({
        status: false,
        error: `Invalid tileName: ${tileName}`,
      });
    }
  } catch (error) {
    return res.status(500).send({
      status: false,
      error: error.message,
    });
  }
};

module.exports = {
  fetchDashboard,
  fetchDashboardDetailsTransactionList,
  fetchDashboardLedgerTransactions,
  fetchDashboardItemDetails,
};
