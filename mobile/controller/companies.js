const { configSchema } = require("../../src/model/config");
const {
    connectToDatabaseAndSwitch,
} = require("../../src/util/dynamicDBcreateAndSwitch");
const { dbNameFromCLPCode } = require("../util/dbNameFromCLPCode");

const getCompaniesConfig = async (req, res) => {
    try {
        const companyName = req.query.companyName;
        if (!companyName) {
            return res.status(400).send({
                status: false,
                message: "Please provide company name in query.",
            });
        }
        const dbName = await dbNameFromCLPCode(companyName);
        if (!dbName) {
            return res.status(400).send({
                status: false,
                message: `No db exist with this company name: ${companyName} or company name is not given in params.`
            });
        }
        const db = connectToDatabaseAndSwitch(dbName);
        const configModel = db.model("config", configSchema);

        const data = await configModel
            .find({ type: "company" })
            .select({ Name: 1, _id: 0 });
        if (data.length === 0) {
            return res.status(204).send({
                status: false,
                error: "No data found",
            });
        }
        return res.status(200).send({
            status: true,
            message: "config data fetched successfully.",
            data: data,
        });
    } catch (error) {
        return res.status(500).send({
            status: false,
            error: error.message,
        });
    }
};

const getCompaniesByName = async (req, res) => {
    try {
        const bodyData = req.body;
        const { Name } = bodyData;

        const companyName = req.query.companyName;
        if (!companyName) {
            return res.status(400).send({
                status: false,
                message: "Please provide company name in query.",
            });
        }
        const dbName = await dbNameFromCLPCode(companyName);
        if (!dbName) {
            return res.status(400).send({
                status: false,
                message: `No db exist with this company name: ${companyName} or company name is not given in params.`
            });
        }
        const db = connectToDatabaseAndSwitch(dbName);
        const configModel = db.model("config", configSchema);

        var data = [];
        for (let i = 0; i < Name.length; i++) {
            const userData = await configModel.findOne({
                type: "company",
                Name: Name[i],
            });
            if (!companyData) {
                return res.status(204).send({
                    status: false,
                    error: "No data found",
                });
            }
            data.push(companyData);
        }
        return res.status(200).send({
            status: true,
            message: "config data fetched successfully.",
            data: data,
        });
    } catch (error) {
        return res.status(500).send({
            status: false,
            error: error.message,
        });
    }
};

const getConfigById = async (req, res) => {
    try {
        const companyName = req.query.companyName;
        if (!companyName) {
            return res.status(400).send({
                status: false,
                message: "Please provide company name in query.",
            });
        }
        const dbName = await dbNameFromCLPCode(companyName);
        if (!dbName) {
            return res.status(400).send({
                status: false,
                message: `No db exist with this company name: ${companyName} or company name is not given in params.`
            });
        }
        const db = connectToDatabaseAndSwitch(dbName);
        const configModel = db.model("config", configSchema);

        const configId = +req.params.configId;
        console.log(configId, "req id");
        if (!configId) {
            return res.status(400).send({
                status: false,
                message: "please send configId in params.",
            });
        }

        const configData = await configModel.findOne({ configId });

        if (!configData) {
            return res.status(204).send({
                status: false,
                message: `no config found with configId : ${configId}.`,
            });
        }

        return res.status(200).send({
            status: true,
            message: `config with Id ${configId} fetched successfulIy.`,
            data: configData,
        });
    } catch (error) {
        return res.status(500).send({
            status: false,
            error: error.message,
        });
    }
};

const updateConfig = async (req, res) => {
    try {
        const companyName = req.query.companyName;
        if (!companyName) {
            return res.status(400).send({
                status: false,
                message: "Please provide company name in query.",
            });
        }
        const dbName = await dbNameFromCLPCode(companyName);
        if (!dbName) {
            return res.status(400).send({
                status: false,
                message: `No db exist with this company name: ${companyName} or company name is not given in params.`
            });
        }
        const db = connectToDatabaseAndSwitch(dbName);
        const configModel = db.model("config", configSchema);

        const configId = +req.params.configId;

        const bodyData = req.body;
        if (Object.keys(bodyData).length === 0) {
            return res.status(400).send({
                status: false,
                message: "provide some data to update.",
            });
        }

        const configData = await configModel.findOneAndUpdate(
            { configId: configId },
            bodyData,
            { new: true }
        );

        if (!configData) {
            return res.status(204).send({
                status: false,
                message: "No config data found",
            });
        }

        return res.status(200).send({
            status: true,
            message: `config with id ${configId} updated.`,
            data: configData,
        });
    } catch (error) {
        return res.status(500).send({
            status: false,
            error: error.message,
        });
    }
};

const deleteConfig = async (req, res) => {
    try {
        const companyName = req.query.companyName;
        if (!companyName) {
            return res.status(400).send({
                status: false,
                message: "Please provide company name in query.",
            });
        }
        const dbName = await dbNameFromCLPCode(companyName);
        if (!dbName) {
            return res.status(400).send({
                status: false,
                message: `No db exist with this company name: ${companyName} or company name is not given in params.`
            });
        }
        const db = connectToDatabaseAndSwitch(dbName);
        const configModel = db.model("config", configSchema);

        const configId = +req.params.configId;

        const configData = await configModel.deleteOne({ configId: configId });

        if (!configData) {
            return res.status(204).send({
                status: false,
                message: "No config data found",
            });
        }

        return res.status(200).send({
            status: true,
            message: `config with id ${configId} deleted.`,
        });
    } catch (error) {
        return res.status(500).send({
            status: false,
            error: error.message,
        });
    }
};

module.exports = { getCompaniesByName, getCompaniesConfig };
