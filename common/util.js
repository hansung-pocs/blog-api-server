const dayjs = require("dayjs");

const getReturnObject = (message, status, data) => {
    return {
        "message": message,
        "status": status,
        "servertime": dayjs().format('YYYY-MM-DD HH:mm:ss'),
        "data": data
    }
}

module.exports = {
    getReturnObject,
}