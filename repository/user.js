const Util = require("../common/util");
const DB = require("../common/database");
const MSG = require("../common/message");
const dayjs = require('dayjs');

const getAllUsers = async options => {
    const {forAdmin} = options;
    const sql = forAdmin ? `select * from USER;` : `select * from USER where canceled_at IS NULL;`

    try {
        const [users] = await DB.execute({
            psmt: sql,
            binding: []
        });

        if (Util.isEmpty(users)) {
            return Util.getReturnObject(MSG.CANT_READ_USERDATA, 404, {})
        }

        let ret = new Array();

        users.forEach(user => {
            const obj = {
                userId : user.user_id,
                userName :user.username,
                email : user.email,
                studentId : user.student_id,
                generation : user.generation,
                type : Util.convertType(user.type),
                company : user.company || "-",
                github : user.github || "-",
                createdAt : dayjs(user.created_at).format("YYYY-MM-DD")
            }
            if (forAdmin)
                obj.canceledAt = user.canceled_at ? dayjs(user.canceled_at).format("YYYY-MM-DD") : "-";
            ret.push(obj);
        });

        return Util.getReturnObject(forAdmin ? "관리자 권한으로 " + MSG.READ_USERDATA_SUCCESS : MSG.READ_USERDATA_SUCCESS, 200, {"users":ret})
    } catch (error) {
        console.log(error);
        return Util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {});
    }
}

const getUser = async options => {
    const {userId, forAdmin} = options
    try {
        const [data] = await DB.execute({
            psmt: `select * from USER where user_id = ?`,
            binding: [userId]
        });
 
        if (Util.isEmpty(data)) {
            return Util.getReturnObject(MSG.NO_USER_DATA, 404, {})
        }
        
        user = data[0];

        const user_obj = {
            userId,
            userName : user.username,
            email : user.email,
            studentId : user.student_id,
            type : Util.convertType(user.type),
            company : user.company || "-",
            github : user.github || "-",
            createdAt :  dayjs(user.created_at).format("YYYY-MM-DD"),
        }
        if (forAdmin)
            user_obj.canceledAt = dayjs(user.created_at).format("YYYY-MM-DD");

        return Util.getReturnObject(forAdmin ? "관리자 권한으로 " + user.username+MSG.READ_USER_SUCCESS : user.username+MSG.READ_USER_SUCCESS, 200, user_obj);
    } catch (error) {
        console.log(error);
        return Util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {});
    }
}

const editUser = async options => {
    const {userId, data} = options;

    if (Object.keys(data).length === 0)
        return Util.getReturnObject(MSG.NO_CHANGED_INFO, 404, {})

    let sql = `update USER SET`;
    const bindings = [];

    Object.entries(data).forEach(([key, value]) => {
        sql += ` ${key}=?,`;
        bindings.push(value);
    });
    
    sql += `updated_at = NOW() where user_id = ?;`;
    bindings.push(userId);

    try {
        await DB.execute({
            psmt : sql,
            binding : bindings
        });

        return Util.getReturnObject(MSG.USER_UPDATE_SUCCESS, 302, {});
    } catch (error) {
        console.log(error);
        return Util.getReturnObject(error.message, 501, {});
    }
}

module.exports = {
    getUser,
    getAllUsers,
    editUser
}
