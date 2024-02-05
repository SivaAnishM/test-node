const { connect } = require("../../../src/util/clientConnection");
const { dbNameFromCLPCode } = require("../../util/dbNameFromCLPCode");

const fetchInvoiceP = async (req, res) => {
    try {
        const { companyName, guid } = req.query;

        if (!companyName) {
            return res.status(400).send({
                status: false,
                message: "Please provide company name in query.",
            });
        }
        if(!guid){
            return res.status(400).send({
                status: false,
                message: "Please provide voucher guid in query.",
            });
        }
        const dbName = await dbNameFromCLPCode(companyName);
        if (!dbName) {
            return res.status(400).send({
                status: false,
                message: `No db exist with this company name: ${companyName} or company name is not given in params.`
            });
        }

        // const db = await switchDB(companyName);
        const db = await connect();
        const voucherTypeQuery = `select b.voucher_reserved_name from ${dbName}.trn_voucher as v
        inner join ${dbName}.mst_vouchertype as b on b.guid = v._voucher_type
        where v.guid='${guid}'`;

        const voucherTypeResult = await db.query(voucherTypeQuery);
        if (voucherTypeResult.rows.length === 0) {
            return res.status(404).send({
                msg: "No data found or invalid voucher guid.",
            });
        }
        console.log(voucherTypeResult.rows);
        const parentType = voucherTypeResult.rows[0].voucher_reserved_name;

        if (parentType === "Sales" || parentType === "Purchase") {
            console.log("For sales, purchase");
            const inventoryDetailsQuery = `select v.*,j.ledger,j.amount,j.bank_date, j.transaction_type, j.bank_name,j.instrument_number,p.voucher_reserved_name as newParent, p.*,
                j.unique_ref_number, j.payment_mode,j.bank_party,j.bank_amount, d.item, d.quantity, d.rate, d.amount as item_amount, p.parent as voucher_type_parent
                from ${dbName}.trn_voucher as v
                inner join ${dbName}.mst_vouchertype as p on p.guid = v._voucher_type
                inner join ${dbName}.trn_accounting as j on j.guid = v.guid
                inner join ${dbName}.trn_inventory as d on d.guid = v.guid
                where v.guid = '${guid}'
                and v.party_name = j.ledger`;

            const inventoryDetails = await db.query(inventoryDetailsQuery);

            const accountingDetailsQuery = `select * from ${dbName}.trn_voucher as v
                inner join ${dbName}.trn_accounting as j on j.guid = v.guid
                where v.guid = '${guid}'
                and v.party_name != j.ledger`;

            const accountingDetails = await db.query(accountingDetailsQuery);

            return res.status(200).send({
                status: true,
                inventoryData: inventoryDetails.rows,
                accountingData: accountingDetails.rows,
                message: "Voucher returned.",
            });
        } else {
            console.log("For other.");
            const accountingDetailsQuery = `select * from ${dbName}.trn_voucher as v
                inner join ${dbName}.trn_accounting as j on j.guid = v.guid
                where v.guid = '${guid}'
                and v.party_name != j.ledger`;

            const accountingDetails = await db.query(accountingDetailsQuery);

            return res.status(200).send({
                status: true,
                accountingData: accountingDetails.rows,
                message: "Voucher returned.",
            });
        }
    } catch (error) {
        res.send({ error: error.message });
    }
};

module.exports = { fetchInvoiceP };
