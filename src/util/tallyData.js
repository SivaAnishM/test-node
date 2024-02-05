const axios = require('axios')

const fetchVoucherData = async () => {
    const axiosData = await axios.get('http://localhost:4000/gettallyvoucher')
    return axiosData.data.data
}

module.exports = {
    fetchVoucherData,
};
