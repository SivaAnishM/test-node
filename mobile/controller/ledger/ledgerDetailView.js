//PACKAGE IMPORT
const moment = require("moment");
const { connect } = require("../../../src/util/clientConnection");
const { organizeByMonthLedger } = require("../../util/monthWiseUtil");
const { connectToDatabaseAndSwitch } = require("../../../src/util/dynamicDBcreateAndSwitch");
const { receivableSchema } = require("../../../src/model/receivable");
const { dbNameFromCLPCode } = require("../../util/dbNameFromCLPCode");

//FUNCTION FOR LEDGER summery DETAIL VIEW postgres
const ledgerSummaryDetailViewP = async (req, res) => {
  try {
    const { ledgerGuid, fromDate, toDate, companyName, view } = req.query;
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
    if (!view) {
      return res.status(200).send({
        msg: "Please provide the view parameter",
      });
    }
    if (!ledgerGuid && !fromDate && !toDate) {
      return sendErrorResponse(
        req,
        res,
        'Please provide either the "fromDate" or "toDate" or "ledgerGuid" parameter.'
      );
    }

    const formattedFromDate = moment(fromDate, "DD MMM YY").format("YYYY-MM-DD");
    const formattedToDate = moment(toDate, "DD MMM YY").format("YYYY-MM-DD");

    // const db1 = await switchDB(companyName);
    const db1 = await connect();

    let vchCoreDetails = await db1.query(`
      SELECT guid, TO_CHAR(date, 'YYYY-MM-DD') AS date, voucher_type, _voucher_type AS voucher_type_guid, voucher_number, reference_number, reference_date, party_name
      FROM ${dbName}.trn_voucher
      WHERE _party_name = '${ledgerGuid}'
      AND date BETWEEN '${formattedFromDate}' AND '${formattedToDate}';
    `);

    if (vchCoreDetails.rows.length === 0) {
      vchCoreDetails = await db1.query(`
        SELECT v.guid, v.date, v.voucher_type, v._voucher_type AS voucher_type_guid, v.voucher_number, v.reference_number, v.reference_date, i.ledger AS party_name
        FROM ${dbName}.trn_voucher AS v
        INNER JOIN ${dbName}.trn_accounting AS i ON i.guid = v.guid
        WHERE i._ledger = '${ledgerGuid}'
        AND date BETWEEN '${formattedFromDate}' AND '${formattedToDate}';
      `);
    }

    if (vchCoreDetails.rows.length === 0) {
      return res.status(204).send({
        status: false,
        message: "No voucher found with this filter.",
      });
    }

    let dateFilteredLedgerVouchers = vchCoreDetails.rows;

    const fetchDetails = async (voucher, query, prop) => {
      const details = await db1.query(query, [voucher.guid]);
      voucher[prop] = details.rows;
    };

    const fetchAccountingAmounts = async () => {
      for (const voucher of dateFilteredLedgerVouchers) {
        const accountingQuery = await db1.query(`
          SELECT ABS(amount) AS total_positive_amount
          FROM ${dbName}.trn_accounting
          WHERE guid = $1;
        `, [voucher.guid]);

        const totalAmount = accountingQuery.
          rows[0]?.total_positive_amount;
        voucher.amount = totalAmount;

        const parentVoucherType = await db1.query(`
          SELECT voucher_reserved_name FROM ${dbName}.mst_vouchertype WHERE guid = '${voucher.voucher_type_guid}'
        `);
        voucher.parent = parentVoucherType.rows[0].voucher_reserved_name;
      }
    };

    await fetchAccountingAmounts();

    const fetchDetailsAndMap = async (detailsFunction, prop) => {
      for (const voucher of dateFilteredLedgerVouchers) {
        await detailsFunction(voucher, `
          SELECT * FROM ${dbName}.trn_${prop} WHERE guid = $1;
        `, prop.toUpperCase());
      }
    };

    await fetchDetailsAndMap(fetchDetails, 'bill');
    await fetchDetailsAndMap(fetchDetails, 'inventory');

    const parentArray = calculateParentArray(dateFilteredLedgerVouchers);
    const ledgerData = await db1.query(`select name from ${dbName}.mst_ledger where guid = '${ledgerGuid}'`);
    const ledgerName = ledgerData.rows[0].name;

    const mongoDb = connectToDatabaseAndSwitch(dbName)
    const receivableModel = mongoDb.model('receivable', receivableSchema);
    const receivableData = await receivableModel.find({ partyName: ledgerName });
    const receivableAmount = receivableData.reduce((sum, item) => sum + +item.pendingAmount, 0);

    const overviewData = calculateOverview(parentArray, receivableAmount);

    if (view === "month") {
      const newArr = parentArray.map(({ parentName, totalAmount, data }) => ({
        parentName,
        totalAmount,
        data: organizeByMonthLedger(data),
      }));
      return res.status(200).send({
        status: true,
        data: newArr,
        overview: overviewData,
      });
    } else if (view === "bill") {
      return res.status(200).send({
        status: true,
        data: parentArray,
        overview: overviewData,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: false,
      error: error.message,
    });
  }
};

//FUNCTION FOR LEDGER SOLD DETAIL VIEW postgres
const ledgerSoldDetailViewP = async (req, res) => {
  try {
    // const viewVoucherPermission = req.viewVoucherPermission;
    // const trueKeys = Object.keys(viewVoucherPermission).filter(key => viewVoucherPermission[key] === true);
    const { ledgerGuid, fromDate, toDate, companyName, itemGuid } = req.query;

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

    if (!ledgerGuid || !fromDate || !toDate) {
      return sendErrorResponse(
        req,
        res,
        'Please provide either the "ledgerGuid", "fromDate" or "toDate" parameter.'
      );
    }

    const parsedFromDate = moment(fromDate, "DD MMM YY");
    const parsedToDate = moment(toDate, "DD MMM YY");

    // Format the parsed date to the desired format "YYYY-MM-DD"
    const formattedFromDate = parsedFromDate.format("YYYY-MM-DD");
    const formattedToDate = parsedToDate.format("YYYY-MM-DD");

    const db1 = await connect();

    if (itemGuid) {
      if (!ledgerGuid) {
        return res.status(400).send({
          status: false,
          message: "Please send ledgerGuid in query.",
        });
      }
      const itemData = await db1.query(`SELECT v.*, i.*
      FROM ${dbName}.trn_voucher AS v
      INNER JOIN ${dbName}.trn_inventory AS i ON v.guid = i.guid
      WHERE v._party_name = '${ledgerGuid}' 
          AND v.date BETWEEN '${formattedFromDate}' AND '${formattedToDate}'
          AND i._item = '${itemGuid}';`)
      if (itemData.length === 0) {
        return res.status(204).send({
          status: false,
          message: `No data found with item guid : ${itemGuid}.`,
        });
      }

      return res.status(200).send({
        status: true,
        message: `Voucher with itemGuid ${itemGuid}.`,
        data: itemData.rows,
      });
    }

    const vchCoreDetails = await db1.query(
      `SELECT i.item as STOCKITEM,s.guid as itemGuid, i.rate, v.date, COUNT(*) AS total_vouchers, SUM(i.quantity) AS TOTALACTUALQUANTITY, s.uom
        FROM ${dbName}.trn_voucher AS v
        INNER JOIN ${dbName}.trn_inventory AS i ON v.guid = i.guid
        INNER JOIN ${dbName}.mst_vouchertype AS g ON v._voucher_type = g.guid
        INNER JOIN ${dbName}.mst_stock_item AS s ON i._item = s.guid
        WHERE v._party_name = '${ledgerGuid}' 
        AND v.date BETWEEN '${formattedFromDate}' AND '${formattedToDate}'
        AND g.voucher_reserved_name = 'Sales'
        GROUP BY i.item, s.guid, i.rate, v.date, s.uom;`
    );
    if (vchCoreDetails.rows.length === 0) {
      return res.status(204).send({
        status: false,
        message: "No voucher found with this filter.",
      });
    }
    let dateFilteredLedgerVouchers = vchCoreDetails.rows;

    return res.status(200).send({
      status: true,
      count: dateFilteredLedgerVouchers.length,
      data: dateFilteredLedgerVouchers,
    });

  } catch (error) {
    console.log(error);
    return res.status(500).send({
      status: false,
      error: error.message,
    });
  }
};

//FUNCTION FOR LEDGER PURCHASE DETAIL VIEW
const ledgerPurchaseDetailViewP = async (req, res) => {
  try {
    // const viewVoucherPermission = req.viewVoucherPermission;
    // const trueKeys = Object.keys(viewVoucherPermission).filter(
    //   (key) => viewVoucherPermission[key] === true
    // );
    const { ledgerGuid, fromDate, toDate, companyName, itemGuid } = req.query;

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

    if (!ledgerGuid || !fromDate || !toDate) {
      return sendErrorResponse(
        req,
        res,
        'Please provide either the "ledgerGuid" , "fromDate" or "toDate" parameter.'
      );
    }
    const parsedFromDate = moment(fromDate, "DD MMM YY");
    const parsedToDate = moment(toDate, "DD MMM YY");

    // Format the parsed date to the desired format "YYYY-MM-DD"
    const formattedFromDate = parsedFromDate.format("YYYY-MM-DD");
    const formattedToDate = parsedToDate.format("YYYY-MM-DD");

    const db1 = await connect();
    if (itemGuid) {
      if (!ledgerGuid) {
        return res.status(400).send({
          status: false,
          message: "Please send ledgerGuid in query.",
        });
      }
      const itemData = await db1.query(`SELECT v.*, i.*
      FROM ${dbName}.trn_voucher AS v
      INNER JOIN ${dbName}.trn_inventory AS i ON v.guid = i.guid
      WHERE v._party_name = '${ledgerGuid}' 
      AND v.date BETWEEN '${formattedFromDate}' AND '${formattedToDate}'
      AND i._item = '${itemGuid}';`)
      if (itemData.length === 0) {
        return res.status(204).send({
          status: false,
          message: `No data found with itemGuid: ${itemGuid}.`,
        });
      }

      return res.status(200).send({
        status: true,
        message: `Voucher with itemGuid ${itemGuid}.`,
        data: itemData.rows,
      });
    }

    const vchCoreDetails = await db1.query(
      `SELECT i.item as STOCKITEM, s.guid as itemguid, i.rate, v.date, COUNT(*) AS total_vouchers, SUM(i.quantity) AS TOTALACTUALQUANTITY, s.uom
        FROM ${dbName}.trn_voucher AS v
        INNER JOIN ${dbName}.trn_inventory AS i ON v.guid = i.guid
        INNER JOIN ${dbName}.mst_vouchertype AS g ON v._voucher_type = g.guid
        INNER JOIN ${dbName}.mst_stock_item AS s ON i._item = s.guid
        WHERE v._party_name = '${ledgerGuid}' 
        AND v.date BETWEEN '${formattedFromDate}' AND '${formattedToDate}'
        AND g.parent = 'Purchase'
        GROUP BY i.item,s.guid, i.rate, v.date, s.uom;`
    );
    if (vchCoreDetails.rows.length === 0) {
      return res.status(204).send({
        status: false,
        message: "No voucher found with this filter.",
      });
    }
    let dateFilteredLedgerVouchers = vchCoreDetails.rows;

    return res.status(200).send({
      status: true,
      count: dateFilteredLedgerVouchers.length,
      data: dateFilteredLedgerVouchers,
    });
  } catch (error) {
    return res.status(500).send({
      status: false,
      error: error.message,
    });
  }
};


//UTILS
//UTIL FUNCTION FOR CALSCULATING OVERVIEW
const calculateParentArray = (dateFilteredLedgerVouchers) => {
  const uniqueParentNames = [...new Set(dateFilteredLedgerVouchers.map((voucher) => voucher.parent))];
  const parentMap = new Map();

  uniqueParentNames.forEach((parentName) => {
    const parentData = dateFilteredLedgerVouchers.filter((voucher) => voucher.parent === parentName);

    if (parentData.length > 0) {
      parentMap.set(parentName, parentData);
    }
  });

  return Array.from(parentMap, ([parentName, data]) => {
    let totalAmount = 0;
    if (parentName === "Payment") {
      const debitAmount = data.reduce((sum, voucher) => sum + (parseFloat(voucher.amount) || 0), 0);
      const creditAmount = data.reduce((sum, voucher) => sum + (parseFloat(voucher.creditAmount) || 0), 0);
      totalAmount = debitAmount - creditAmount;
    } else {
      totalAmount = data.reduce((sum, voucher) => sum + (parseFloat(voucher.amount) || 0), 0);
    }

    return {
      parentName,
      totalAmount,
      data,
    };
  });
};

//UTIL FUNCTION FOR STOCKITEM SUMMERY
const calculateOverview = (parentArray, receivableAmount) => {
  let lastSalesDate = null;
  let lastPaymentDate = null;
  let lastPurchaseDate = null;
  let numOfSalesInvoice = 0;
  let numOfPaymentInvoice = 0;
  let numOfPurchaseInvoice = 0;
  let totalSalesAmount = 0;
  let totalPaymentAmount = 0;
  let totalPurchaseAmount = 0;

  for (const parent of parentArray) {
    // console.log(parent, "parent from calculate overview")
    for (const voucher of parent.data) {
      const date = moment(voucher.date);
      if (parent.parentName === "Sales") {
        if (!lastSalesDate || date.isAfter(lastSalesDate)) {
          lastSalesDate = date;
        }
        numOfSalesInvoice++;
        totalSalesAmount += voucher.PAYMENTVOUCHERAMOUNT;
      } else if (parent.parentName === "Payment") {
        if (!lastPaymentDate || date.isAfter(lastPaymentDate)) {
          lastPaymentDate = date;
        }
        numOfPaymentInvoice++;
        totalPaymentAmount += voucher.PAYMENTVOUCHERAMOUNT;
      } else if (parent.parentName === "Purchase") {
        if (!lastPurchaseDate || date.isAfter(lastPurchaseDate)) {
          lastPurchaseDate = date;
        }
        numOfPurchaseInvoice++;
        totalPurchaseAmount += voucher.PAYMENTVOUCHERAMOUNT;
      }
    }
  }

  const overview = {
    receivable: Math.abs(receivableAmount),
    lastSalesDate: lastSalesDate ? lastSalesDate.format("DD-MM-YYYY") : "",
    lastPaymentDate: lastPaymentDate
      ? lastPaymentDate.format("DD-MM-YYYY")
      : "",
    lastPurchaseDate: lastPurchaseDate
      ? lastPurchaseDate.format("DD-MM-YYYY")
      : "",
    numOfSalesInvoice: numOfSalesInvoice.toString(),
    numOfPurchaseInvoice: numOfPurchaseInvoice.toString(),
    avgSalesInvoiceAmount: isNaN(
      (+totalSalesAmount / +numOfSalesInvoice).toFixed(2)
    )
      ? 0
      : (+totalSalesAmount / +numOfSalesInvoice).toFixed(2),
    avgPurchaseInvoiceAmount: isNaN(
      (+totalPurchaseAmount / +numOfPurchaseInvoice).toFixed(2)
    )
      ? 0
      : (+totalPurchaseAmount / +numOfPurchaseInvoice).toFixed(2),
  };

  return overview;
};

//ERROR HANDEL UTIL FUNCTION
const sendErrorResponse = (req, res, message) => {
  return res.status(400).send({
    status: false,
    message: message,
  });
};

module.exports = {
  ledgerSummaryDetailViewP,
  ledgerSoldDetailViewP,
  ledgerPurchaseDetailViewP,
};
