const { profitLossSchema } = require("../../model/profitloss");
const { connectToDatabaseAndSwitch } = require("../../util/dynamicDBcreateAndSwitch");

const fetchProfitLossData = async (req, res) => {
    try {
        const companyName = req.query.companyName;
        const data = req.body;

        // console.log(typeof (data))
        const db = connectToDatabaseAndSwitch(companyName);
        const profitLossModel = db.model('profitloss', profitLossSchema);

        await profitLossModel.deleteMany()
        const saveData = await profitLossModel.create(data);

        if (saveData) {
            console.log("-----------profitloss saved---------");
        }
        return res.send({ msg: "got the ratio data" });
    } catch (error) {
        console.log(error, "<-- error");
    }
};

module.exports = { fetchProfitLossData }