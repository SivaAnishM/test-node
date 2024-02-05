const { receivableSchema } = require("../../model/receivable");
const { connectToDatabaseAndSwitch } = require("../../util/dynamicDBcreateAndSwitch");


const fetchReceivable = async (req, res) => {
    try {
        const data = req.body;
        const companyName = req.query.companyName;

        const db = connectToDatabaseAndSwitch(companyName);
        const receivableModel = db.model('receivable', receivableSchema);

        await receivableModel.deleteMany()
        const saveData = await receivableModel.create(data);

        // console.log("saved", saveData)

        if (saveData) {
            console.log("---------------saved receivable Data------------");
        }

        return res.send({ msg: "got the receivable data" });
    } catch (error) {
        console.log(error, "<-- error");
    }
};

module.exports = { fetchReceivable }