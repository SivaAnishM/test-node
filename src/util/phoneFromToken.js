const { userSchema } = require("../model/user");
const { connectToDatabaseAndSwitch } = require("./dynamicDBcreateAndSwitch");

const phoneFromToken = async (req, res) => {
    try {
        const decodedToken = req.token;
        const userIdfrmTkn = decodedToken.userId;
        const db = connectToDatabaseAndSwitch("users");
        const userModel = db.model("user", userSchema);

        const userData = await userModel.findById({ _id: userIdfrmTkn });
        if (!userData) {
            return res.status(400).send({
                status: false,
                msg: "User not found."
            });
        }

        return res.status(200).send({
            status: true,
            phone: userData.phoneNumber
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

module.exports = { phoneFromToken };