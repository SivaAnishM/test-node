const { dbNameFromCLPCode } = require("../../../mobile/util/dbNameFromCLPCode");
const { companySchema } = require("../../model/companyModel");
const { dbIndexSchema } = require("../../model/dbIndex");
const { syncedCompanySchema } = require("../../model/syncedCompanyModel");
const { userSchema } = require("../../model/user");
const { doesSchemaExist } = require("../../util/checkSchemaExits");
const { connect } = require("../../util/clientConnection");
const {
    connectToDatabaseAndSwitch,
} = require("../../util/dynamicDBcreateAndSwitch");

const saveCompaniesData = async (req, res) => {
    try {
        const { email, tallyLicenceNumber, tallyUserName, company } = req.body;

        const rootUserDb = connectToDatabaseAndSwitch("users");
        const companyModel = rootUserDb.model("company", companySchema);

        const checkTallyLicenceExist = await companyModel.findOne({
            tallyLicenceNumber,
        });

        if (checkTallyLicenceExist) {
            const checkCompanyExists = checkTallyLicenceExist.syncedCompany.some(
                (obj) => obj.GUID === company.GUID
            );
            if (!checkCompanyExists) {
                const pushCompany = await companyModel.findByIdAndUpdate(
                    { _id: checkTallyLicenceExist._id },
                    {
                        $push: {
                            syncedCompany: company,
                        },
                    },
                    { new: true }
                );

                return res.status(200).send({
                    status: true,
                    data: pushCompany,
                });
            }
        } else {
            const data = {
                email,
                tallyLicenceNumber,
                tallyUserName,
                syncedCompany: [company],
            };
            const saveCompanyData = await companyModel.create(data);

            return res.status(201).send({
                status: true,
                data: saveCompanyData,
            });
        }
        return res.send("success");
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

const checkTallyLicence = async (req, res) => {
    try {
        const { email, tallyLicenceNumber } = req.body;

        const rootUserDb = connectToDatabaseAndSwitch("users");
        const companyModel = rootUserDb.model("company", companySchema);

        const licenceData = await companyModel.findOne({ tallyLicenceNumber });

        if (!licenceData) {
            return res.status(400).send({
                status: false,
                message: `No data found with licence number : ${tallyLicenceNumber}`,
            });
        }

        if (licenceData && licenceData.email === email) {
            return res.status(200).send({
                auth: true,
                message: `The licence ${tallyLicenceNumber} belongs to user ${licenceData.email}`,
                email: licenceData.email,
            });
        } else {
            return res.status(409).send({
                auth: false,
                message: `The licence ${tallyLicenceNumber} is already used by user ${licenceData.email}`,
                email: licenceData.email,
            });
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

const deleteCompany = async (req, res) => {
    try {
        const decodedToken = req.token;
        if (!decodedToken) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const userIdfrmTkn = decodedToken.userId;
        const { CLPCode, machineId, userBackup } = req.query;
        if (!CLPCode || !machineId || !userBackup) {
            return res.status(400).json({ msg: "Please provide CLPCode and machineId and userbackup  in query" });
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
                    updatedUserObj.connectors.forEach((connector) => {
                        if (connector.machineId === machineId) {
                            const index = connector.companies.indexOf(CLPCode);
                            if (index !== -1) {
                                connector.companies.splice(index, 1);
                            }
                        }
                    });
                    await rootDbUserModel.replaceOne({ _id: userIdfrmTkn }, updatedUserObj);
                }
                console.log("\x1b[36m%s\x1b[0m", "company removed from root user(owner) connectors array successfully==================>");
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
        // console.error(error);
        return res.status(500).json({
            status: false,
            companyDeleted: false,
            error: "An error occurred while deleting the company.",
            message: error.message
        });
    }
}

const deleteCollections = async (userEmail, dbName, userBackup) => {
    try {
        const companyDb = connectToDatabaseAndSwitch(dbName);
        const companyUserModel = companyDb.model("user", userSchema);

        await companyUserModel.findOneAndDelete({ email: userEmail });

        const collections = await companyDb.db.listCollections().toArray();

        if (userBackup === "true") {
            const collectionsWithoutUsers = collections.filter((collection) => {
                return collection.name !== "users";
            });
            if (collectionsWithoutUsers.length > 0) {
                collectionsWithoutUsers.forEach(async (collection) => {
                    console.log(`Dropping collection: ${collection.name}----------------------->`);
                    await companyDb.collection(collection.name).drop();
                });
            } else {
                return ({
                    status: true,
                    msg: "No collections found in the database.",
                    dbName
                });
            }
        } else {
            if (collections.length > 0) {
                collections.forEach(async (collection) => {
                    console.log(`Dropping collection: ${collection.name}----------------------->`);
                    await companyDb.collection(collection.name).drop();
                });
            } else {
                return ({
                    status: true,
                    msg: "No collections found in the database.",
                    dbName
                });
            }
        }

        return ({
            status: true,
            msg: "All collections dropped successfully.", dbName
        });
    } catch (error) {
        return ({
            status: false,
            msg: "An error occurred while deleting the company.",
            error: error.message
        });
    }
}

const updateCompanyInfo = async (req, res) => {
    try {
        const { CLPCode } = req.query;
        if (!CLPCode) {
            return res.status(400).json({ msg: "Please provide CLPCode in query" });
        }
        const { allowSync, allowAddVoucher } = req.body;

        const dbName = await dbNameFromCLPCode(CLPCode);

        const rootDb = connectToDatabaseAndSwitch("users");
        const syncedCompanyModel = rootDb.model("syncedcompany", syncedCompanySchema);

        const updatedCompanyInfo = await syncedCompanyModel.findOneAndUpdate(
            { dbName: dbName, companyName: CLPCode },
            {
                $set: {
                    syncData: allowSync,
                    autoImportVoucher: allowAddVoucher
                }
            },
            { new: true }
        );

        return res.status(200).json({
            status: true,
            message: "Company info updated successfully.",
            data: updatedCompanyInfo
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

module.exports = { saveCompaniesData, checkTallyLicence, deleteCompany, updateCompanyInfo, deleteCollections };
