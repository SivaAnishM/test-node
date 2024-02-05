const moment = require('moment');

const { trialBalanceSchema } = require("../../../src/model/trialBalance");
const errorHandler = require("../../../src/errorhandler/error");
const { connectToDatabaseAndSwitch } = require("../../../src/util/dynamicDBcreateAndSwitch");
const { connect } = require('../../../src/util/clientConnection');
const { dbNameFromCLPCode } = require('../../util/dbNameFromCLPCode');


const trailBalanceFetch = async (req, res) => {
    try {
        let { fromDate, toDate, companyName } = req.query;

        fromDate = moment(fromDate, "D MMM YY").format("DD-MM-YYYY");
        toDate = moment(toDate, "D MMM YY").format("DD-MM-YYYY");

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

        const db = connectToDatabaseAndSwitch(dbName);
        const trailBalanceModel = db.model("trailbalance", trialBalanceSchema);

        const TbData = await trailBalanceModel.findOne({
            'fromDate': fromDate,
            'toDate': toDate
        })

        if (!TbData) {
            return res.status(204).json({
                status: false,
                msg: "No Trial balance found.",
            });
        }

        // const companyDb = await switchDB(companyName);
        const companyDb = await connect();

        const tbDatawithparent = await createNewArrayWithParent(TbData.trialBalance, companyDb, dbName)

        const organizedData = createHierarchy(tbDatawithparent);

        let totalCreditAmount = organizedData.reduce((total, obj) => total += Math.abs(obj.credit), 0);
        let totalDebitAmount = organizedData.reduce((total, obj) => total += Math.abs(obj.debit), 0);

        let toSendData = {
            totalCreditAmount,
            totalDebitAmount,
            difference: (totalDebitAmount - totalCreditAmount),
            trialBalance: organizedData
        }

        return res.status(200).json({
            status: true,
            msg: "Trial balance fetched successfully.",
            data: toSendData
        });
    } catch (error) {
        console.error("Error fetching trial balance:", error);
        return errorHandler(error, res);
    }
};

//UTILS
async function createNewArrayWithParent(originalData, companyDb, companyName) {
    const newArray = [];

    for (const obj of originalData) {
        const { name } = obj;
        const mstGroupParent = await getMstGroupParent(name, companyDb, companyName);

        if (mstGroupParent !== null) {
            newArray.push({ ...obj, parent: mstGroupParent });
        } else {
            const trnLedgerParent = await getTrnLedgerParent(name, companyDb, companyName);
            newArray.push({ ...obj, parent: trnLedgerParent || '' });
        }
    }

    return newArray;
}

async function getMstGroupParent(name, companyDb, companyName) {
    try {

        const query = `SELECT parent FROM ${companyName}.mst_group WHERE name = $1`;
        const result = await companyDb.query(query, [name]);
        if (result.rows.length > 0) {
            return result.rows[0].parent;
        }
        return null; // No parent found
    } catch (error) {
        console.error("Error in PostgreSQL query:", error);
        return null;
    }
}

async function getTrnLedgerParent(name, companyDb, companyName) {
    try {

        const query = `SELECT parent FROM ${companyName}.mst_ledger WHERE name = $1`;
        const result = await companyDb.query(query, [name]);
        if (result.rows.length > 0) {
            return result.rows[0].parent;
        }
        return null; // No parent found
    } catch (error) {
        console.error("Error in PostgreSQL query:", error);
        return null;
    }
}

function createHierarchy(data) {
    const objectDictionary = {};

    data.forEach((item) => {
        objectDictionary[item.name] = item;
        item.children = [];
    });

    data.forEach((item) => {
        if (item.parent && objectDictionary[item.parent]) {
            objectDictionary[item.parent].children.push(item);
        }
    });

    const calculateTotalAmounts = (object) => {
        if (object.children.length === 0) {
            object.totalCreditAmount = Math.abs(object.credit);
            object.totalDebitAmount = Math.abs(object.debit);
        } else {
            let totalCredit = 0;
            let totalDebit = 0;

            object.children.forEach((child) => {
                calculateTotalAmounts(child);
                totalCredit += child.totalCreditAmount;
                totalDebit += child.totalDebitAmount;
            });

            object.totalCreditAmount = totalCredit;
            object.totalDebitAmount = totalDebit;
        }
    };

    data.forEach((item) => {
        if (!item.parent) {
            calculateTotalAmounts(item);
        }
    });

    return data.filter((item) => !item.parent);
}

module.exports = { trailBalanceFetch };