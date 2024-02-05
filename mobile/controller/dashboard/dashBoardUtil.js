const moment = require("moment");
const { cashBankSchema } = require("../../../src/model/cashBank");
const { receivableSchema } = require("../../../src/model/receivable");
const { payableSchema } = require("../../../src/model/payable");
const {
    connectToDatabaseAndSwitch,
} = require("../../../src/util/dynamicDBcreateAndSwitch");
const { connect } = require("../../../src/util/clientConnection");

const fetchFinancialData = async (fromDate, toDate, companyName) => {
    try {
        const db = connectToDatabaseAndSwitch(companyName);
        const totals = {
            sales: 0,
            purchase: 0,
            receipt: 0,
            payment: 0,
            payableTotal: 0,
            receivableTotal: 0,
            cash: 0,
            bank: 0,
            salesorder: 0,
            purchaseorder: 0,
            creditnote: 0,
            debitnote: 0,
        };

        // const companyDb = await switchDB(companyName);
        const companyDb = await connect();
        // console.log(companyDb, "pool =====>");
        // if (!companyDb) {
        //     console.error("Failed to establish a database connection.");
        //     return;
        // }

        const voucherTypes = [
            "Sales",
            "Purchase",
            "Receipt",
            "Payment",
            "Credit Note",
            "Debit Note",
            "Purchase Order",
            "Sales Order",
            "Quotations"
        ];

        await Promise.all(
            voucherTypes.map(async (type) => {
                // if (companyDb && companyDb._connected) {
                    // console.log("Database connection is established.");
                    const query = `SELECT i.amount
                FROM ${companyName}.trn_voucher AS v
                INNER JOIN ${companyName}.trn_accounting AS i ON i.guid = v.guid
                INNER JOIN ${companyName}.mst_vouchertype AS z ON z.guid = v._voucher_type
                WHERE i._ledger = v._party_name
                AND z.voucher_reserved_name = '${type}'
                AND v.date >= '${fromDate}'
                AND v.date <= '${toDate}';`;

                    const result = await companyDb.query(query);
                    totals[`${type.replace(/\s/g, "").toLowerCase()}`] = result.rows.reduce(
                        (total, obj) => total + Math.abs(+obj.amount),
                        0
                    );
                // } else {
                //     console.log("Database connection is closed.");
                // }
            })
        );

        const cashBankModel = db.model("cashbank", cashBankSchema);

        const cashBankData = await cashBankModel.aggregate([
            { $sort: { date: -1 } },
            {
                $match: {
                    date: { $lte: toDate },
                },
            },
            {
                $limit: 1,
            },
        ]);

        if (cashBankData.length !== 0) {
            cashBankData[0].cashBank.forEach((item) => {
                if (item.name === "Cash-in-Hand") {
                    totals.cash = Math.abs(parseFloat(item.closingBalance));
                } else if (item.name === "Bank Accounts") {
                    totals.bank = Math.abs(parseFloat(item.closingBalance));
                }
            });
        }

        const [receivableData, payableData] = await Promise.all([
            db.model("receivable", receivableSchema).find({ date: { $lte: toDate } }),
            db.model("payable", payableSchema).find({ date: { $lte: toDate } }),
        ]);

        totals.payableTotal = payableData.reduce(
            (sum, obj) => sum + Math.abs(obj.pendingAmount),
            0
        );
        totals.receivableTotal = receivableData.reduce(
            (sum, obj) => sum + Math.abs(obj.pendingAmount),
            0
        );

        return totals;
    } catch (error) {
        console.error(error);
        return error;
    }
};

const fetchAllPayables = async (companyName) => {
    try {
        const db = connectToDatabaseAndSwitch(companyName);
        const payableModel = db.model("payable", payableSchema);

        const data = await payableModel.find();

        const total = data.reduce((sum, obj) => (sum += +obj.pendingAmount), 0);

        return { total, data: data };
    } catch (error) {
        return error.message;
    }
};

const fetchAllReceivables = async (companyName) => {
    try {
        const db = connectToDatabaseAndSwitch(companyName);
        const receivableModel = db.model("receivable", receivableSchema);

        const data = await receivableModel.find();

        const total = data.reduce((sum, obj) => (sum += +obj.pendingAmount), 0);

        return { total, data: data };
    } catch (error) {
        return error.message;
    }
};

