const { cashBankSchema } = require("../../../src/model/cashBank");
const {
    connectToDatabaseAndSwitch,
} = require("../../../src/util/dynamicDBcreateAndSwitch");
const { dbNameFromCLPCode } = require("../../util/dbNameFromCLPCode");

const fetchCashAndBankList = async (req, res) => {
    try {
        const { companyName } = req.query;
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
        const cashBankModel = db.model("cashbank", cashBankSchema);
        const cashBankList = await cashBankModel.findOne();
        const list = cashBankList.cashBank.filter((obj) => obj.parent !== null);

        const names = [];
        for (const item of list) {
            names.push(item.name);
        }
        return res.status(200).send({
            data: names,
        });
    } catch (error) {
        return res.status(500).send({ error: error.message });
    }
};

module.exports = { fetchCashAndBankList };
