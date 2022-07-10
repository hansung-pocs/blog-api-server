var express = require('express');
var router = express.Router();

const DB = require("../common/database");
const dayjs = require('dayjs');

//공지사항 추가
router.post('/notices',async (req,res,next) =>{
    const userId = req.body.user_id;
    try{
        const [type] = await DB.execute({
            psmt: `select type from USER where user_id = ?`,
            binding: [userId]
        });
        if(type == '일반유저'){
            res.status(400).json({success: "false", message: '권한이 없습니다.'})
        }
        next();
    }catch(e){
        console.error(e);
        res.status(500).json({
            ok: false,
            message: "알 수 없는 오류가 발생했습니다."
        });
    }
}, async (req,res) =>{
    const title = req.body.title;
    const content = req.body.content;
    const userId = req.body.user_id;
    const created_at = dayjs().format("YY-MM-DD");
    try{
        const [notice] = await DB.execute({
            psmt: `insert into NOTICE (title, content, user_id, created_at) VALUES(?,?,?,?)`,
            binding: [title,userId,content,created_at]
        });
        res.status(201).json({id: userId, success: 'true'});
    } catch (e){}
        console.log(e);
        res.status(500).json({
            ok: false,
            message: "알 수 없는 오류가 발생했습니다."
        });
    })

//공지사항 목록조회
router.get('/notices',async (req,res) => {
    try{
        const [notices] = await DB.execute({
            psmt: `select title, created_at from NOTICE`,
            binding: []
        });

        console.log("users: %j",notices);
        if(!notices){
            res.status(404).json({ok: false, message: "잘못된 요청입니다."});
        }

        for(let i in notices){
            res.json({
                notices: [{
                    title: notices[i].title,
                    createdAt: notices[i].created_at
                }]
            });
        }
    }catch (e){
        console.log(e);
        res.status(500).json({
            ok: false,
            message: "알 수 없는 오류가 발생했습니다."
        });
    }
})

//공지사항 상세조회
router.get('/notices/:noticeId', async (req,res) => {
    const noticeId = req.params.noticeId;
    try{
        const [notice] = await DB.execute({
            psmt: `select title, content, n.created_at, u.user_id, username from NOTICE n, USER u WHERE u.user_id = n.user_id and notice_id = ?`,
            binding: [noticeId]
        });

        console.log("users: %j",notice);
        if(!notice){
            res.status(404).json({success: false, message: "해당 공지사항이 존재하지 않습니다."});
        }

        res.json({
            title: notice[0].title,
            content: notice[0].content,
            createdAt: dayjs(notice[0].created_at).format("YY-MM-DD"),
            user :{
                id : notice[0].user_id,
                name : notice[0].username,
            }
        });
    }catch (e){
        console.error(e);
        res.status(500).json({
            ok: false,
            message: "알 수 없는 오류가 발생했습니다."
        });
    }
})