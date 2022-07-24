const Util = require("../common/util");
const DB = require("../common/database");
const MSG = require("../common/message");
const dayjs = require('dayjs');

const newUser = async options => {
    const {data} = options;
    
    if (!data || !data.userName || !data.password || !data.name || !data.studentId || !data.email || !data.generation || !data.type)
        return Util.getReturnObject(MSG.NO_REQUIRED_INFO, 404, {})


    try { 
        await DB.execute({
            psmt: `insert into USER (username, password, name, student_id, email, generation, type, company, github, created_at, updated_at) 
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ? NOW(), NOW())`,
            binding: [data['username'], data['password'], data['name'], data['studentId'], data['email'], data['generation'], data['type'],
            data['company'] || null , data['github'] || null]
        });

        return Util.getReturnObject(MSG.POST_ADDED, 201, {})
    } catch (error) {
        console.log(error);
        return Util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {})
    }
}

const kickUser = async options => {
    const {userId} = options;

    try {
        await DB.execute({
            psmt: `update USER SET canceled_at = NOW() where user_id = ?`,
            binding : [userId]
        })

        return Util.getReturnObject(MSG.USER_KICK_SUCCESS, 201, {});
    } catch(error) {
        console.log(error)
        return Util.getReturnObject(error.message, 501, {})
    }
}

const getPostsByUserID = async options => {
    const {userId} = options;

    try {
        const [posts] = await execute({
            psmt: `select * from POST where user_id = ?`,
            binding: [userId]
        });

        if (Util.isEmpty(posts)) {
            return Util.getReturnObject(MSG.CANT_READ_POSTDATA, 404, {})
        }

        let ret = new Array();
        
        posts.forEach(post => {
            const obj = {
                postId : post.post_id,
                title : post.title,
                content : post.content,
                createdAt : dayjs(post.created_at).format("YYYY-MM-DD"),
                updatedAt : dayjs(post.updated_at).format("YYYY-MM-DD"),
                category : post.category
            }
            if (forAdmin)
                obj.canceledAt = dayjs(post.canceled_at).format("YYYY-MM-DD")

            ret.push(obj);
        });

        return Util.getReturnObject("관리자 권한으로 " + MSG.READ_POSTDATA_SUCCESS, 200, {"posts":ret})
    }
    
    catch (error) {
        console.log(error);
        return Util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {});
    }
}

module.exports = {
    newUser,
    kickUser,
    getPostsByUserID
}
