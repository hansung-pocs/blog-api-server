const mysql = require("mysql2/promise");

const pool = mysql.createPool({
    host: process.env.DB_URL,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,

    connectionLimit: 10,
    waitForConnections: true
});

pool.on("release", connection => {
    console.log(`connection ${connection.threadId} released`);
})

const getConnection = module.exports.getConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log("connectionId: ", connection.threadId);
        return connection;
    } catch (error) {
        console.log('error on get connection', error);
    }
}

const execute = module.exports.execute = async params => {
    console.log("on DB execute: %j", params);
    const {psmt, binding} = params;

    let connection;
    try {
        connection = await getConnection();
        const [result] = await connection.query(psmt, binding);

        connection.release();
        return result;
    } catch (error) {
        if (!!connection) {
            connection.release();
        }
        throw error;
    }
}