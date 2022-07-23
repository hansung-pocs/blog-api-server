var express = require('express');
var router = express.Router();

const DB = require("../common/database");
const dayjs = require('dayjs');

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

const postsDB = [
    {
        postId : 1,
        userId : 1,
        title : "첫공지",
        content : "안녕하세요",
        canceledAt : null,
        createdAt : "2022-07-10",
        updateAt : "2022-07-12",
        category : "notice"
    },
    {
        postId : 2,
        userId : 1,
        title : "선배의 이야기",
        content : "안녕하세요",
        canceledAt : "2022-07-14",
        createdAt : "2022-07-10",
        updateAt : "2022-07-12",
        category : "knowhow"
    },
    {
        postId : 3,
        userId : 2,
        title : "MT사진",
        content : "안녕하세요",
        canceledAt : null,
        createdAt : "2022-07-10",
        updateAt : "2022-07-12",
        category : "memory"
    }
]

//공지사항 추가
router.post('/', async (req,res) =>{
    const userId = Number(req.body.userId);
    const title = JSON.stringify(req.body.title);
    const content = JSON.stringify(req.body.content);
    const category = JSON.stringify(req.body.category);
    try{
        if(usersDB[userId-1].type == null){
            res.status(404).json({
                message: "권한이 없습니다.",
                status: 404,
                servertime: new Date()
            });
        }else if(usersDB[userId-1].type == "primary"){
            let postsObj = new Object();
            postsObj.title = title;
            postsObj.userId = userId;
            postsObj.content = content;
            postsObj.category = category;

            postsDB.push(postsObj);

            res.status(201).json({
                message: "공지사항 추가 완료",
                status: 201,
                servertime: new Date()
            });
        }

    }catch(e){
        console.error(e);
        res.status(500).json({
            message: "알 수 없는 오류가 발생했습니다.",
            status: 500,
            servertime: new Date()
        });
    }
})

//공지사항 목록조회
router.get('/',async (req,res) => {
    try{
        if(!postsDB){
            res.status(404).json({
                message: "잘못된 요청입니다.",
                status: 404,
                servertime: new Date()
            });
        }

        let posts = new Array();
        for(let i in postsDB){
            let postsObj = new Object();
            postsObj.postId = postsDB[i].postId;
            postsObj.userId = postsDB[i].userId;
            postsObj.title = postsDB[i].title;
            postsObj.created_at = dayjs(postsDB[i].created_at).format("YY-MM-DD HH:MM:SS");
            postsObj.updated_at = dayjs(postsDB[i].updated_at).format("YY-MM-DD HH:MM:SS");
            postsObj.category = postsDB[i].category;

            posts.push(postsObj);
        }

        res.status(200).json({
            message: "공지사항 목록 조회",
            status: 200,
            servertime: new Date(),
            data: {
                posts
            }
        });

    }catch (e){
        console.log(e);
        res.status(500).json({
            message: "알 수 없는 오류가 발생했습니다.",
            status: 500,
            servertime: new Date()
        });
    }
})

//공지사항 상세조회
router.get('/:postId', async (req,res) => {
    const postId = req.params.postId;
    try{
        if(!postsDB){
            res.status(404).json({
                message: "해당 공지사항이 존재하지 않습니다.",
                status: 404,
                servertime: new Date()
            });
        }

        res.status(200).json({
            message: "공지사항 상세 조회",
            status: 200,
            servertime: new Date(),
            data: {
                title: postsDB[postId-1].title,
                content: postsDB[postId-1].content,
                created_at: dayjs(postsDB[postId-1].created_at).format("YY-MM-DD HH:MM:SS"),
                updated_at: dayjs(postsDB[postId-1].updated_at).format("YY-MM-DD HH:MM:SS"),
                category: postsDB[postId-1].category,
                user :{
                    userId : postsDB[postId-1].userId,
                    username : postsDB[postId-1].username,
                    email : postsDB[postId-1].email,
                    type : postsDB[postId-1].type
                }
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
})

//공지사항 수정
router.patch('/:postId', async (req,res,next) =>{
    const userId = Number(req.body.userId);
    const title = JSON.stringify(req.body.title);
    const content = JSON.stringify(req.body.content);
    const category = JSON.stringify(req.body.category);
    const postId = Number(req.params.postId);
    try{
        if(usersDB[userId-1].type == null){
            res.status(404).json({
                message: "권한이 없습니다.",
                status: 404,
                servertime: new Date()
            });
        }else if(usersDB[userId-1].type == "primary"){
            postsDB[postId-1].title = title;
            postsDB[postId-1].userId = userId;
            postsDB[postId-1].content = content;
            postsDB[postId-1].category = category;
            res.status(201).json({
                message: "공지사항 수정 완료",
                status: 201,
                servertime: new Date()
            });
        }

    }catch(e){
        console.error(e);
        res.status(500).json({
            message: "알 수 없는 오류가 발생했습니다.",
            status: 500,
            servertime: new Date()
        });
    }
})

//공지사항 삭제
router.patch('/delete/:postId', async (req,res,next) =>{
    const userId = Number(req.body.userId);
    const postId = Number(req.params.postId);
    try{
        if(usersDB[userId-1].type == null){
            res.status(404).json({
                message: "권한이 없습니다.",
                status: 404,
                servertime: new Date()
            });
        }else if(usersDB[userId-1].type == "primary"){
            postsDB[postId-1].canceledAt = new Date()
            res.status(201).json({
                message: "공지사항 삭제 완료",
                status: 201,
                servertime: new Date()
            });
        }

    }catch(e){
        console.error(e);
        res.status(500).json({
            message: "알 수 없는 오류가 발생했습니다.",
            status: 500,
            servertime: new Date()
        });
    }
})

module.exports = router;