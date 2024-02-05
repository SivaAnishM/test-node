
//----------------------------------- ID MAKER -------------------------------------//
function idMaker() {
    const id_no1 = Math.floor(Math.random() * 100000)
    let userId = `${id_no1}ID0`
    if (userId.length < 8) {
        userId = `2${userId}`
    } else if (userId.length < 7) {
        userId = `24${userId}`
    } else if (userId.length > 8) {
        userId = userId.slice(1)
    }
    return userId;
}
//----------------------------------- OTP MAKER -------------------------------------//
function otpMaker() {
    const id_no1 = Math.floor(Math.random() * 100);
    const id_no2 = Math.floor(Math.random() * 100);

    let otpMaker = `${id_no2}${id_no1}`
    if (otpMaker.length == 3) {
        otpMaker = `${otpMaker}2`
    } else if (otpMaker.length == 2) {
        otpMaker = `${otpMaker}25`
    } else if (otpMaker.length < 4) {
        otpMaker = otpMaker.slice(1)
    }

    console.log(otpMaker)
    return otpMaker;
}

module.exports = { idMaker, otpMaker };