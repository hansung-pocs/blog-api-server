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
                servertime: dayjs().format('YYYY-MM-DD HH:MM:ss'),
                data: {}
            });
        }else if(usersDB[userId-1].type == "primary"){
            let postsObj = new Object();
            postsObj.title = title;
            postsObj.userId = userId;
            postsObj.content = content;
            postsObj.category = category;

            //postsDB.push(postsObj);

            res.status(201).json({
                message: "공지사항 추가 성공",
                status: 201,
                servertime: dayjs().format('YYYY-MM-DD HH:MM:ss'),
                data: {}
            });
        }

    }catch(e){
        console.error(e);
        res.status(500).json({
            message: "알 수 없는 오류가 발생했습니다.",
            status: 500,
            servertime: dayjs().format('YYYY-MM-DD HH:MM:ss'),
            data: {}
        });
    }
})

//공지사항 목록조회
router.get('/',async (req,res) => {
    try{
        if(!postsDB){
            res.status(404).json({
                message: "게시글 목록을 불러올 수 없습니다.",
                status: 404,
                servertime: dayjs().format('YYYY-MM-DD HH:MM:ss'),
                data: {}
            });
        }

        let posts = new Array();
        for(let i in postsDB){
            let postsObj = new Object();
            postsObj.postId = postsDB[i].postId;
            postsObj.writerName = usersDB[i].username;
            postsObj.title = postsDB[i].title;
            postsObj.content = postsDB[i].content;
            postsObj.createdAt = dayjs(postsDB[i].createdAt).format("YY-MM-DD HH:MM:SS");
            postsObj.updatedAt = dayjs(postsDB[i].updatedAt).format("YY-MM-DD HH:MM:SS");
            postsObj.category = postsDB[i].category;

            posts.push(postsObj);
        }

        res.status(200).json({
            message: "게시글 목록 조회 성공.",
            status: 200,
            servertime: dayjs().format('YYYY-MM-DD HH:MM:ss'),
            data: {
                posts
            }
        });

    }catch (e){
        console.log(e);
        res.status(500).json({
            message: "알 수 없는 오류가 발생했습니다.",
            status: 500,
            servertime: dayjs().format('YYYY-MM-DD HH:MM:ss'),
            data: {}
        });
    }
})

//공지사항 상세조회
router.get('/:postId', async (req,res) => {
    const postId = req.params.postId;
    try{
        if(!postsDB){
            res.status(404).json({
                message: "없거나 삭제된 게시글입니다.",
                status: 404,
                servertime: dayjs().format('YYYY-MM-DD HH:MM:ss'),
                data: {}
            });
        }

        res.status(200).json({
            message: "공지사항 상세 조회",
            status: 200,
            servertime: dayjs().format('YYYY-MM-DD HH:MM:ss'),
            data: {
                title: postsDB[postId-1].title,
                content: postsDB[postId-1].content,
                createdAt: dayjs(postsDB[postId-1].createdAt).format("YY-MM-DD HH:MM:SS"),
                updatedAt: dayjs(postsDB[postId-1].updatedAt).format("YY-MM-DD HH:MM:SS"),
                category: postsDB[postId-1].category,
                writer:{
                    userId : usersDB[postId-1].userId,
                    userName : usersDB[postId-1].username,
                    email : usersDB[postId-1].email,
                    type : usersDB[postId-1].type
                }
            }
        });

    }catch (e){
        console.error(e);
        res.status(500).json({
            message: "알 수 없는 오류가 발생했습니다.",
            status: 500,
            servertime: dayjs().format('YYYY-MM-DD HH:MM:ss'),
            data: {}
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
                servertime: dayjs().format('YYYY-MM-DD HH:MM:ss'),
                data: {}
            });
        }else if(usersDB[userId-1].type == "primary"){
            postsDB[postId-1].title = title;
            postsDB[postId-1].userId = userId;
            postsDB[postId-1].content = content;
            postsDB[postId-1].category = category;
            res.status(302).json({
                message: "공지사항 수정 완료",
                status: 302,
                servertime: dayjs().format('YYYY-MM-DD HH:MM:ss'),
                data: {}
            });
        }

    }catch(e){
        console.error(e);
        res.status(500).json({
            message: "알 수 없는 오류가 발생했습니다.",
            status: 500,
            servertime: dayjs().format('YYYY-MM-DD HH:MM:ss'),
            data: {}
        });
    }
})

//공지사항 삭제
router.patch('/:postId/delete', async (req,res,next) =>{
    const userId = Number(req.body.userId);
    const postId = Number(req.params.postId);
    try{
        if(usersDB[userId-1].type == null){
            res.status(404).json({
                message: "권한이 없습니다.",
                status: 404,
                servertime: dayjs().format('YYYY-MM-DD HH:MM:ss'),
                data: {}
            });
        }else if(usersDB[userId-1].type == "primary"){
            postsDB[postId-1].canceledAt = dayjs().format('YYYY-MM-DD HH:MM:ss')
            res.status(302).json({
                message: "공지사항 삭제 성공",
                status: 302,
                servertime: dayjs().format('YYYY-MM-DD HH:MM:ss'),
                data: {}
            });
        }

    }catch(e){
        console.error(e);
        res.status(500).json({
            message: "알 수 없는 오류가 발생했습니다.",
            status: 500,
            servertime: dayjs().format('YYYY-MM-DD HH:MM:ss'),
            data: {}
        });
    }
})

module.exports = router;