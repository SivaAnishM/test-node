const companiesConfig = require("../../model/config");

const createCompaniesConfig = async (req, res) => {
    try {
        const data = req.body;
        if (Object.keys(data).length === 0) {
            return res.status(400).send({
                status: false,
                message: "provide all data.",
            });
        }
        data.type = "company";
        // console.log(data, "data")
        const companyConfigData = await companiesConfig.create(data);

        return res.status(201).send({
            status: true,
            message: "company config creatred successfully.",
            data: companyConfigData,
        });
    } catch (error) {
        return res.status(500).send({
            status: false,
            error: error.message,
        });
    }
};

module.exports = {
    createCompaniesConfig,
};
