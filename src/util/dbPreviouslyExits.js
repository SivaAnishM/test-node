const { syncedCompanySchema } = require("../model/syncedCompanyModel");
const { connectToDatabaseAndSwitch } = require("./dynamicDBcreateAndSwitch");

const previouslyCompanyExists = async (req, res) => {
    try {
        const { companyName } = req.query;
        const db = connectToDatabaseAndSwitch("users");
        const rootDbSyncedCompanyModel = db.model("syncedcompany", syncedCompanySchema);

        const companyData = await rootDbSyncedCompanyModel.findOne({ companyName: companyName });
        if (!companyData) {
            return res.status(200).send({
                status: false,
                msg: "Company not found."
            });
        }
        const obj = {
            dataPath: companyData.tally_companyInfo.dataPath,
            applicationPath: companyData.tally_companyInfo.applicationPath,
            destination: companyData.tally_companyInfo.DESTINATION,
            allowSync: companyData.syncData,
            allowAddVoucher: companyData.autoImportVoucher
        }
        return res.status(200).send({
            status: true,
            msg: "Company found.",
            data: obj
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

module.exports = { previouslyCompanyExists };