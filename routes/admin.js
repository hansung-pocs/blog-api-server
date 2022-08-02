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
            sql += ` order by generation;`;

        const usersDB = await DB.execute({
            psmt: sql,
            binding: []
        });

        console.log("users: %j",usersDB);
        if(!usersDB){
            res.status(404).json({
                message: MSG.CANT_READ_USERDATA,
                status : 404,
                servertime : dayjs().format('YYYY-MM-DD HH:MM:ss'),
                data : {}
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
                usersObj.company = usersDB[i].company || null;
            usersObj.generation = usersDB[i].generation;
            usersObj.github = usersDB[i].github || null;
            usersObj.createdAt = dayjs(usersDB[i].created_at).format("YYYY-MM-DD");
            usersObj.canceledAt = dayjs(usersDB[i].canceled_at).format("YYYY-MM-DD") || null;

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
                company : userDB[0].company || null,
                generation : userDB[0].generation,
                github : userDB[0].github || null,
                createdAt : dayjs(userDB[0].created_at).format("YYYY-MM-DD"),
                canceledAt : dayjs(userDB[0].canceled_at).format("YYYY-MM-DD") || null,
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

router.post("/users", async (req,res) => {
    const userName = req.body.userName;
    const password = req.body.password;
    const name = req.body.name;
    const studentId = req.body.studentId;
    const email = req.body.email;
    const generation = req.body.generation;
    const type = req.body.type;
    const company = req.body.company;
    const github = req.body.github;

    if(!userName || !password || !name || !studentId || !email || !generation || !type){
        res.status(404).json({
            message: MSG.NO_REQUIRED_INFO,
            status : 404,
            servertime : dayjs().format('YYYY-MM-DD HH:MM:ss'),
            data : {}
        });
    }

    try{
        await DB.execute({
            psmt: `insert into USER (username, password, name, student_id, email, generation, type, company, github, created_at, updated_at) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            binding: [userName, password, name, studentId, email, generation, type, company || null , github || null]
        });

        res.status(201).json({
            message: MSG.USER_ADDED,
            status : 201,
            servertime : dayjs().format('YYYY-MM-DD HH:MM:ss'),
            data : {}
        })
    }catch (error){
        console.log(error);
        res.status(500).json({
            message: MSG.UNKNOWN_ERROR,
            status : 500,
            servertime : dayjs().format('YYYY-MM-DD HH:MM:ss'),
            data : {}
        });
    }
})

router.patch("/users/:userId/kick", async (req,res) => {
    const userId = req.params.userId;

    if(!userId){
        res.status(404).json({
            message: MSG.NO_USER_DATA,
            status : 404,
            servertime : dayjs().format('YYYY-MM-DD HH:MM:ss'),
            data : {}
        });
    }
    try{
        await DB.execute({
            psmt: `update USER SET canceled_at = NOW() where user_id = ?`,
            binding : [userId]
        })

        res.status(201).json({
            message: MSG.USER_KICK_SUCCESS,
            status : 201,
            servertime : dayjs().format('YYYY-MM-DD HH:MM:ss'),
            data : {}
        });
    }catch (error){
        console.log(error);
        res.status(501).json({
            message: error.message,
            status : 501,
            servertime : dayjs().format('YYYY-MM-DD HH:MM:ss'),
            data : {}
        });
    }
})

router.get("/posts",async (req,res) => {
    try{
        const postsDB = await DB.execute({
            psmt: `select post_id, username, title, content, p.created_at, p.updated_at, p.canceled_at, category from POST p, USER u WHERE p.user_id = u.user_id`,
            binding : []
        })

        console.log("users: %j",postsDB);
        if(!postsDB){
            res.status(404).json({
                message: MSG.CANT_READ_POSTDATA,
                status : 404,
                servertime : dayjs().format('YYYY-MM-DD HH:MM:ss'),
                data : {}
            });
        }

        let posts = [];
        for(let i in postsDB){
            let postObj = new Object();
            postObj.postId = postsDB[i].post_id;
            postObj.writerName = postsDB[i].username;
            postObj.title = postsDB[i].title;
            postObj.content = postsDB[i].content;
            postObj.createdAt = dayjs(postsDB[i].created_at).format("YYYY-MM-DD HH:MM:SS");
            postObj.updatedAt = dayjs(postsDB[i].updated_at).format("YYYY-MM-DD HH:MM:SS");
            postObj.canceledAt = dayjs(postsDB[i].canceled_at).format("YYYY-MM-DD HH:MM:SS") || null;
            postObj.category = postsDB[i].category;

            posts.push(postObj);
        }
        res.status(200).json({
            message: MSG.READ_POSTDATA_SUCCESS,
            status : 200,
            servertime : dayjs().format('YYYY-MM-DD HH:MM:ss'),
            data : {
                posts
            }
        });
    }catch (error){
        console.log(error);
        res.status(500).json({
            message: MSG.UNKNOWN_ERROR,
            status : 500,
            servertime : dayjs().format('YYYY-MM-DD HH:MM:ss'),
            data : {}
        });
    }
})

router.get("/posts/:userId",async (req,res) => {
    const userId = req.params.userId;
    try{
        const postsDB = await DB.execute({
            psmt: `select post_id, title, content, created_at, updated_at, canceled_at, category from POST WHERE user_id = ?`,
            binding: [userId]
        });

        console.log("post: %j",postsDB);
        if(!postsDB){
            res.status(404).json({
                message: MSG.CANT_READ_POSTDATA,
                status : 404,
                servertime : dayjs().format('YYYY-MM-DD HH:MM:ss'),
                data : {}
            });
        }

        let posts = [];
        for(let i in postsDB){
            let postObj = new Object();
            postObj.postId = postsDB[i].post_id;
            postObj.title = postsDB[i].title;
            postObj.content = postsDB[i].content;
            postObj.createdAt = dayjs(postsDB[i].created_at).format("YYYY-MM-DD HH:MM:SS");
            postObj.updatedAt = dayjs(postsDB[i].updated_at).format("YYYY-MM-DD HH:MM:SS");
            postObj.canceledAt = dayjs(postsDB[i].canceled_at).format("YYYY-MM-DD HH:MM:SS") || null;
            postObj.category = postsDB[i].category;

            posts.push(postObj);
        }
        res.status(200).json({
            message: "관리자 권한으로 " + MSG.READ_POSTDATA_SUCCESS,
            status : 200,
            servertime : dayjs().format('YYYY-MM-DD HH:MM:ss'),
            data : {
                posts
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

module.exports = router;