const fetchSalesData = async (companyName, fromDate, toDate) => {
    try {
        // const companyDb = await switchDB(companyName);
        const companyDb = await connect();

        let ledgerWiseSalesData = await companyDb.query(
            `SELECT v.party_name,i.amount
            FROM ${companyName}.trn_voucher AS v
            INNER JOIN ${companyName}.trn_accounting AS i ON i.guid = v.guid
            INNER JOIN ${companyName}.mst_vouchertype AS z ON z.guid = v._voucher_type
            WHERE i._ledger = v._party_name
            AND z.voucher_reserved_name = 'Sales'
            AND v.date >= '${fromDate}'
            AND v.date <= '${toDate}'
            ORDER BY v.party_name;`
        );
        const resultObject = {};

        ledgerWiseSalesData.rows.forEach((item) => {
            if (!resultObject[item.party_name]) {
                resultObject[item.party_name] = {
                    party_name: item.party_name,
                    amount: Math.abs(+item.amount),
                };
            } else {
                resultObject[item.party_name].amount += Math.abs(+item.amount);
            }
        });

        const resultArray = Object.values(resultObject);

        let totalSales = resultArray.reduce(
            (total, obj) => (total += obj.amount),
            0
        );

        return { totalSales, resultArray };
    } catch (error) {
        return error.message;
    }
};

const fetchPurchaseData = async (companyName, fromDate, toDate) => {
    try {
        // const companyDb = await switchDB(companyName);
        const companyDb = await connect();

        let ledgerWiseSalesData = await companyDb.query(
            `SELECT v.party_name,i.amount
            FROM ${companyName}.trn_voucher AS v
            INNER JOIN ${companyName}.trn_accounting AS i ON i.guid = v.guid
            INNER JOIN ${companyName}.mst_vouchertype AS z ON z.guid = v._voucher_type
            WHERE i._ledger = v._party_name
            AND z.parent = 'Purchase'
            AND v.date >= '${fromDate}'
            AND v.date <= '${toDate}'
            ORDER BY v.party_name;`
        );

        const resultObject = {};

        ledgerWiseSalesData.rows.forEach((item) => {
            if (!resultObject[item.party_name]) {
                resultObject[item.party_name] = {
                    party_name: item.party_name,
                    amount: Math.abs(+item.amount),
                };
            } else {
                resultObject[item.party_name].amount += Math.abs(+item.amount);
            }
        });

        const resultArray = Object.values(resultObject);

        let totalPurchase = resultArray.reduce(
            (total, obj) => (total += obj.amount),
            0
        );

        return { totalPurchase, resultArray };
    } catch (error) {
        return error.message;
    }
};

const fetchReceiptData = async (companyName, fromDate, toDate) => {
    try {
        // const companyDb = await switchDB(companyName);
        const companyDb = await connect();

        let ledgerWiseSalesData = await companyDb.query(
            `SELECT v.party_name,i.amount
            FROM ${companyName}.trn_voucher AS v
            INNER JOIN ${companyName}.trn_accounting AS i ON i.guid = v.guid
            INNER JOIN ${companyName}.mst_vouchertype AS z ON z.guid = v._voucher_type
            WHERE i._ledger = v._party_name
            AND z.parent = 'Receipt'
            AND v.date >= '${fromDate}'
            AND v.date <= '${toDate}'
            ORDER BY v.party_name;`
        );

        const resultObject = {};

        ledgerWiseSalesData.rows.forEach((item) => {
            if (!resultObject[item.party_name]) {
                resultObject[item.party_name] = {
                    party_name: item.party_name,
                    amount: Math.abs(+item.amount),
                };
            } else {
                resultObject[item.party_name].amount += Math.abs(+item.amount);
            }
        });

        const resultArray = Object.values(resultObject);

        let totalReceipt = resultArray.reduce(
            (total, obj) => (total += obj.amount),
            0
        );

        return { totalReceipt, resultArray };
    } catch (error) {
        return error.message;
    }
};

const fetchPaymentData = async (companyName, fromDate, toDate) => {
    try {
        // const companyDb = await switchDB(companyName);
        const companyDb = await connect();

        let ledgerWiseSalesData = await companyDb.query(
            `SELECT v.party_name,i.amount
            FROM ${companyName}.trn_voucher AS v
            INNER JOIN ${companyName}.trn_accounting AS i ON i.guid = v.guid
            INNER JOIN ${companyName}.mst_vouchertype AS z ON z.guid = v._voucher_type
            WHERE i._ledger = v._party_name
            AND z.parent = 'Payment'
            AND v.date >= '${fromDate}'
            AND v.date <= '${toDate}'
            ORDER BY v.party_name;`
        );

        const resultObject = {};

        ledgerWiseSalesData.rows.forEach((item) => {
            if (!resultObject[item.party_name]) {
                resultObject[item.party_name] = {
                    party_name: item.party_name,
                    amount: Math.abs(+item.amount),
                };
            } else {
                resultObject[item.party_name].amount += Math.abs(+item.amount);
            }
        });

        const resultArray = Object.values(resultObject);

        let totalPayment = resultArray.reduce(
            (total, obj) => (total += obj.amount),
            0
        );

        return { totalPayment, resultArray };
    } catch (error) {
        return error.message;
    }
};

