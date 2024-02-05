const moment = require('moment');

function organizeByMonth(arrayOfObjects) {
    const organizedArray = [];

    arrayOfObjects.forEach(obj => {
        const monthYearKey = moment(obj.date).format('MMM YY');

        const monthData = organizedArray.find(entry => entry.month === monthYearKey);

        if (monthData) {
            monthData.data.push(obj);
            monthData.total += +obj.amount || 0;
        } else {
            organizedArray.push({ month: monthYearKey, data: [obj], total: +obj.amount || 0 });
        }
    });

    return organizedArray;
}

function organizeByMonthLedger(arrayOfObjects) {
    const organizedArray = [];

    arrayOfObjects.forEach(obj => {
        const monthYearKey = moment(obj.date).format('MMM YY');

        const monthData = organizedArray.find(entry => entry.month === monthYearKey);

        if (monthData) {
            monthData.data.push(obj);
            monthData.total += +obj.amount || 0;
        } else {
            organizedArray.push({ month: monthYearKey, data: [obj], total: +obj.amount || 0 });
        }
    });

    return organizedArray;
}

module.exports = { organizeByMonth, organizeByMonthLedger };