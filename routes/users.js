var express = require('express');
var router = express.Router();

const DB = require("../common/database");
//https://day.js.org/docs/en/parse/string-format
const dayjs = require('dayjs')

const usersDB = [
    {
        userId : 1,
        username : "18김철수",
        password : "1234",
        email : "abc123@gmail.com",
        studentId : 1234569,
        name : "김철수",
        type : "primary",
        generation : 20,
        company : "한성",
        canceledAt : null,
        createdAt : "2022-07-10",
        updateAt : "2022-07-12"
    },
    {
        userId : 2,
        username : "19홍길동",
        password : "1235",
        email : "abc124@gmail.com",
        studentId : 1234568,
        name : "홍길동",
        type : "primary",
        generation : 21,
        company : "한성",
        canceledAt : null,
        createdAt : "2022-07-10",
        updateAt : "2022-07-12"
    },
    {
        userId : 3,
        username : "20김영희",
        password : "1236",
        email : "abc125@gmail.com",
        studentId : 1234567,
        name : "김영희",
        type : null,
        generation : 22,
        company : null,
        canceledAt : "2022-07-13",
        createdAt : "2022-07-10",
        updateAt : "2022-07-12"
    }
]
/* GET users listing. */
router.get('/', async (req, res) => {
    try{
        if(!usersDB){
            res.status(404).json({
                    message: "잘못된 요청입니다.",
                    status: 404,
                    servertime: new Date()
                });
        }

        let users = new Array();
        for(let i in usersDB){
            let usersObj = new Object();
            usersObj.userId = usersDB[i].userId;
            usersObj.username = usersDB[i].username;
            usersObj.email = usersDB[i].email;
            usersObj.studentId = usersDB[i].studentId;
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
            })(usersDB[i].type);
            usersObj.company = usersDB[i].company;
            usersObj.generation = usersDB[i].generation;
            usersObj.github = usersDB[i].github;
            usersObj.createdAt = dayjs(usersDB[i].createdAt).format("YY-MM-DD");

            users.push(usersObj);
        }

        res.status(200).json({
            message: "유저 목록 조회 완료",
            status: 200,
            servertime: new Date(),
            data: {
                users
            }
        });
    }catch (e){
        console.error(e);
        res.status(500).json({
            message: "알 수 없는 오류가 발생했습니다.",
            status: 500,
            servertime: new Date()
        });
    }
});

// 유저 기수/힉번 정렬
router.get('/sort', async (req, res) => {
    let option = req.query.option;
    try{
        if(option == "studentId"){
            usersDB.reverse();
        }
        if(!usersDB){
            res.status(404).json({
                message: "잘못된 요청입니다.",
                status: 404,
                servertime: new Date()
            });
        }

        let users = new Array();
        for(let i in usersDB){
            let usersObj = new Object();
            usersObj.userId = usersDB[i].userId;
            usersObj.username = usersDB[i].username;
            usersObj.email = usersDB[i].email;
            usersObj.studentId = usersDB[i].studentId;
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
            })(usersDB[i].type);
                usersObj.company = usersDB[i].company;
            usersObj.generation = usersDB[i].generation;
            usersObj.github = usersDB[i].github;
            usersObj.createdAt = dayjs(usersDB[i].createdAt).format("YY-MM-DD");

            users.push(usersObj);
            usersDB.reverse();
        }

        res.status(200).json({
            message: "유저 목록 정렬 완료",
            status: 200,
            servertime: new Date(),
            data: {
                users
            }
        });
    }catch (e){
        console.error(e);

        res.status(500).json({
            message: "알 수 없는 오류가 발생했습니다.",
            status: 500,
            servertime: new Date()
        });
    }
});

//유저 상세 조회
router.get("/:userId", async (req, res) => {
    const i = Number(req.params.id);
    try {
        if (!usersDB) {
            res.status(404).json({
                message: "없거나 탈퇴한 유저입니다.",
                status: 404,
                servertime: new Date()
            });
        }

        res.status(200).json({
            message: "유저 상세 조회",
            status: 200,
            servertime: new Date(),
            data: {
                userId : usersDB[i].userId,
                username : usersDB[i].username,
                email : usersDB[i].email,
                studentId : usersDB[i].studentId,
                type : ((type) => {
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
                company : usersDB[i].company,
                generation : usersDB[i].generation,
                github : usersDB[i].github,
                createdAt : dayjs(usersDB[i].createdAt).format("YY-MM-DD")
            }
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({
            message: "알 수 없는 오류가 발생했습니다.",
            status: 500,
            servertime: new Date()
        });
    }
});

//유저 이름 검색
router.get("/search/:name", async (req, res) => {
    const name = decodeURIComponent(req.params.name);
    let i;
    try {
        if (!usersDB) {
            res.status(404).json({
                message: "해당 유저를 찾을 수 없습니다.",
                status: 404,
                servertime: new Date()
            });
        }

        if(name == "김철수"){
            i = 0;
        }else if(name == "홍길동"){
            i = 1;
        }else if(name == "김영희"){
            i = 2;
        }


        res.status(200).json({
            message: "유저 이름으로 검색",
            status: 200,
            servertime: new Date(),
            data: {
                userId : usersDB[i].userId,
                username : usersDB[i].username,
                email : usersDB[i].email,
                studentId : usersDB[i].studentId,
                type : ((type) => {
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
                company : usersDB[i].company,
                generation : usersDB[i].generation,
                github : usersDB[i].github,
                createdAt : dayjs(usersDB[i].createdAt).format("YY-MM-DD")
            }
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({
            message: "알 수 없는 오류가 발생했습니다.",
            status: 500,
            servertime: new Date()
        });
    }
});

//유저 프로필 수정
router.patch('/:userId', async (req,res) => {
    const password = req.body.password;
    const username = req.body.username;
    const email = req.body.email;
    const company = req.body.company;
    const github = req.body.github;
    const i = req.params.id;
    try{
        console.log("%j",usersDB[i-1].password);
        usersDB[i-1].password = password;
        usersDB[i-1].username = username;
        usersDB[i-1].email = email;
        usersDB[i-1].company = company;
        usersDB[i-1].github = github;

        res.status(201).json({
            message: "유저 정보 수정 완료",
            status: 201,
            servertime: new Date()
        });
        console.log("%j",usersDB);
    } catch (e){
        console.log(e);
        res.status(500).json({
            message: "알 수 없는 오류가 발생했습니다.",
            status: 500,
            servertime: new Date()
        });
    }
})


module.exports = router;
