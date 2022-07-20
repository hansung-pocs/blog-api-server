var express = require('express');
var router = express.Router();

const DB = require("../common/database");

//https://day.js.org/docs/en/parse/string-format
const dayjs = require('dayjs')

/* GET users listing. */
router.get('/', async (req, res) => {
    try{
        const users = await DB.execute({
            psmt: `select user_id,username,email,student_id,type,company,generation,github,created_at from USER where canceled_at IS NULL`,
            binding: []
        });

        console.log("users: %j",users);
        if(!users){
            res.status(404).json({ok: false, message: "잘못된 요청입니다."});
        }

        for(let i in users){
            users[i].created_at = dayjs(users[i].created_at).format("YY-MM-DD")
        }

        res.json({users : users});
    }catch (e){
        console.error(e);

        res.status(500).json({
            ok: false,
            message: "알 수 없는 오류가 발생했습니다."
        });
    }
});

// 유저 기수/힉번 정렬
router.get('/sort/:option', async (req, res) => {
    let option = req.params.option;
    let users = new Array();
    try{
        if(option == "generation"){
            users = await DB.execute({
                psmt: `select user_id,username,email,student_id,type,company,generation,github,created_at from USER where canceled_at IS NULL order by generation`,
                binding: []
            });
        }else if(option == "student_id"){
            users = await DB.execute({
                psmt: `select user_id,username,email,student_id,type,company,generation,github,created_at from USER where canceled_at IS NULL order by student_id`,
                binding: []
            });
        }

        console.log("users: %j",users);
        if(!users){
            res.status(404).json({ok: false, message: "잘못된 요청입니다."});
        }

        for(let i in users){
            users[i].created_at = dayjs(users[i].created_at).format("YY-MM-DD")
        }

        res.json({users : users});
    }catch (e){
        console.error(e);

        res.status(500).json({
            ok: false,
            message: "알 수 없는 오류가 발생했습니다."
        });
    }
});

//유저 상세 조회
router.get("/:user_id", async (req, res) => {
    const user_id = Number(req.params.user_id);
    try {
        const user = await DB.execute({
            psmt: `select user_id,username,email,student_id,type,company,generation,github,created_at from USER where user_id=?`,
            binding: [user_id]
        });
        //console.log("user: ", JSON.stringify(user)와 동일
        console.log("user: %j", user);

        if (!user) {
            return res.status(404).json({
                ok: false,
                message: "해당 유저를 찾을 수 없습니다.",
            });
        }


        for(let i in user){
            user[i].created_at = dayjs(user[i].created_at).format("YY-MM-DD")
        }

        res.json({user : user});

    } catch (e) {
        console.error(e);
        res.status(500).json({
            ok: false,
            message: "알 수 없는 오류가 발생했습니다."
        });
    }
});

//유저 이름 검색
router.get("/search/:username", async (req, res) => {
    const username = decodeURIComponent(req.params.username);
    try {
        const user = await DB.execute({
            psmt: `select user_id,username,email,student_id,type,company,generation,github,created_at from USER where canceled_at IS NULL and username = ?`,
            binding: [username]
        });
        //console.log("user: ", JSON.stringify(user)와 동일
        console.log("user: %j", user);
        if (!user) {
            return res.status(404).json({
                ok: false,
                message: "해당 유저를 찾을 수 없습니다.",
            });
        }
        for(let i in user){
            user[i].created_at = dayjs(user[i].created_at).format("YY-MM-DD")
        }
        res.json({user : user});
    } catch (e) {
        console.error(e);
        res.status(500).json({
            ok: false,
            message: "알 수 없는 오류가 발생했습니다."
        });
    }
});

module.exports = router;
