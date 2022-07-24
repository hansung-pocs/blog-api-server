const Util = require("../common/util");
const DB = require("../common/database");
const MSG = require("../common/message");
const dayjs = require('dayjs');

const getAllPosts = async options => {
    const {forAdmin} = options;
    const sql = forAdmin ? 
    `select * FROM POST INNER JOIN USER ON POST.user_id = USER.user_id order by POST.post_id DESC;` : 
    `select * FROM POST INNER JOIN USER ON POST.user_id = USER.user_id where POST.canceled_at is NULL order by POST.post_id DESC ;`

    try {
        const [posts] = await DB.execute({
            psmt: sql,
            binding: []
        });

        if (Util.isEmpty(posts)) {
            return Util.getReturnObject(MSG.CANT_READ_POSTDATA, 404, {})
        }

        let ret = new Array();
        
        posts.forEach(post => {
            const obj = {
                postId : post.post_id,
                writerName :post.username,
                title : post.title,
                content : post.content,
                createdAt : dayjs(post.created_at).format("YYYY-MM-DD"),
                updatedAt : dayjs(post.updated_at).format("YYYY-MM-DD"),
                category : post.category
            }
            if (forAdmin)
                obj.canceledAt = post.canceled_at ? dayjs(post.canceled_at).format("YYYY-MM-DD") : "-";

            ret.push(obj);
        });

        return Util.getReturnObject(MSG.READ_POSTDATA_SUCCESS, 200, {"posts":ret})
    }
    
    catch (error) {
        console.log(error);
        return Util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {});
    }
}

const getPost = async options => {
    const {postId, forAdmin} = options;

    try {
        const [data] = await DB.execute({
            psmt: `select * FROM POST INNER JOIN USER ON POST.user_id = USER.user_id where POST.post_id=?;`,
            binding: [postId]
        });

        if (Util.isEmpty(data)) {
            return Util.getReturnObject(MSG.NO_POST_DATA, 404, null)
        }

        let post = data[0];
        
        const post_obj = {
            title : post.title,
            content : post.content,
            created_at : dayjs(post.created_at).format("YYYY-MM-DD HH:MM:ss"),
            updated_at : dayjs(post.updated_at).format("YYYY-MM-DD HH:MM:ss"),
            category : post.category,
            "writer" : {
                "userId" : post.user_id,
                "username" : post.username,
                "email" : post.email,
                "type" : Util.convertType(post.type),
            }
        }

        return Util.getReturnObject(post.title+MSG.READ_POST_SUCCESS, 200, post_obj);
    } catch(error) {
        console.log(error);
        return Util.getReturnObject(MSG.UNKNOWN_ERROR, 500, null);
    }
}

const newPost = async options => {
    const {data} = options;
    
    if (!data || !data.title || !data.content || !data.userId || !data.category)
        return Util.getReturnObject(MSG.NO_REQUIRED_INFO, 404, {})


    try { 
        const [user] = await DB.execute({
            psmt: `select * from USER where user_id = ?`,
            binding: [data["userId"]]
        });
 
        if (Util.isEmpty(user) || !user[0].type || user[0].type==="비회원") {
            return Util.getReturnObject(MSG.NO_AUTHORITY, 403, {})
        }

        await DB.execute({
            psmt: `insert into POST (title, content, user_id, category, created_at, updated_at) VALUES(?, ?, ?, ?, NOW(), NOW())`,
            binding: [data['title'], data['content'], data['userId'], data['category']]
        });

        return Util.getReturnObject(MSG.POST_ADDED, 201, {})
    } catch (error) {
        console.log(error);
        return Util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {})
    }
}

const editPost = async options => {
    const {postId, data} = options;

    if (Object.keys(data).length === 0)
        return Util.getReturnObject(MSG.NO_CHANGED_INFO, 404, {})

    let sql = `update POST SET`;
    const bindings = [];

    Object.entries(data).forEach(([key, value]) => {
        sql += ` ${key}=?,`;
        bindings.push(value);
    });
    
    sql += `updated_at = NOW() where post_id = ?;`;
    bindings.push(postId);

    try {
        await DB.execute({
            psmt : sql,
            binding : bindings
        });

        return Util.getReturnObject(MSG.POST_UPDATE_SUCCESS, 302, {});
    } catch (error) {
        console.log(error);
        return Util.getReturnObject(error.message, 501, {});
    }
}

const deletePost = async options => {
    const {postId} = options;

    try {
        await DB.execute({
            psmt: `update POST SET canceled_at = NOW() where post_id = ?`,
            binding : [postId]
        })

        return Util.getReturnObject(MSG.POST_DELETE_SUCCESS, 201, {});
    } catch(error) {
        console.log(error)
        return Util.getReturnObject(error.message, 501, {})
    }
}

module.exports = {
    getAllPosts,
    getPost,
    newPost,
    editPost,
    deletePost
}
