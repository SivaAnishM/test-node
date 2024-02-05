const mongoose = require("mongoose");

const dashBoardSchema = new mongoose.Schema(
    {
        sales: {
            type: Number,
            trim: true,
        },
        Recievables: {
            type: Number,
            trim: true,
        },
        Purchase: {
            type: Number,
            trim: true,
        },
        Paybles: {
            type: Number,
            trim: true,
        },
        Creditnote: {
            type: Number,
            trim: true,
        },
        Debitnote: {
            type: Number,
            trim: true,
        },
        Reciept: {
            type: Number,
            trim: true,
        },
        Payment: {
            type: Number,
            trim: true,
        },
        Bank: {
            type: Number,
            trim: true,
        },
        Cash: {
            type: Number,
            trim: true,
        },
        Salesorder: {
            type: Number,
            trim: true,
        },
        Purchaseorder: {
            type: Number,
            trim: true,
        },
    },

    { strict: false }
);

module.exports = { dashBoardSchema };
