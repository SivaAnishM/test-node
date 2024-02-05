const { balanceSheetSchema } = require("../../model/balanceSheet");
const { connectToDatabaseAndSwitch } = require("../../util/dynamicDBcreateAndSwitch");


const fetchbalanceSheetData = async (req, res) => {
    try {
        const { companyName } = req.query;
        const data = req.body;

        const db = connectToDatabaseAndSwitch(companyName);
        const balanceSheetModel = db.model('balancesheet', balanceSheetSchema);

        await balanceSheetModel.deleteMany()
        const saveData = await balanceSheetModel.create(data)

        if (saveData) {
            console.log(`---------------saved BalanceSheet------------`, companyName);
        }

        return res.send({ msg: "got the balanceSheet data" });
    } catch (error) {
        console.log(error, "<-- error");
    }
};

module.exports = { fetchbalanceSheetData }