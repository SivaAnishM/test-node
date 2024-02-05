const moment = require("moment");
const { connect } = require("../../../src/util/clientConnection");
const { dbNameFromCLPCode } = require("../../util/dbNameFromCLPCode");

const fetchExpenses = async (req, res) => {
    try {
        const { companyName, fromDate, toDate, view } = req.query;
        if (!companyName) {
            return res.status(400).send({
                status: false,
                message: "Please provide company name in query.",
            });
        }
        if (!fromDate || !toDate) {
            return res.status(400).send({
                status: false,
                message: "Please provide fromDate and toDate in query.",
            });
        }
        const dbName = await dbNameFromCLPCode(companyName);
        if (!dbName) {
            return res.status(400).send({
                status: false,
                message: `No db exist with this company name: ${companyName} or company name is not given in params.`
            });
        }
        const db = await connect();

        const formattedFromDate = moment(fromDate, "DD MMM YY").format("YYYY-MM-DD");
        const formattedToDate = moment(toDate, "DD MMM YY").format("YYYY-MM-DD");

        const getExpenseParties = async (primaryGroup) => {
            const result = await db.query(`SELECT d.guid as party_guid, d.name as party_name, d.parent FROM ${dbName}.mst_group as v 
                INNER JOIN ${dbName}.mst_ledger as d ON d._parent = v.guid
                WHERE (v.primary_group = '${primaryGroup}')
                ORDER BY d.name;`);
            return result.rows;
        };

        const directExpenseParties = await getExpenseParties('Direct Expenses');
        const inDirectExpenseParties = await getExpenseParties('Indirect Expenses');

        const getPartyData = async (partyArr) => {
            const partyData = await Promise.all(partyArr.map(async (party) => {
                const result = await db.query(`SELECT b.ledger, b._ledger, b.amount, m.parent
                    FROM ${dbName}.trn_voucher AS v
                    INNER JOIN ${dbName}.trn_accounting AS b ON b.guid = v.guid
                    INNER JOIN ${dbName}.mst_ledger as m on m.guid = b._ledger
                    WHERE b._ledger = '${party.party_guid}'
                      AND v.date >= '${formattedFromDate}' 
                      AND v.date <= '${formattedToDate}'`);
                return result.rows;
            }));
            return partyData.flat();
        };

        const partyArrForDE = await getPartyData(directExpenseParties);
        const partyArrForIDE = await getPartyData(inDirectExpenseParties);
        const totalSum = (partyArr) => partyArr.reduce((acc, item) => acc + +(item.amount), 0);
        const directExpenseSum = totalSum(partyArrForDE);
        const indirectExpenseSum = totalSum(partyArrForIDE);

        switch (view) {
            case "both":
                res.status(200).send({
                    status: true,
                    data: {
                        directExpense: Math.abs(directExpenseSum),
                        indirectExpense: Math.abs(indirectExpenseSum),
                        total: Math.abs(directExpenseSum + indirectExpenseSum),
                    },
                });
                break;
            case "direct":
                res.status(200).send({
                    status: true,
                    data: sumAmountsByLedgerGuid(partyArrForDE),
                });
                break;
            case "indirect":
                res.status(200).send({
                    status: true,
                    data: sumAmountsByLedgerGuid(partyArrForIDE),
                });
                break;
            default:
                res.status(400).send({
                    status: false,
                    message: "Please provide a valid 'view' parameter.",
                });
        }
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
};


function sumAmountsByLedgerGuid(inputArray) {
    const ledgerSum = {};

    inputArray.forEach(item => {
        const ledgerId = item._ledger;

        if (!ledgerSum[ledgerId]) {
            ledgerSum[ledgerId] = {
                ledger: item.ledger,
                _ledger: ledgerId,
                parent: item.parent,
                total: 0
            };
        }

        ledgerSum[ledgerId].total += parseFloat(item.amount);
    });

    const resultArray = Object.values(ledgerSum).map(item => ({
        ...item,
        total: item.total * -1
    }));

    return resultArray;
}

module.exports = { fetchExpenses }