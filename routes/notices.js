var express = require('express');
var router = express.Router();

const DB = require("../common/database");
const dayjs = require('dayjs');

//공지사항 추가
router.post('/', async (req,res,next) =>{
    const user_id = Number(req.body.user_id);
    try{
        const user = await DB.execute({
            psmt: `select type from USER where user_id = ?`,
            binding: [user_id]
        });

        if(user[0].type == null){
            res.status(404).json({
                message: "권한이 없습니다.",
                servertime: new Date(),
                data: {
                    user_id
                }
            });
        }
        next();
    }catch(e){
        console.error(e);
        res.status(500).json({
            message: "알 수 없는 오류가 발생했습니다.",
            servertime: new Date()
        });
    }
}, async (req,res) =>{
    const title = JSON.stringify(req.body.title);
    const content = JSON.stringify(req.body.content);
    const user_id = Number(req.body.user_id);
    const category = JSON.stringify(req.body.category);
    try{
        const notice = await DB.execute({
            psmt: `insert into NOTICE (title, content, user_id, created_at, category) VALUES(?,?,?,NOW(),?)`,
            binding: [title,content,user_id,category]
        });

        res.status(201).json({
            message: "공지사항 추가 완료",
            servertime: new Date(),
        });

    } catch (e){
        console.log(e);
        res.status(500).json({
            message: "알 수 없는 오류가 발생했습니다.",
            servertime: new Date()
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
            res.status(404).json({
                message: "잘못된 요청입니다.",
                servertime: new Date()
            });
        }

        for(let i in notices){
            notices[i].created_at = dayjs(notices[i].created_at).format("YY-MM-DD");
            notices[i].updated_at = dayjs(notices[i].updated_at).format("YY-MM-DD");
        }

        res.status(200).json({
            message: "공지사항 목록 조회",
            servertime: new Date(),
            data: {
                notices
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
router.get('/:notice_id', async (req,res) => {
    const notice_id = req.params.notice_id;
    try{
        const [notice] = await DB.execute({
            psmt: `select title, content, n.created_at, u.user_id, username, email, type from NOTICE n, USER u WHERE u.user_id = n.user_id and notice_id = ?`,
            binding: [notice_id]
        });

        console.log("users: %j",notice);
        if(!notice){
            res.status(404).json({
                message: "해당 공지사항이 존재하지 않습니다.",
                servertime: new Date(),
            });
        }

        res.status(200).json({
            message: "공지사항 상세 조회",
            servertime: new Date(),
            data: {
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
router.put('/:notice_id/edit', async (req,res,next) =>{
    const user_id = Number(req.body.user_id);
    try{
        const user = await DB.execute({
            psmt: `select type from USER where user_id = ?`,
            binding: [user_id]
        });

        if(user[0].type == null){
            res.status(404).json({
                message: "권한이 없습니다.",
                servertime: new Date(),
                data: {
                    user_id
                }
            });
        }
        next();
    }catch(e){
        console.error(e);
        res.status(500).json({
            message: "알 수 없는 오류가 발생했습니다.",
            servertime: new Date()
        });
    }
}, async (req,res) =>{
    const title = JSON.stringify(req.body.title);
    const content = JSON.stringify(req.body.content);
    const category = JSON.stringify(req.body.category);
    const notice_id = Number(req.params.notice_id);
    const user_id = Number(req.body.user_id);
    try{
        const notice = await DB.execute({
            psmt: `update NOTICE set title = ?, content = ?, category = ?, user_id = ?, updated_at = NOW() where notice_id = ?`,
            binding: [title,content,category,user_id,notice_id]
        });

        res.status(201).json({
            message: "공지사항 수정 완료",
            servertime: new Date(),
        });

    } catch (e){
        console.log(e);
        res.status(500).json({
            message: "알 수 없는 오류가 발생했습니다.",
            servertime: new Date()
        });
    }
})

//공지사항 삭제
router.put('/:notice_id/delete', async (req,res,next) =>{
    const user_id = Number(req.body.user_id);
    try{
        const user = await DB.execute({
            psmt: `select type from USER where user_id = ?`,
            binding: [user_id]
        });

        if(user[0].type == null){
            res.status(404).json({
                message: "권한이 없습니다.",
                servertime: new Date(),
                data: {
                    user_id
                }
            });
        }
        next();
    }catch(e){
        console.error(e);
        res.status(500).json({
            message: "알 수 없는 오류가 발생했습니다.",
            servertime: new Date()
        });
    }
}, async (req,res) =>{
    const notice_id = Number(req.params.notice_id);
    const user_id = Number(req.body.user_id);
    try{
        const notice = await DB.execute({
            psmt: `update NOTICE set canceled_at = NOW() where notice_id = ?`,
            binding: [notice_id]
        });

        res.status(201).json({
            message: "공지사항 삭제 완료",
            servertime: new Date(),
        });

    } catch (e){
        console.log(e);
        res.status(500).json({
            message: "알 수 없는 오류가 발생했습니다.",
            servertime: new Date()
        });
    }
})

module.exports = router;