const fetchCreditNoteData = async (companyName, fromDate, toDate) => {
    try {
        // const companyDb = await switchDB(companyName);
        const companyDb = await connect();

        let ledgerWiseSalesData = await companyDb.query(
            `SELECT v.party_name,i.amount
            FROM ${companyName}.trn_voucher AS v
            INNER JOIN ${companyName}.trn_accounting AS i ON i.guid = v.guid
            INNER JOIN ${companyName}.mst_vouchertype AS z ON z.guid = v._voucher_type
            WHERE i._ledger = v._party_name
            AND z.parent = 'Credit Note'
            AND v.date >= '${fromDate}'
            AND v.date <= '${toDate}'
            ORDER BY v.party_name;`
        );

        const resultObject = {};

        ledgerWiseSalesData.rows.forEach((item) => {
            if (!resultObject[item.party_name]) {
                resultObject[item.party_name] = {
                    party_name: item.party_name,
                    amount: Math.abs(+item.amount),
                };
            } else {
                resultObject[item.party_name].amount += Math.abs(+item.amount);
            }
        });

        const resultArray = Object.values(resultObject);

        let total = resultArray.reduce((total, obj) => (total += obj.amount), 0);

        return { total, resultArray };
    } catch (error) {
        return error.message;
    }
};

const fetchDebitNoteData = async (companyName, fromDate, toDate) => {
    try {
        // const companyDb = await switchDB(companyName);
        const companyDb = await connect();

        let ledgerWiseSalesData = await companyDb.query(
            `SELECT v.party_name,i.amount
            FROM ${companyName}.trn_voucher AS v
            INNER JOIN ${companyName}.trn_accounting AS i ON i.guid = v.guid
            INNER JOIN ${companyName}.mst_vouchertype AS z ON z.guid = v._voucher_type
            WHERE i._ledger = v._party_name
            AND z.parent = 'Debit Note'
            AND v.date >= '${fromDate}'
            AND v.date <= '${toDate}'
            ORDER BY v.party_name;`
        );

        const resultObject = {};

        ledgerWiseSalesData.rows.forEach((item) => {
            if (!resultObject[item.party_name]) {
                resultObject[item.party_name] = {
                    party_name: item.party_name,
                    amount: Math.abs(+item.amount),
                };
            } else {
                resultObject[item.party_name].amount += Math.abs(+item.amount);
            }
        });

        const resultArray = Object.values(resultObject);

        let total = resultArray.reduce((total, obj) => (total += obj.amount), 0);
        return { total, resultArray };
    } catch (error) {
        return error.message;
    }
};

const fetchPurchaseOrderData = async (companyName, fromDate, toDate) => {
    try {
        // const companyDb = await switchDB(companyName);
        const companyDb = await connect();

        let ledgerWiseSalesData = await companyDb.query(
            `SELECT v.party_name,i.amount
            FROM ${companyName}.trn_voucher AS v
            INNER JOIN ${companyName}.trn_accounting AS i ON i.guid = v.guid
            INNER JOIN ${companyName}.mst_vouchertype AS z ON z.guid = v._voucher_type
            WHERE i._ledger = v._party_name
            AND z.parent = 'Purchase Order'
            AND v.date >= '${fromDate}'
            AND v.date <= '${toDate}'
            ORDER BY v.party_name;`
        );

        const resultObject = {};

        ledgerWiseSalesData.rows.forEach((item) => {
            if (!resultObject[item.party_name]) {
                resultObject[item.party_name] = {
                    party_name: item.party_name,
                    amount: Math.abs(+item.amount),
                };
            } else {
                resultObject[item.party_name].amount += Math.abs(+item.amount);
            }
        });

        const resultArray = Object.values(resultObject);

        let total = resultArray.reduce((total, obj) => (total += obj.amount), 0);

        return { total, resultArray };
    } catch (error) {
        return error.message;
    }
};

const fetchSalesOrderData = async (companyName, fromDate, toDate) => {
    try {
        // const companyDb = await switchDB(companyName);
        const companyDb = await connect();

        let ledgerWiseSalesData = await companyDb.query(
            `SELECT v.party_name,i.amount
            FROM ${companyName}.trn_voucher AS v
            INNER JOIN ${companyName}.trn_accounting AS i ON i.guid = v.guid
            INNER JOIN ${companyName}.mst_vouchertype AS z ON z.guid = v._voucher_type
            WHERE i._ledger = v._party_name
            AND z.parent = 'Sales Order'
            AND v.date >= '${fromDate}'
            AND v.date <= '${toDate}'
            ORDER BY v.party_name;`
        );

        const resultObject = {};

        ledgerWiseSalesData.rows.forEach((item) => {
            if (!resultObject[item.party_name]) {
                resultObject[item.party_name] = {
                    party_name: item.party_name,
                    amount: Math.abs(+item.amount),
                };
            } else {
                resultObject[item.party_name].amount += Math.abs(+item.amount);
            }
        });

        const resultArray = Object.values(resultObject);

        let total = resultArray.reduce((total, obj) => (total += obj.amount), 0);
        return { total, resultArray };
    } catch (error) {
        return error.message;
    }
};

