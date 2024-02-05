const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const {
    connectToDatabaseAndSwitch,
} = require("../util/dynamicDBcreateAndSwitch");
const { userSchema } = require("../model/user");
const { sessionSchema } = require("../model/sessionModel");

//AUTHENTICATION
const authentication = async (req, res, next) => {
    try {
        let token = req.headers["authorization"];
        if (!token) {
            return res.status(400).send({
                status: false,
                message: "Please provide token.",
            });
        }

        jwt.verify(
            token.split(" ")[1],
            process.env.JWT_PASSWORD,
            async (err, decodedToken) => {
                if (err) {
                    if (err.message === "jwt expired") {
                        //we have to remove that device from the devices array
                    }
                    return res.status(401).send({
                        status: false,
                        message: err.message,
                    });
                } else {
                    req.token = decodedToken;
                    const rootDb = connectToDatabaseAndSwitch("users");
                    const rootDbUserModel = rootDb.model("users", userSchema);

                    const userInfo = await rootDbUserModel.findById({
                        _id: decodedToken.userId,
                    });

                    const checkDeviceExists = userInfo?.devices.some(
                        (obj) => obj.deviceModel === decodedToken.deviceInfo.deviceModel
                    ); 

                    if (!checkDeviceExists) {
                        return res.status(200).send({
                            status: false,
                            message: "Your session is expired",
                        });
                    }
                    next();
                }
            }
        );
    } catch (error) {
        console.log(error);
        res.status(500).send({ error: error });
    }
};

const connectorAuthentication = async (req, res, next) => {
    try {
        let token = req.headers["authorization"];
        if (!token) {
            return res.status(400).send({
                status: false,
                message: "Please provide token.",
            });
        }

        jwt.verify(
            token.split(" ")[1],
            process.env.JWT_PASSWORD,
            async (err, decodedToken) => {
                if (err) {
                    return res.status(401).send({
                        status: false,
                        message: err.message,
                    });
                } else {
                    // const userId = new mongoose.Types.ObjectId(decodedToken.userId);
                    req.token = decodedToken;
                    // const rootDb = connectToDatabaseAndSwitch("users");
                    // const sessionModel = rootDb.model("session", sessionSchema);

                    // const userInfo = await sessionModel.findOne({
                    //     userId: userId,
                    //     isActive: true,
                    // });

                    // if (userInfo) {
                    //     if (
                    //         userInfo.deviceInfo.deviceModel !==
                    //         decodedToken.deviceInfo.deviceModel
                    //     ) {
                    //         return res.status(200).send({
                    //             status: false,
                    //             message: "Your session is expired",
                    //         });
                    //     }
                    // }

                    next();
                }
            }
        );
    } catch (error) {
        console.log(error);
        res.status(500).send({ error: error });
    }
};

//AUTHORIZATION

const authorization = async (req, res, next) => {
    try {
        const userId = req.params.userId;

        if (!userId) {
            return res.status(400).send({
                status: false,
                message: "Please provide userId in params.",
            });
        }
        const decodedToken = req.token;
        const userIdfrmDecodedTkn = decodedToken.userId;

        if (userId.toString() !== userIdfrmDecodedTkn) {
            return res.status(403).send({
                status: false,
                message: "Access denied!!!",
            });
        }
        next();
    } catch (error) {
        console.log(error);
        res.status(500).send({ error: error });
    }
};

module.exports = { authentication, connectorAuthentication, authorization };
