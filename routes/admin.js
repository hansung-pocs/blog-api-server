var express = require('express');
var router = express.Router();

const DB = require("../common/database");
//https://day.js.org/docs/en/parse/string-format
const dayjs = require('dayjs')
const MSG = require("../common/message");

router.get('/users', async (req, res) => {
    let sortOption = req.query.sort;
    try{
        let sql = `select user_id,username,email,student_id,type,company,generation,github,created_at, canceled_at from USER`;

        if (sortOption == "studentId")
            sql += ` order by student_id;`;
        else if (sortOption == "generation")
            sql += ` order by generation DESC;`;

        const usersDB = await DB.execute({
            psmt: sql,
            binding: []
        });

        console.log("users: %j",usersDB);
        if(!usersDB){
            res.status(404).json({
                message: MSG.CANT_READ_USERDATA,
                servertime: dayjs().format('YYYY-MM-DD HH:MM:ss'),
                data: {}
            });
        }

        let users = new Array();
        for(let i in usersDB){
            let usersObj = new Object();
            usersObj.userId = usersDB[i].user_id;
            usersObj.userName = usersDB[i].username;
            usersObj.email = usersDB[i].email;
            usersObj.studentId = usersDB[i].student_id;
            usersObj.type = ((type) => {
                if (!type) return "비회원";

                switch (type) {
                    case "admin": return "admin";
                    case "member": return "member";
                    default: return "unknown";
                }
            })(usersDB[i].type),
                usersObj.company = usersDB[i].company;
            usersObj.generation = usersDB[i].generation;
            usersObj.github = usersDB[i].github;
            usersObj.createdAt = dayjs(usersDB[i].created_at).format("YY-MM-DD");
            usersObj.canceledAt = dayjs(usersDB[i].canceled_at).format("YY-MM-DD");

            users.push(usersObj);
        }

        res.status(200).json({
            message: "관리자 권한으로 "+MSG.READ_USERDATA_SUCCESS,
            status : 200,
            servertime : dayjs().format('YYYY-MM-DD HH:MM:ss'),
            data: {
                users
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
});

//유저 상세 조회
router.get("/users/:userId", async (req, res) => {
    const userId = req.params.userId;
    try {
        const userDB = await DB.execute({
            psmt: `select user_id,username,email,student_id,type,company,generation,github,created_at,canceled_at from USER where user_id=?`,
            binding: [userId]
        });
        //console.log("user: ", JSON.stringify(user)와 동일
        console.log("user: %j", userDB);

        if (!userDB) {
            res.status(404).json({
                message: MSG.NO_USER_DATA,
                status : 404,
                servertime : dayjs().format('YYYY-MM-DD HH:MM:ss'),
                data : {}
            });
        }

        res.status(200).json({
            message: `어드민 권한 ${userDB[0].username}${MSG.READ_USER_SUCCESS}`,
            status : 200,
            servertime : dayjs().format('YYYY-MM-DD HH:MM:ss'),
            data: {
                userId : userDB[0].user_id,
                userName : userDB[0].username,
                email : userDB[0].email,
                studentId : userDB[0].student_id,
                type : ((type) => {
                    if (!type) return "비회원";

                    switch (type) {
                        case "admin": return "admin";
                        case "member": return "member";
                        default: return "unknown";
                    }
                })(userDB[0].type),
                company : userDB[0].company,
                generation : userDB[0].generation,
                github : userDB[0].github,
                createdAt : dayjs(userDB[0].created_at).format("YY-MM-DD"),
                canceledAt : dayjs(userDB[0].canceled_at).format("YY-MM-DD"),
            }
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({
            message: MSG.UNKNOWN_ERROR,
            status : 500,
            servertime : dayjs().format('YYYY-MM-DD HH:MM:ss'),
            data : {}
        });
    }
});

module.exports = router;