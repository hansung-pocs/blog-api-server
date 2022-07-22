var express = require('express');
var router = express.Router();

const DB = require("../common/database");
const dayjs = require('dayjs');

//공지사항 추가
router.post('/', async (req,res) =>{
    const user_id = Number(req.body.user_id);
    const title = JSON.stringify(req.body.title);
    const content = JSON.stringify(req.body.content);
    const category = JSON.stringify(req.body.category);
    try{
        const userDB = await DB.execute({
            psmt: `select type from USER where user_id = ?`,
            binding: [user_id]
        });

        if(userDB[0].type == null){
            res.status(404).json({
                message: "권한이 없습니다.",
                servertime: new Date()
            });
        }else if(userDB[0].type == "primary"){
            const postDB = await DB.execute({
                psmt: `insert into POST (title, content, user_id, created_at, category) VALUES(?,?,?,NOW(),?)`,
                binding: [title,content,user_id,category]
            });

            res.status(201).json({
                message: "공지사항 추가 완료",
                servertime: new Date()
            });
        }

    }catch(e){
        console.error(e);
        res.status(500).json({
            message: "알 수 없는 오류가 발생했습니다.",
            servertime: new Date()
        });
    }
})

//공지사항 목록조회
router.get('/',async (req,res) => {
    try{
        const postsDB = await DB.execute({
            psmt: `select post_id, user_id, title, created_at, updated_at, category from POST`,
            binding: []
        });

        console.log("posts: %j",postsDB);
        if(!postsDB){
            res.status(404).json({
                message: "잘못된 요청입니다.",
                servertime: new Date()
            });
        }

        let posts = new Array();
        for(let i in postsDB){
            let postsObj = new Object();
            postsObj.post_id = postsDB[i].post_id;
            postsObj.user_id = postsDB[i].user_id;
            postsObj.title = postsDB[i].title;
            postsObj.created_at = dayjs(postsDB[i].created_at).format("YY-MM-DD HH:MM:SS");
            postsObj.updated_at = dayjs(postsDB[i].updated_at).format("YY-MM-DD HH:MM:SS");
            postsObj.category = postsDB[i].category;

            posts.push(postsObj);
        }

        res.status(200).json({
            message: "공지사항 목록 조회",
            servertime: new Date(),
            data: {
                posts
            }
        });

    }catch (e){
        console.log(e);
        res.status(500).json({
            message: "알 수 없는 오류가 발생했습니다.",
            servertime: new Date()
        });
    }
})

//공지사항 상세조회
router.get('/detail', async (req,res) => {
    const post_id = req.query.post_id;
    try{
        const [postDB] = await DB.execute({
            psmt: `select title, content, n.created_at, u.user_id, username, email, type from POST n, USER u WHERE u.user_id = n.user_id and post_id = ?`,
            binding: [post_id]
        });

        console.log("users: %j",postDB);
        if(!postDB){
            res.status(404).json({
                message: "해당 공지사항이 존재하지 않습니다.",
                servertime: new Date()
            });
        }

        res.status(200).json({
            message: "공지사항 상세 조회",
            servertime: new Date(),
            data: {
                title: postDB.title,
                content: postDB.content,
                created_at: dayjs(postDB.created_at).format("YY-MM-DD HH:MM:SS"),
                updated_at: dayjs(postDB.updated_at).format("YY-MM-DD HH:MM:SS"),
                category: postDB.category,
                user :{
                    user_id : postDB.user_id,
                    username : postDB.username,
                    email : postDB.email,
                    type : postDB.type
                }
            }
        });

    }catch (e){
        console.error(e);
        res.status(500).json({
            message: "알 수 없는 오류가 발생했습니다.",
            servertime: new Date()
        });
    }
})

//공지사항 수정
router.put('/edit', async (req,res,next) =>{
    const user_id = Number(req.body.user_id);
    const title = JSON.stringify(req.body.title);
    const content = JSON.stringify(req.body.content);
    const category = JSON.stringify(req.body.category);
    const post_id = Number(req.query.post_id);
    try{
        const userDB = await DB.execute({
            psmt: `select type from USER where user_id = ?`,
            binding: [user_id]
        });

        if(userDB[0].type == null){
            res.status(404).json({
                message: "권한이 없습니다.",
                servertime: new Date()
            });
        }else if(userDB[0].type == "primary"){
            const postDB = await DB.execute({
                psmt: `update POST set title = ?, content = ?, category = ?, user_id = ?, updated_at = NOW() where post_id = ?`,
                binding: [title,content,category,user_id,post_id]
            });

            res.status(201).json({
                message: "공지사항 수정 완료",
                servertime: new Date()
            });
        }

    }catch(e){
        console.error(e);
        res.status(500).json({
            message: "알 수 없는 오류가 발생했습니다.",
            servertime: new Date()
        });
    }
})

//공지사항 삭제
router.put('/delete', async (req,res,next) =>{
    const user_id = Number(req.body.user_id);
    const post_id = Number(req.query.post_id);
    try{
        const userDB = await DB.execute({
            psmt: `select type from USER where user_id = ?`,
            binding: [user_id]
        });

        if(userDB[0].type == null){
            res.status(404).json({
                message: "권한이 없습니다.",
                servertime: new Date()
            });
        }else if(userDB[0].type == "primary"){
            const postDB = await DB.execute({
                psmt: `update POST set canceled_at = NOW() where post_id = ?`,
                binding: [post_id]
            });

            res.status(201).json({
                message: "공지사항 삭제 완료",
                servertime: new Date()
            });
        }

    }catch(e){
        console.error(e);
        res.status(500).json({
            message: "알 수 없는 오류가 발생했습니다.",
            servertime: new Date()
        });
    }
})

module.exports = router;