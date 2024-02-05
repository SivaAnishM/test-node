const { dbNameFromCLPCode } = require("../../mobile/util/dbNameFromCLPCode");
const { deleteCollections } = require("../controller/company/company");
const { dbIndexSchema } = require("../model/dbIndex");
const { syncedCompanySchema } = require("../model/syncedCompanyModel");
const { userSchema } = require("../model/user");
const { connect } = require("../util/clientConnection");
const { doesSchemaExist } = require("./checkSchemaExits");
const { connectToDatabaseAndSwitch } = require("./dynamicDBcreateAndSwitch");

const reSyncClickOperation = async (req, res) => {
    const { companyName } = req.query;
    if (!companyName) {
        return res.status(400).send({
            status: false,
            message: "need company name in request",
        });
    }
    const rootDb = connectToDatabaseAndSwitch("users");
    const rootDbSyncedCompanyModel = rootDb.model("syncedcompany", syncedCompanySchema);
    const checkCompanyAlreadyExist = await rootDbSyncedCompanyModel.findOne({
        'companyName': companyName,
    });
    if (!checkCompanyAlreadyExist) {
        return res.status(400).send({
            status: false,
            message: "company name not found",
        });
    } else {
        return res.status(200).send({
            status: true,
            message: "company name found",
            data: checkCompanyAlreadyExist
        });
    }

}

const resyncForNonOwnedCompany = async (req, res) => {
    try {
        const decodedToken = req.token;
        if (!decodedToken) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const userIdfrmTkn = decodedToken.userId;
        const { CLPCode, userBackup } = req.query;
        if (!CLPCode || !userBackup) {
            return res.status(400).json({ msg: "Please provide CLPCode and userbackup  in query" });
        }

        const rootDb = connectToDatabaseAndSwitch("users");
        const rootDbUserModel = rootDb.model("users", userSchema);
        const rootDbIndexModel = rootDb.model("dbindex", dbIndexSchema);
        const syncedCompanyModel = rootDb.model("syncedcompany", syncedCompanySchema);
        let client = await connect();
        const dbName = await dbNameFromCLPCode(CLPCode);
        if (!dbName) {
            return res.status(404).json({ msg: "Company not found." });
        }

        const userData = await rootDbUserModel.findById({ _id: userIdfrmTkn });
        if (!userData) {
            return res.status(404).json({ msg: "User not found" });
        }

        const userEmail = userData.email;
        let mongoCompanyExist = userData.company.includes(CLPCode);
        let sqlCompanyExist = await doesSchemaExist(dbName, client);

        if (sqlCompanyExist && mongoCompanyExist) {
            try {
                //removing company from owners document
                const updatedUserObj = await rootDbUserModel.findByIdAndUpdate(
                    { _id: userIdfrmTkn },
                    {
                        $pull: {
                            company: CLPCode,
                            lastSyncedTime: { companyName: CLPCode }
                        }
                    },
                    { new: true }
                );
                console.log("\x1b[36m%s\x1b[0m", "company removed from root user(owner) document successfully==================>");
                //removing company from owners connectors array
                if (updatedUserObj.connectors.length > 0) {
                    const updatedUser = await rootDbUserModel.findByIdAndUpdate(
                        { _id: userIdfrmTkn },
                        { $pull: { 'connectors.$[elem].companies': CLPCode } },
                        { arrayFilters: [{ 'elem.companies': CLPCode }] },
                        { new: true }
                    );

                    if (!updatedUser) {
                        return res.status(404).json({ message: 'User not found' });
                    }
                }
                console.log("\x1b[36m%s\x1b[0m", "company removed from root connectors array successfully==================>");
                //making isDeleted true in dbindex document
                await rootDbIndexModel.findOneAndUpdate(
                    { uniqueCompanyName: CLPCode },
                    { $set: { isDeleted: true } },
                    { new: true }
                );
                console.log("\x1b[36m%s\x1b[0m", "isDeleted true in dbindex document successfully==================>");
                //removing company from syncedcompany document
                await syncedCompanyModel.findOneAndDelete(
                    { dbName: dbName, companyName: CLPCode }
                );
                console.log("\x1b[36m%s\x1b[0m", "company removed from syncedcompany document successfully==================>");
                //removing company from all root users documentassociated with this company
                await rootDbUserModel.updateMany(
                    {},
                    {
                        $pull: {
                            company: CLPCode,
                            lastSyncedTime: { companyName: CLPCode }
                        }
                    },
                    { multi: true }
                );
                console.log("\x1b[36m%s\x1b[0m", "company removed from all root user document successfully==================>");
            } catch (error) {
                console.log("error while removing company from root user document.", error);
                return res.status(500).json({ msg: "Failed to remove company from root user document.", error: error.message });
            }
            try {
                //dropping all collections from company mongodb(DELETING MONGO COMPANY DATABASE)
                const companyDb = await deleteCollections(userEmail, dbName, userBackup);
                if (companyDb.status === false) {
                    return res.status(500).json({ msg: "Failed to drop MongoDB database", msg: companyDb.msg });
                } else {
                    console.log("\x1b[36m%s\x1b[0m", "Mongo company deleted successfully =======================>");
                }
            } catch (err) {
                console.error(`Error dropping MongoDB database for ${dbName}: ${err}`);
                return res.status(500).json({ msg: "Failed to drop MongoDB database", error: err.message });
            }
            try {
                //dropping sql schema(DELETING SQL COMPANY DATABASE)
                await client.query(`DROP SCHEMA ${dbName} CASCADE;`);
                console.log("\x1b[36m%s\x1b[0m", "SQL schema deleted successfully =======================>");
            } catch (error) {
                console.log("error while deleting SQL db.", error);
                return res.status(500).json({ msg: "Failed to drop SQL database", error: error.message });
            }
            return res.status(200).json({
                status: true,
                companyDeleted: true,
                message: `Company deleted successfully.`,
            });
        } else {
            return res.status(404).json({
                status: false,
                mongoCompanyExist,
                sqlCompanyExist,
                companyDeleted: false,
                message: "Company not found."
            });
        }

    } catch (error) {
        return res.status(500).send({
            status: false,
            message: "internal server error",
            error: error.message
        });
    }
}

module.exports = { reSyncClickOperation, resyncForNonOwnedCompany };