const { connect } = require("../../../src/util/clientConnection");
const { dbNameFromCLPCode } = require("../../util/dbNameFromCLPCode");

const fetchBillByLedgerName = async (req, res) => {
    try {
        const { ledgerName, companyName } = req.query;

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

        // const db = await switchDB(companyName);
        const db = await connect();
        const billData = await db.query(
            `SELECT ${dbName}.trn_bill.name as "BILLREF", ${dbName}.trn_bill.ledger as "BILLPARTY", 
            ${dbName}.trn_bill.amount as "PENDINGAMOUNT", ${dbName}.mst_ledger.parent as "GROUPNAME", 
            to_char(${dbName}.trn_voucher.reference_date, \'DD-Mon-YYYY\') as "BILLDATE", 
            to_char(${dbName}.trn_voucher.date, \'DD-Mon-YYYY\') as "BILLDUE" 
            FROM ${dbName}.trn_bill INNER JOIN ${dbName}.mst_ledger 
            on ${dbName}.trn_bill._ledger=${dbName}.mst_ledger.guid INNER JOIN ${dbName}.trn_voucher 
            ON ${dbName}.trn_bill.guid = ${dbName}.trn_voucher.guid WHERE ${dbName}.trn_bill.ledger=($1)`,
            [ledgerName]
        );

        if (billData.rows.length === 0) {
            return res.status(204).send({
                status: false,
                message: `No data found with ledgerName: ${ledgerName}.`,
                count: 0,
                data: [],
            });
        }

        return res.status(200).send({
            status: true,
            count: billData.rows.length,
            message: `Voucher with ledgerName ${ledgerName}.`,
            data: billData.rows,
        });
    } catch (error) {
        return res.status(500).send({
            status: false,
            error: error.message,
        });
    }
};

module.exports = { fetchBillByLedgerName };
