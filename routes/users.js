var express = require('express');
var router = express.Router();

const DB = require("../common/database");

//https://day.js.org/docs/en/parse/string-format
const dayjs = require('dayjs')

/* GET users listing. */
router.get('/', async (req, res) => {
    try{
        const usersDB = await DB.execute({
            psmt: `select user_id,username,email,student_id,type,company,generation,github,created_at from USER where canceled_at IS NULL`,
            binding: []
        });

        console.log("users: %j",usersDB);
        if(!usersDB){
            res.status(404).json({
                message: "잘못된 요청입니다.",
                servertime: new Date()
            });
        }

        let users = new Array();
        for(let i in usersDB){
            let usersObj = new Object();
            usersObj.user_id = usersDB[i].user_id;
            usersObj.username = usersDB[i].username;
            usersObj.email = usersDB[i].email;
            usersObj.student_id = usersDB[i].student_id;
            usersObj.type = ((type) => {
                if (!type) {
                    return "일반유저";
                }
                switch (type) {
                    case "primary":
                        return "관리자";
                    default:
                        return "unknown";
                }
            })(usersDB[i].type),
                usersObj.company = usersDB[i].company;
            usersObj.generation = usersDB[i].generation;
            usersObj.github = usersDB[i].github;
            usersObj.created_at = dayjs(usersDB[i].created_at).format("YY-MM-DD");

            users.push(usersObj);
        }

        res.status(200).json({
            message: "유저 목록 조회 완료",
            servertime: new Date(),
            data: {
                users
            }
        });
    }catch (e){
        console.error(e);
        res.status(500).json({
            message: "알 수 없는 오류가 발생했습니다.",
            servertime: new Date()
        });
    }
});

// 유저 기수/힉번 정렬
router.get('/sort/:option', async (req, res) => {
    let option = req.params.option;
    let usersDB = new Array();
    try{
        if(option == "generation"){
            usersDB = await DB.execute({
                psmt: `select user_id,username,email,student_id,type,company,generation,github,created_at from USER where canceled_at IS NULL order by generation`,
                binding: []
            });
        }else if(option == "student_id"){
            usersDB = await DB.execute({
                psmt: `select user_id,username,email,student_id,type,company,generation,github,created_at from USER where canceled_at IS NULL order by student_id`,
                binding: []
            });
        }

        console.log("users: %j",usersDB);
        if(!usersDB){
            res.status(404).json({
                message: "잘못된 요청입니다.",
                servertime: new Date()
            });
        }

        let users = new Array();
        for(let i in usersDB){
            let usersObj = new Object();
            usersObj.user_id = usersDB[i].user_id;
            usersObj.username = usersDB[i].username;
            usersObj.email = usersDB[i].email;
            usersObj.student_id = usersDB[i].student_id;
            usersObj.type = ((type) => {
                if (!type) {
                    return "일반유저";
                }
                switch (type) {
                    case "primary":
                        return "관리자";
                    default:
                        return "unknown";
                }
            })(usersDB[i].type),
                usersObj.company = usersDB[i].company;
            usersObj.generation = usersDB[i].generation;
            usersObj.github = usersDB[i].github;
            usersObj.created_at = dayjs(usersDB[i].created_at).format("YY-MM-DD");

            users.push(usersObj);
        }

        res.status(200).json({
            message: "유저 목록 정렬 완료",
            servertime: new Date(),
            data: {
                users
            }
        });
    }catch (e){
        console.error(e);

        res.status(500).json({
            message: "알 수 없는 오류가 발생했습니다.",
            servertime: new Date()
        });
    }
});

//유저 상세 조회
router.get("/:user_id", async (req, res) => {
    const user_id = Number(req.params.user_id);
    try {
        const userDB = await DB.execute({
            psmt: `select user_id,username,email,student_id,type,company,generation,github,created_at from USER where user_id=?`,
            binding: [user_id]
        });
        //console.log("user: ", JSON.stringify(user)와 동일
        console.log("user: %j", userDB);

        if (!userDB) {
            res.status(404).json({
                message: "없거나 탈퇴한 유저입니다.",
                servertime: new Date()
            });
        }


        let user = new Array();
        for(let i in userDB){
            let userObj = new Object();
            userObj.user_id = userDB[i].user_id;
            userObj.username = userDB[i].username;
            userObj.email = userDB[i].email;
            userObj.student_id = userDB[i].student_id;
            userObj.type = ((type) => {
                if (!type) {
                    return "일반유저";
                }
                switch (type) {
                    case "primary":
                        return "관리자";
                    default:
                        return "unknown";
                }
            })(userDB[i].type),
                userObj.company = userDB[i].company;
            userObj.generation = userDB[i].generation;
            userObj.github = userDB[i].github;
            userObj.created_at = dayjs(userDB[i].created_at).format("YY-MM-DD");

            user.push(userObj);
        }

        res.status(200).json({
            message: "유저 상세 조회",
            servertime: new Date(),
            data: {
                user
            }
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({
            message: "알 수 없는 오류가 발생했습니다.",
            servertime: new Date()
        });
    }
});

//유저 이름 검색
router.get("/search/:username", async (req, res) => {
    const username = decodeURIComponent(req.params.username);
    try {
        const userDB = await DB.execute({
            psmt: `select user_id,username,email,student_id,type,company,generation,github,created_at from USER where canceled_at IS NULL and username = ?`,
            binding: [username]
        });
        //console.log("user: ", JSON.stringify(user)와 동일
        console.log("user: %j", userDB);
        if (!userDB) {
            res.status(404).json({
                message: "해당 유저를 찾을 수 없습니다.",
                servertime: new Date()
            });
        }

        let user = new Array();
        for(let i in userDB){
            let userObj = new Object();
            userObj.user_id = userDB[i].user_id;
            userObj.username = userDB[i].username;
            userObj.email = userDB[i].email;
            userObj.student_id = userDB[i].student_id;
            userObj.type = ((type) => {
                if (!type) {
                    return "일반유저";
                }
                switch (type) {
                    case "primary":
                        return "관리자";
                    default:
                        return "unknown";
                }
            })(userDB[i].type),
                userObj.company = userDB[i].company;
            userObj.generation = userDB[i].generation;
            userObj.github = userDB[i].github;
            userObj.created_at = dayjs(userDB[i].created_at).format("YY-MM-DD");

            user.push(userObj);
        }

        res.status(200).json({
            message: "유저 이름으로 검색",
            servertime: new Date(),
            data: {
                user
            }
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({
            message: "알 수 없는 오류가 발생했습니다.",
            servertime: new Date()
        });
    }
});

//유저 프로필 수정
router.put('/:user_id/edit', async (req,res) => {
    const password = req.body.password;
    const username = req.body.username;
    const email = req.body.email;
    const company = req.body.company;
    const github = req.body.github;
    const user_id = req.params.user_id;
    try{
        const noticeDB = await DB.execute({
            psmt: `update USER set password = ?, username = ?, email = ?, company = ?, github = ?, updated_at = NOW() where user_id = ?`,
            binding: [password,username,email,company,github,user_id]
        });

        res.status(201).json({
            message: "유저 정보 수정 완료",
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