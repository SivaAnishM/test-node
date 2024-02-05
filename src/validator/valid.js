const mongoose = require('mongoose')

/*-----------------------------------NAME VALIDATION--------------------------------------------*/

const isValidName = function (name) {
    const nameRegex = /^([a-zA-Z]+\s)*[a-zA-Z]+$/;
    return nameRegex.test(name);
};

/*-----------------------------------MOBILE NUMBER VALIDATION-----------------------------------*/

const isValidMobile = function (mobile) {
    const mobileRegex =
        /^(?:\+?\d{1,3}[ -]?)?\d{10}$/;
    return mobileRegex.test(mobile);
};

/*-----------------------------------EMAIL VALIDATION--------------------------------------------*/

const isValidEmail = function (email) {
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return emailRegex.test(email);
};

/*-----------------------------------------PASSWORD VALIDATION------------------------------------*/

const isValidPassword = function (password) {
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,15}$/;
    return passwordRegex.test(password);
};

/*---------------------------- idCharacterValid ----------------------------------------------*/

const isValidId = function (value) {
    return mongoose.Types.ObjectId.isValid(value);
  };

module.exports = { isValidPassword, isValidName, isValidMobile, isValidEmail, isValidId };
