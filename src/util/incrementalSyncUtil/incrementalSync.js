const { syncedCompanySchema } = require("../../model/syncedCompanyModel");
const { userSchema } = require("../../model/user");
const { connectToDatabaseAndSwitch } = require("../dynamicDBcreateAndSwitch");
const { connect } = require("../clientConnection");
const { doesSchemaExist } = require("../checkSchemaExits");

const checkIfCompanyExistsUnderUser = async (req, res) => {
    try {
        let { companyName, CLPCode, machineId } = req.query;
        // console.log("companyName", companyName, "CLPCode", CLPCode, "machineId", machineId);
        if (!companyName || !CLPCode || !machineId) {
            return res.status(400).send({
                status: false,
                message: "Please provide company name and CLPCode and machineId"
            });
        }
        const decodedToken = req.token;
        const userIdfrmTkn = decodedToken.userId;
        const db = connectToDatabaseAndSwitch("users");
        const userModel = db.model("user", userSchema);

        const userData = await userModel.findById({ _id: userIdfrmTkn });
        let mongoCompanyExist = userData.company.includes(CLPCode);
        console.log("mongoCompanyExist 1st check ---------->", mongoCompanyExist);
        let client = await connect();
        let sqlCompanyExist = await doesSchemaExist(companyName, client)

        console.log("sql company exist 1st check ---------->", sqlCompanyExist);

        if (sqlCompanyExist) {
            let checkTableCount = await sqlTableCount(client, companyName);
            console.log("checkTableCount==============>", checkTableCount.rows[0].table_count);
            if (checkTableCount.rows[0].table_count == 0 || checkTableCount.rows[0].table_count != 20 || !mongoCompanyExist) {
                try {
                    await client.query(`DROP SCHEMA ${companyName} CASCADE;`);
                    console.log("\x1b[36m%s\x1b[0m", "SQL schema deleted successfully =======================>");
                } catch (error) {
                    console.log("sql db deleted error==================>11111111111");
                    console.log("error", error);
                    return res.status(500).json({ msg: "Failed to drop SQL database", error: error.message });
                }

                sqlCompanyExist = false;
                try {
                    await userModel.findByIdAndUpdate(
                        { _id: userIdfrmTkn },
                        {
                            $pull: {
                                company: CLPCode,
                                lastSyncedTime: { companyName: CLPCode }
                            }
                        },
                        { new: true }
                    );

                    if (userData.connectors.length > 0) {
                        userData.connectors.forEach((connector) => {
                            if (connector.machineId === machineId) {
                                const index = connector.companies.indexOf(CLPCode);
                                if (index !== -1) {
                                    connector.companies.splice(index, 1);
                                }
                            }
                        });

                        await userModel.replaceOne({ _id: userIdfrmTkn }, userData);
                    }
                    console.log("mongo company deleted==================>");
                } catch (error) {
                    console.log("error", error);
                }
                mongoCompanyExist = false;
            }
            else {
                console.log(`table count is ==================> ${checkTableCount.rows[0].table_count}`);
            }
        }
        console.log("mongoCompanyExist 2nd ---------->", mongoCompanyExist);
        console.log("sqlCompanyExist 2nd ---------->", sqlCompanyExist);

        if (!sqlCompanyExist && mongoCompanyExist) {
            console.log("mongo company exist and sql company not exist==================>");
            try {
                const updatedUserObj = await userModel.findByIdAndUpdate(
                    { _id: userIdfrmTkn },
                    {
                        $pull: {
                            company: CLPCode,
                            lastSyncedTime: { companyName: CLPCode }
                        }
                    },
                    { new: true }
                );
                if (updatedUserObj.connectors.length > 0) {
                    updatedUserObj.connectors.forEach((connector) => {
                        if (connector.machineId === machineId) {
                            const index = connector.companies.indexOf(CLPCode);
                            if (index !== -1) {
                                connector.companies.splice(index, 1);
                            }
                        }
                    });
                    await userModel.replaceOne({ _id: userIdfrmTkn }, updatedUserObj);
                }
                console.log("mongo company deleted==================>");
            } catch (error) {
                console.log("error", error);
            }
            mongoCompanyExist = false;
        }

        console.log("mongoCompanyExist 3rd ---------->", mongoCompanyExist);
        console.log("sqlCompanyExist 3rd ---------->", sqlCompanyExist);

        if (mongoCompanyExist && sqlCompanyExist) {
            return res.status(200).send({
                companyExists: true
            });
        } else {
            return res.status(200).send({
                companyExists: false
            });
        }
    } catch (error) {
        console.log("error", error);
        return res.status(500).json({ error: error.message });
    }
};

const fetchLetestAlterIdFromPg = async (req, res) => {
    try {
        const { companyName } = req.query;
        const client = await connect();
        const latestAlterIdMaster = await client.query(
            `SELECT MAX(COALESCE(T.MAX_ALTERID, 0)) AS MAX_ALTERID
            FROM
            (
                SELECT MAX(ALTERID) AS MAX_ALTERID
                FROM ${companyName}.MST_GROUP
                UNION SELECT MAX(ALTERID)
                FROM ${companyName}.MST_LEDGER
                UNION SELECT MAX(ALTERID)
                FROM ${companyName}.MST_VOUCHERTYPE
                UNION SELECT MAX(ALTERID)
                FROM ${companyName}.MST_UOM
                UNION SELECT MAX(ALTERID)
                FROM ${companyName}.MST_GODOWN
                UNION SELECT MAX(ALTERID)
                FROM ${companyName}.MST_STOCK_GROUP
                UNION SELECT MAX(ALTERID)
                FROM ${companyName}.MST_STOCK_ITEM
                UNION SELECT MAX(ALTERID)
                FROM ${companyName}.MST_COST_CATEGORY
                UNION SELECT MAX(ALTERID)
                FROM ${companyName}.MST_COST_CENTRE
            ) AS T;`
        );
        const latestAlterIdTransaction = await client.query(`select max(coalesce(alterid,0)) from ${companyName}.trn_voucher`);
        return res.status(200).send({
            status: true,
            message: "latest alterid fetched successfully.",
            masterAlterId: latestAlterIdMaster.rows[0].max_alterid,
            transactionAlterId: latestAlterIdTransaction.rows[0].max
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

const companyInfoThroughToken = async (req, res) => {
    try {
        const decodedToken = req.token;
        const userIdfrmTkn = decodedToken.userId;
        const db = connectToDatabaseAndSwitch("users");
        const userModel = db.model("user", userSchema);
        const rootDbSyncedCompanyModel = db.model("syncedcompany", syncedCompanySchema);

        const userData = await userModel.findById({ _id: userIdfrmTkn });
        const companyInfo = userData.company;

        let companyArr = []
        for (let i = 0; i < companyInfo.length; i++) {
            const companyName = companyInfo[i];
            const companyData = await rootDbSyncedCompanyModel.findOne({ companyName: companyName });
            companyArr.push(companyData);
        }

        return res.status(200).send({
            companyInfo: companyArr,
            email: userData.email,
            userData
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

const sqlTableCount = async (client, companyName) => {
    try {
        let checkTableCount = await client.query(`
        SELECT COUNT(table_name) AS table_count
        FROM information_schema.tables
        WHERE table_schema = '${companyName}';`);
        return checkTableCount
    } catch (error) {
        return error.message;
    }
}

module.exports = { checkIfCompanyExistsUnderUser, fetchLetestAlterIdFromPg, companyInfoThroughToken, sqlTableCount };
