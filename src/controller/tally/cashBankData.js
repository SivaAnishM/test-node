const { cashBankSchema } = require("../../model/cashBank");
const { connectToDatabaseAndSwitch } = require("../../util/dynamicDBcreateAndSwitch");

const fetchCashBankData = async (req, res) => {
    try {
        const { companyName } = req.query;
        const data = req.body;

        const db = connectToDatabaseAndSwitch(companyName);
        const cashBankModel = db.model('cashbank', cashBankSchema);

        await cashBankModel.deleteMany()
        const saveData = await cashBankModel.create(data);

        // console.log("saved", saveData)
        if (saveData) {
            console.log("saved");
        }

        return res.send({ msg: "got the ratio data" });
    } catch (error) {
        console.log(error, "<-- error");
    }
};

module.exports = { fetchCashBankData }