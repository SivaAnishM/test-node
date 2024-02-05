const { configSchema } = require("../../model/config");

const {
    connectToDatabaseAndSwitch,
} = require("../../util/dynamicDBcreateAndSwitch");
const { connect } = require("../../util/clientConnection");

const createPermissionConfig = async (req, res) => {
    try {
        const { companyName } = req.query;
        if (!companyName) {
            return res.status(400).send({
                msg: "need company name in request",
            });
        }

        const companyDb = connectToDatabaseAndSwitch(companyName);
        // const sqlDb = await switchDB(companyName);
        const sqlDb = await connect()
        // let sqlDb = new Client(dbConfig)
        // await sqlDb.connect()

        const queryRun = await sqlDb.query(
            `SELECT name FROM ${companyName}.mst_group
            WHERE group_reserved_name = 'Sundry Creditors' OR group_reserved_name = 'Sundry Debtors';`
        );

        const paretArr = queryRun.rows.map((item) => item.name);

        // let paretArr = ["Sundry Debtors", "Sundry Creditors"]
        let ledgergroupLists = await sqlDb.query(`SELECT name FROM ${companyName}.mst_group WHERE primary_group = ANY ($1);`, [paretArr]);

        const accessByLedgerGroups = {};
        ledgergroupLists.rows.forEach(item => {
            accessByLedgerGroups[item.name] = true;
        });

        let stockGroupLists = await sqlDb.query(`SELECT name FROM ${companyName}.mst_stock_group;`);
        const accessByStockGroup = {};
        stockGroupLists.rows.forEach(item => {
            accessByStockGroup[item.name] = true;
        });

        let voucherTypeList = await sqlDb.query(`SELECT voucher_reserved_name as name FROM ${companyName}.mst_vouchertype;`);
        const uniqueObjects = voucherTypeList.rows.reduce((acc, obj) => {
            if (!acc.some(item => item.name === obj.name)) {
                acc.push(obj);
            }
            return acc;
        }, []);
        const acessByVoucherType = {};
        const accessByDataEntryVoucherType = { isAllowed: true }
        uniqueObjects.forEach(item => {
            acessByVoucherType[item.name] = true;
            accessByDataEntryVoucherType[item.name] = true;
        });

        const finalObj = {
            configId: 666,
            permissions: {
                accessByLedgerGroups,
                accessByStockGroup,
                acessByVoucherType,
                accessByDataEntryVoucherType,
                accessByDataEntryMasters: {
                    createLedger: true,
                    createStockItem: true
                },
                reportAccess: {
                    dayBook: true,
                    expenses: true,
                    inactiveCustomers: true,
                    insctiveItems: true,
                    ledgerReports: true,
                    topReports: true,
                    myQuotoation: true,
                    myVouchers: true,
                    myParties: true,
                    myStockItems: true,
                    trackingReport: true,
                    balanceSheet: true,
                    profitLoss: true,
                    trialBalance: true
                },
                accessByScreen: {
                    items: true,
                    ledger: true,
                    report: true,
                },
                allowBackDatedEntries: true,
                shareAccess: true,
                priceListAccess: true,
                sharePermission: {
                    items: true,
                    ledger: true,
                    inactiveCustomers: true,
                    inactiveItems: true,
                    topReports: true,
                }
            }
        }

        const companyConfigModel = companyDb.model("config", configSchema);
        await companyConfigModel.deleteMany()
        const configInCompany = await companyConfigModel.create(finalObj)
        // await sqlDb.end();
        return res.status(201).send({
            msg: "config created successfully",
            configInCompany
        });
    } catch (error) {
        return res.status(500).send({
            error: error.message,
        });
    }
};

const fetchPermissionConfig = async (configId, companyName) => {
    try {
        if (!companyName) {
            return res.status(400).send({
                msg: "need company name in request",
            });
        }
        if (!configId) {
            return res.status(400).send({
                msg: "need configId in request",
            });
        }
        configId = +configId;

        const companyDb = connectToDatabaseAndSwitch(companyName);
        const companyConfigModel = companyDb.model("config", configSchema);

        const getData = await companyConfigModel.findOne({ configId });

        if (!getData) {
            return `no data found with congifId : ${configId}`
        }

        return getData
    } catch (error) {
        return error
    }
};

module.exports = { fetchPermissionConfig, createPermissionConfig };
