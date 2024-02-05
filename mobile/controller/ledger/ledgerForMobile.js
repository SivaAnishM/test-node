const moment = require("moment");
const errorHandler = require("../../../src/errorhandler/error");
const { connect } = require("../../../src/util/clientConnection");
const { dbNameFromCLPCode } = require("../../util/dbNameFromCLPCode");

//postgress
const sendLedgerDataP = async (req, res) => {
  try {
    let companyName = req.query.companyName;
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
    const db1 = await connect();

    let limit = req.query.limit;
    const ledgerGroupPermission = req.ledgerGroupPermission;

    if (req.isOwner || req.isAdmin) {
      console.log("request entity is an owner or admin ------>");
      if (limit) {
        const queryRun = await db1.query(
          `SELECT name AS "ledgerName", guid, parent AS "Parent", mailing_address AS "address", opening_balance AS "openingBalance", closing_balance AS "closingBalance" FROM ${dbName}.mst_ledger ORDER BY name limit ${limit}`
        );
        return res.status(200).send({
          status: true,
          message: "Ledger data fetched successfully.",
          count: queryRun.rows.length,
          endOfList: true,
          data: queryRun.rows,
        });
      } else {
        const queryRun = await db1.query(
          `SELECT name AS "ledgerName", guid, parent AS "Parent", mailing_address AS "address", opening_balance AS "openingBalance", closing_balance AS "closingBalance" FROM ${dbName}.mst_ledger ORDER BY name`
        );
        return res.status(200).send({
          status: true,
          message: "Ledger data fetched successfully.",
          count: queryRun.rows.length,
          endOfList: true,
          data: queryRun.rows,
        });
      }
    } else {
      console.log("request entity is not an owner or admin ------>");
      const trueKeys = Object.keys(ledgerGroupPermission).filter(
        (key) => ledgerGroupPermission[key] === true
      );
      if (limit) {
        const queryRun = await db1.query(
          `SELECT name as "ledgerName",guid, parent as "Parent",mailing_address as "address",opening_balance as "openingBalance",closing_balance as "closingBalance" FROM ${dbName}.mst_ledger WHERE parent = ANY ($1) LIMIT ($2) ORDER BY name`,
          [trueKeys],
          [limit]
        );

        console.log(queryRun.rows.length, "ledger length");
        return res.status(200).send({
          status: true,
          message: "Ledger data fetched successfully.",
          count: queryRun.rows.length,
          endOfList: true,
          data: queryRun.rows,
        });
      }

      if (!limit) {
        // If no limit is provided, retrieve all data
        const queryRun = await db1.query(
          `select name as "ledgerName",guid, parent as "Parent",mailing_address as "address",opening_balance as "openingBalance",closing_balance as "closingBalance" from ${dbName}.mst_ledger WHERE parent = ANY ($1)`,
          [trueKeys]
        );
        console.log(queryRun.rows.length, "ledger length");

        return res.status(200).send({
          status: true,
          message: "Ledger data fetched successfully.",
          count: queryRun.rows.length,
          endOfList: true,
          data: queryRun.rows,
        });
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      status: false,
      message: error.message,
    });
  }
};

const sendLedgerForonnector = async (req, res) => {
  let companyName = req.query.companyName;
  console.log(`companyName from sendledgerconnector ----------->`, companyName);
  if (!companyName) {
    return res.status(400).send({
      status: false,
      message: "Please provide company name in query.",
    });
  }
  const db1 = await connect()

  const queryRun = await db1.query(
    `select name ,parent from ${companyName}.mst_ledger `
  );

  return res.status(200).send({
    status: true,
    message: "Ledger data fetched successfully.",
    data: queryRun.rows
  });
}

const vouchersAccordingToPartyName = async (req, res) => {
  try {
    const { companyName, partyGuid, fromDate, toDate } = req.query;
    if (!companyName) {
      return res.status(400).send({
        status: false,
        message: "Please provide company name in query.",
      });
    }
    if (!partyGuid || !fromDate || !toDate) {
      return res.status(400).send({
        status: false,
        message: "Please provide partyGuid, fromDate and toDate in query.",
      });
    }
    const dbName = await dbNameFromCLPCode(companyName);
    if (!dbName) {
      return res.status(400).send({
        status: false,
        message: `No db exist with this company name: ${companyName} or company name is not given in params.`
      });
    }
    const companyDb = await connect();
    const formattedFromDate = moment(fromDate, "DD MMM YY").format("YYYY-MM-DD");
    const formattedToDate = moment(toDate, "DD MMM YY").format("YYYY-MM-DD");

    const queryRun = await companyDb.query(
      `SELECT
      v.*,
      ABS(i.amount) AS _amount,
      i.*
  FROM
      ${dbName}.trn_voucher AS v
  INNER JOIN
      ${dbName}.trn_accounting AS i ON i.guid = v.guid
  WHERE
      i._ledger = v._party_name
      AND v._party_name = '${partyGuid}'
      AND v.date >= '${formattedFromDate}'
      AND v.date <= '${formattedToDate}';
  `,
    );

    if (queryRun.rows.length === 0) {
      const queryRun1 = await companyDb.query(
        `SELECT
        v.*,
        ABS(i.amount) AS _amount,
        i.*
    FROM
        ${dbName}.trn_voucher AS v
    INNER JOIN
        ${dbName}.trn_accounting AS i ON i.guid = v.guid
    WHERE
        i._ledger != v._party_name
        AND i._ledger = '${partyGuid}'
        AND v.date >= '${formattedFromDate}'
        AND v.date <= '${formattedToDate}'`
      )

      if (queryRun1.rows.length === 0) {
        return res.status(200).send({
          status: true,
          message: "No data found.",
          count: 0,
          data: []
        });
      } else {
        return res.status(200).send({
          status: true,
          message: "Voucher data fetched successfully.",
          count: queryRun1.rows.length,
          data: queryRun1.rows
        });
      }
    }

    return res.status(200).send({
      status: true,
      message: "Ledger data fetched successfully.",
      count: queryRun.rows.length,
      data: queryRun.rows
    });

  } catch (error) {
    return errorHandler(error, res);
  }
}

const ledgerInfo = async (req, res) => {
  try {
    const { companyName, ledgerGuid } = req.query;
    if (!companyName) {
      return res.status(400).send({
        status: false,
        message: "Please provide company name in query.",
      });
    }
    if (!ledgerGuid) {
      return res.status(400).send({
        status: false,
        message: "Please provide ledgerGuid in query.",
      });
    }
    const dbName = await dbNameFromCLPCode(companyName);
    if (!dbName) {
      return res.status(400).send({
        status: false,
        message: `No db exist with this company name: ${companyName} or company name is not given in params.`
      });
    }
    const companyDb = await connect();

    const queryRun = await companyDb.query(
      `SELECT v.name as ledger , v.parent as parent , v.mailing_name, 
      v.mailing_state, v.mailing_country, v.mailing_address as address, 
      v.gstn, x.parent as parent_group FROM ${dbName}.mst_ledger AS v 
      INNER JOIN ${dbName}.mst_group as x ON x.guid = v._parent
      where v.guid = '${ledgerGuid}'`,
    );

    if (queryRun.rows.length === 0) {
      return res.status(200).send({
        status: true,
        message: "No data found.",
        data: {}
      });
    }

    return res.status(200).send({
      status: true,
      message: "Ledger info fetched successfully.",
      data: queryRun.rows[0]
    });
  } catch (error) {
    return errorHandler(error, res);
  }
}

module.exports = { sendLedgerDataP, sendLedgerForonnector, vouchersAccordingToPartyName, ledgerInfo };
