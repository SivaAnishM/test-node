const { userSchema } = require("../../model/user");
const {
    connectToDatabaseAndSwitch,
} = require("../../util/dynamicDBcreateAndSwitch");

const upSertConnectorConfigInDB = async (req, res) => {
    try {
        const { machineId, email, config } = req.body;
        if (Object.keys(req.body).length === 0) {
            return res.status(400).send({
                status: false,
                message: "provide all data.",
            });
        }

        const rootDb = connectToDatabaseAndSwitch("users");
        const rootDbUserModel = rootDb.model("users", userSchema);
        const checkConnectorExists = await rootDbUserModel.findOne({
            email: email,
            "connectors.machineId": machineId,
        });

        if (!checkConnectorExists) {
            await rootDbUserModel.findOneAndUpdate(
                { email: email },
                {
                    $push: {
                        connectors: {
                            machineId: machineId,
                            companies: [],
                            config: config,
                        },
                    },
                },
                { new: true }
            );
        } else {
            await rootDbUserModel.updateOne(
                {
                    email: email,
                    connectors: {
                        $elemMatch: {
                            machineId: machineId,
                        },
                    },
                },
                {
                    $set: {
                        "connectors.$.config": config,
                    },
                },
                { new: true }
            );
        }
        return res.status(200).send({
            status: true,
            msg: "got the connector config data"
        });
    } catch (error) {
        console.log(error, "<-- error");
        return res.status(500).send({ error: error.message });
    }
};

const fetchConnectorConfig = async (req, res) => {
    try {
        const { machineId, email } = req.body;
        if (Object.keys(req.body).length === 0) {
            return res.status(400).send({
                status: false,
                message: "provide all data.",
            });
        }
        const rootDb = connectToDatabaseAndSwitch("users");
        const rootDbUserModel = rootDb.model("users", userSchema);
        const userData = await rootDbUserModel.findOne({
            email: email,
            "connectors.machineId": machineId,
        });

        if (!userData) {
            return res.status(404).send({
                status: false,
                msg: "No config found",
            });
        }
        const connector = userData.connectors.filter(
            (connector) => connector.machineId === machineId
        );
        const configData = connector[0].config;
        return res.status(200).send({
            status: true,
            msg: "got the connector config data",
            data: configData
        });
    } catch (error) {
        console.log(error, "<-- error");
        return res.status(500).send({ error: error.message });
    }
};

module.exports = { upSertConnectorConfigInDB, fetchConnectorConfig };
