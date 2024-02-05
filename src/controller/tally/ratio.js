const { ratioSchema } = require("../../model/ratio");
const { connectToDatabaseAndSwitch } = require("../../util/dynamicDBcreateAndSwitch");

const fetchRatioData = async (req, res) => {
    try {
        const companyName = req.query.companyName;
        const data = req.body;

        const db = connectToDatabaseAndSwitch(companyName);
        const ratioModel = db.model('ratio', ratioSchema);

        await ratioModel.deleteMany()
        const saveData = await ratioModel.create(data);

        if (saveData) {
            console.log("-------saved ratio--------")
        }
        return res.send({ msg: "got the ratio data" });
    } catch (error) {
        console.log(error, "<-- error");
    }
};

module.exports = { fetchRatioData }