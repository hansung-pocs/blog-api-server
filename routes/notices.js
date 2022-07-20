var express = require('express');
var router = express.Router();

const DB = require("../common/database");
const dayjs = require('dayjs');

//공지사항 추가
router.post('/', async (req,res,next) =>{
    const userId = Number(req.body.userId);
    try{
        const user = await DB.execute({
            psmt: `select type from USER where user_id = ?`,
            binding: [userId]
        });

        if(user[0].type == null){
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
    const title = JSON.stringify(req.body.title);
    const content = JSON.stringify(req.body.content);
    const userId = Number(req.body.userId);
    const category = JSON.stringify(req.body.category);
    try{
        const notice = await DB.execute({
            psmt: `insert into NOTICE (title, content, user_id, created_at, category) VALUES(?,?,?,NOW(),?)`,
            binding: [title,content,userId,category]
        });
        res.status(201).json({id: userId, success: 'true'});
    } catch (e){
        console.log(e);
        res.status(500).json({
            ok: false,
            message: "알 수 없는 오류가 발생했습니다."
        });
    }
})

//공지사항 목록조회
router.get('/',async (req,res) => {
    try{
        const notices = await DB.execute({
            psmt: `select notice_id, title, created_at, updated_at, category from NOTICE`,
            binding: []
        });

        console.log("notices: %j",notices);
        if(!notices){
            res.status(404).json({ok: false, message: "잘못된 요청입니다."});
        }

        for(let i in notices){
            notices[i].created_at = dayjs(notices[i].created_at).format("YY-MM-DD");
            notices[i].updated_at = dayjs(notices[i].updated_at).format("YY-MM-DD");
        }
        res.json({notices : notices});
    }catch (e){
        console.log(e);
        res.status(500).json({
            ok: false,
            message: "알 수 없는 오류가 발생했습니다."
        });
    }
})

//공지사항 상세조회
router.get('/:noticeId', async (req,res) => {
    const noticeId = req.params.noticeId;
    try{
        const [notice] = await DB.execute({
            psmt: `select title, content, n.created_at, u.user_id, username, email, type from NOTICE n, USER u WHERE u.user_id = n.user_id and notice_id = ?`,
            binding: [noticeId]
        });

        console.log("users: %j",notice);
        if(!notice){
            res.status(404).json({success: false, message: "해당 공지사항이 존재하지 않습니다."});
        }

        res.json({
            title: notice.title,
            content: notice.content,
            created_at: dayjs(notice.created_at).format("YY-MM-DD"),
            updated_at: dayjs(notice.updated_at).format("YY-MM-DD"),
            category: notice.category,
            user :{
                user_id : notice.user_id,
                username : notice.username,
                email : notice.email,
                type : notice.type,
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

module.exports = router;