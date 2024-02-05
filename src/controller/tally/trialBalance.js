const { trialBalanceSchema } = require("../../model/trialBalance");
const {
    connectToDatabaseAndSwitch,
} = require("../../util/dynamicDBcreateAndSwitch");

const fetchTrialBalanceData = async (req, res) => {
    try {
        const companyName = req.query.companyName;
        const data = req.body;

        const db = connectToDatabaseAndSwitch(companyName);
        const trailBalanceModel = db.model("trailbalance", trialBalanceSchema);

        await trailBalanceModel.deleteMany();
        const saveData = await trailBalanceModel.create(data);

        if (saveData) {
            console.log(`---------------saved TB------------`);
        }

        return res.send({ msg: "got the trialbalance data" });
    } catch (error) {
        console.log(error, "<-- error");
    }
};

module.exports = { fetchTrialBalanceData };