const fetchBankList = async (companyName, fromDate, toDate) => {
    try {
        const db = connectToDatabaseAndSwitch(companyName);
        const cashBankModel = db.model("cashbank", cashBankSchema);

        const bank = await cashBankModel.aggregate([
            { $sort: { date: -1 } },
            {
                $match: {
                    date: { $lte: toDate },
                },
            },
            {
                $limit: 1,
            },
        ]);
        const data = bank?.[0].cashBank.filter(
            (obj) => obj.parent === "Bank Accounts"
        );

        const total = data.reduce(
            (sum, obj) => sum + Math.abs(+obj.closingBalance),
            0
        );
        return { total, data };
    } catch (error) {
        return error.message;
    }
};

const fetchCashList = async (companyName, fromDate, toDate) => {
    try {
        const db = connectToDatabaseAndSwitch(companyName);
        const cashBankModel = db.model("cashbank", cashBankSchema);
        const cash = await cashBankModel.aggregate([
            { $sort: { date: -1 } },
            {
                $match: {
                    date: { $lte: toDate },
                },
            },
            {
                $limit: 1,
            },
        ]);
        const data = cash?.[0]?.cashBank.filter(
            (obj) => obj.parent === "Cash-in-Hand"
        );
        const total = data?.reduce(
            (sum, obj) => sum + Math.abs(+obj.closingBalance),
            0
        );
        return { total, data };
    } catch (error) {
        return error.message;
    }
};

const fetchCashData = async (req, res) => {
    try {
        const { cashType, companyName } = req.query;
        let fromDate = moment(req.query.fromDate, "D MMM YY").format("YYYYMMDD");
        let toDate = moment(req.query.toDate, "D MMM YY").format("YYYYMMDD");
        const db = connectToDatabaseAndSwitch(companyName);
        const voucherModel = db.model("voucher", voucherSchema);

        const commonQuery = {
            DATE: {
                $gte: fromDate,
                $lte: toDate,
            },
        };

        const cashQuery = {
            $or: [
                { PARTYLEDGERNAME: cashType },
                { FROMLEDGER: cashType },
                { TOLEDGER: cashType },
            ],
        };

        const cashData = await voucherModel
            .find({ ...commonQuery, ...cashQuery })
            .select({
                PARTYLEDGERNAME: 1,
                VOUCHERNUMBER: 1,
                DATE: 1,
                VCHTYPE: 1,
                creditAmount: 1,
                debitAmount: 1,
                TOLEDGER: 1,
                FROMLEDGER: 1,
            });

        return res.status(200).send({
            status: true,
            data: cashData,
        });
    } catch (error) {
        return error.message;
    }
};

const fetchBankData = async (req, res) => {
    try {
        const { bankType, companyName } = req.query;
        let fromDate = moment(req.query.fromDate, "D MMM YY").format("YYYYMMDD");
        let toDate = moment(req.query.toDate, "D MMM YY").format("YYYYMMDD");
        const db = connectToDatabaseAndSwitch(companyName);
        const voucherModel = db.model("voucher", voucherSchema);

        const commonQuery = {
            DATE: {
                $gte: fromDate,
                $lte: toDate,
            },
        };

        const bankQuery = {
            $or: [
                { PARTYLEDGERNAME: bankType },
                { FROMLEDGER: bankType },
                { TOLEDGER: bankType },
            ],
        };

        const bankData = await voucherModel
            .find({ ...commonQuery, ...bankQuery })
            .select({
                PARTYLEDGERNAME: 1,
                VOUCHERNUMBER: 1,
                DATE: 1,
                VCHTYPE: 1,
                creditAmount: 1,
                debitAmount: 1,
                TOLEDGER: 1,
                FROMLEDGER: 1,
            });

        // return bankData;

        return res.status(200).send({
            status: true,
            data: bankData,
        });
    } catch (error) {
        return error.message;
    }
};

module.exports = {
    fetchFinancialData,
    fetchAllPayables,
    fetchAllReceivables,
    fetchPurchaseData,
    fetchSalesData,
    fetchReceiptData,
    fetchPaymentData,
    fetchCashData,
    fetchBankData,
    fetchBankList,
    fetchCashList,
    fetchCreditNoteData,
    fetchDebitNoteData,
    fetchSalesOrderData,
    fetchPurchaseOrderData,
};
