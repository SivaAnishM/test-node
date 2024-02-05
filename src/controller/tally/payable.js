const { payableSchema } = require("../../model/payable");
const { connectToDatabaseAndSwitch } = require("../../util/dynamicDBcreateAndSwitch");


const fetchPayable = async (req, res) => {
    try {
        const data = req.body;
        const companyName = req.query.companyName;
        const db = connectToDatabaseAndSwitch(companyName);
        const payableModel = db.model('payable', payableSchema);

        await payableModel.deleteMany()
        const saveData = await payableModel.create(data);

        // console.log("saved", saveData)

        if (saveData) {
            console.log("---------------saved payable Data------------");
        }

        return res.send({ msg: "got the receivable data" });
    } catch (error) {
        console.log(error, "<-- error");
    }
};

module.exports = { fetchPayable }