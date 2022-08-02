var express = require('express');
var router = express.Router();

const DB = require("../common/database");
const MSG = require("../common/message");
const dayjs = require('dayjs');

//공지사항 추가
router.post('/', async (req,res) =>{
    const userId = req.body.userId;
    const title = req.body.title;
    const content = req.body.content;
    const category = req.body.category;
    try{
        if(!userId || !title || !content || !category){
            res.status(404).json({
                message : MSG.NO_REQUIRED_INFO,
                status : 404,
                servertime : dayjs().format('YYYY-MM-DD HH:MM:ss'),
                data : {}
            })
        }
        const userDB = await DB.execute({
            psmt: `select type from USER where user_id = ?`,
            binding: [userId]
        });

        if(!userDB[0].type || userDB[0].type === "member"){
            res.status(403).json({
                message : MSG.NO_AUTHORITY,
                status : 403,
                servertime : dayjs().format('YYYY-MM-DD HH:MM:ss'),
                data : {}
            });
        }else if(userDB[0].type == "admin"){
            const postDB = await DB.execute({
                psmt: `insert into POST (title, content, user_id, created_at, category) VALUES(?,?,?,NOW(),?)`,
                binding: [title,content,userId,category]
            });

            res.status(201).json({
                message: MSG.POST_ADDED,
                status : 201,
                servertime : dayjs().format('YYYY-MM-DD HH:MM:ss'),
                data : {}
            });
        }

    }catch(e){
        console.error(e);
        res.status(500).json({
            message: MSG.UNKNOWN_ERROR,
            status : 500,
            servertime : dayjs().format('YYYY-MM-DD HH:MM:ss'),
            data : {}
        });
    }
})

//공지사항 목록조회
router.get('/',async (req,res) => {
    try{
        const postsDB = await DB.execute({
            psmt: `select post_id, username, title, content, p.created_at, p.updated_at, category from POST p, USER u WHERE u.user_id = p.user_id`,
            binding: []
        });

        console.log("posts: %j",postsDB);
        if(!postsDB){
            res.status(404).json({
                message: MSG.CANT_READ_POSTDATA,
                status : 404,
                servertime : dayjs().format('YYYY-MM-DD HH:MM:ss'),
                data : {}
            });
        }

        let posts = new Array();
        for(let i in postsDB){
            let postsObj = new Object();
            postsObj.postId = postsDB[i].post_id;
            postsObj.writerName = postsDB[i].username;
            postsObj.title = postsDB[i].title;
            postsObj.content = postsDB[i].content;
            postsObj.createdAt = dayjs(postsDB[i].created_at).format("YY-MM-DD HH:MM:SS");
            postsObj.updatedAt = dayjs(postsDB[i].updated_at).format("YY-MM-DD HH:MM:SS");
            postsObj.category = postsDB[i].category;

            posts.push(postsObj);
        }

        res.status(200).json({
            message: MSG.READ_POSTDATA_SUCCESS,
            status : 200,
            servertime : dayjs().format('YYYY-MM-DD HH:MM:ss'),
            data: {
                posts
            }
        });

    }catch (e){
        console.log(e);
        res.status(500).json({
            message: MSG.UNKNOWN_ERROR,
            status : 500,
            servertime : dayjs().format('YYYY-MM-DD HH:MM:ss'),
            data : {}
        });
    }
})

//공지사항 상세조회
router.get('/:postId', async (req,res) => {
    const postId = req.params.postId;
    try{
        const [postDB] = await DB.execute({
            psmt: `select title, content, p.created_at, u.user_id, username, email, type from POST p, USER u WHERE u.user_id = p.user_id and post_id = ?`,
            binding: [postId]
        });

        console.log("post: %j",postDB);
        if(!postDB){
            res.status(404).json({
                message: MSG.NO_POST_DATA,
                status : 404,
                servertime : dayjs().format('YYYY-MM-DD HH:MM:ss'),
                data : {}
            });
        }

        res.status(200).json({
            message: `${postDB.title} ${MSG.READ_POST_SUCCESS}`,
            status : 200,
            servertime : dayjs().format('YYYY-MM-DD HH:MM:ss'),
            data: {
                title: postDB.title,
                content: postDB.content,
                createdAt: dayjs(postDB.created_at).format("YY-MM-DD HH:MM:SS"),
                updatedAt: dayjs(postDB.updated_at).format("YY-MM-DD HH:MM:SS"),
                category: postDB.category,
                writer :{
                    userId : postDB.user_id,
                    userName : postDB.username,
                    email : postDB.email,
                    type : postDB.type
                }
            }
        });

    }catch (e){
        console.error(e);
        res.status(500).json({
            message: MSG.UNKNOWN_ERROR,
            status : 500,
            servertime : dayjs().format('YYYY-MM-DD HH:MM:ss'),
            data : {}
        });
    }
})

//공지사항 수정
router.patch('/:postId', async (req,res,next) =>{
    const userId = req.body.userId;
    const title = req.body.title;
    const content = req.body.content;
    const category = req.body.category;
    const postId = req.params.postId;
    try{
        const userDB = await DB.execute({
            psmt: `select type from USER where user_id = ?`,
            binding: [userId]
        });

        if(!userDB[0].type || userDB[0].type === "member"){
            res.status(403).json({
                message: MSG.NO_AUTHORITY,
                status : 403,
                servertime : dayjs().format('YYYY-MM-DD HH:MM:ss'),
                data : {}
            });
        }else if(userDB[0].type == "admin"){
            let sql = 'update POST set';
            const bindings = [];

            if(title != null){
                sql += ' title = ?,';
                bindings.push(title);
            }
            if(content != null){
                sql += ' content = ?,';
                bindings.push(content);
            }
            if(category != null){
                sql += ' category = ?,';
                bindings.push(category);
            }
            if(userId != null){
                sql += ' user_id = ?,';
                bindings.push(userId);
            }
            sql += ' updated_at = NOW() where post_id = ?;';
            bindings.push(postId);

            const postDB = await DB.execute({
                psmt: sql,
                binding: bindings
            });

            res.status(201).json({
                message: MSG.POST_UPDATE_SUCCESS,
                status : 201,
                servertime : dayjs().format('YYYY-MM-DD HH:MM:ss'),
                data : {}
            });
        }

    }catch(e){
        console.error(e);
        res.status(501).json({
            message: e.message,
            status : 501,
            servertime : dayjs().format('YYYY-MM-DD HH:MM:ss'),
            data : {}
        });
    }
})

//공지사항 삭제
router.patch('/:postId/delete', async (req,res,next) =>{
    const userId = req.body.userId;
    const postId = req.params.postId;
    try{
        const userDB = await DB.execute({
            psmt: `select type from USER where user_id = ?`,
            binding: [userId]
        });

        if(!userDB[0].type || userDB[0].type === "member"){
            res.status(403).json({
                message: MSG.NO_AUTHORITY,
                status : 403,
                servertime : dayjs().format('YYYY-MM-DD HH:MM:ss'),
                data : {}
            });
        }else if(userDB[0].type == "admin"){
            const postDB = await DB.execute({
                psmt: `update POST set canceled_at = NOW() where post_id = ?`,
                binding: [postId]
            });

            res.status(201).json({
                message: MSG.POST_DELETE_SUCCESS,
                status : 201,
                servertime : dayjs().format('YYYY-MM-DD HH:MM:ss'),
                data : {}
            });
        }

    }catch(e){
        console.error(e);
        res.status(501).json({
            message: e.message,
            status : 501,
            servertime : dayjs().format('YYYY-MM-DD HH:MM:ss'),
            data : {}
        });
    }
})

module.exports = router;