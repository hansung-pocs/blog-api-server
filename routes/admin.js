const express = require('express');
const router = express.Router();

const DB = require("../common/database");
//https://day.js.org/docs/en/parse/string-format
const dayjs = require('dayjs')
const MSG = require("../common/message");

//관리자 페이지 유저 목록 조회
router.get('/users', async (req, res) => {
    const sortOption = req.query.sort;
    try {
        let sql = `select user_id,username,email,student_id,type,company,generation,github,created_at, canceled_at from USER`;

        if (sortOption == "studentId") {
            sql += ` order by student_id DESC;`;
        } else if (sortOption == "generation") {
            sql += ` order by generation DESC;`;
        } else {
            sql += ` order by created_at DESC;`;
        }

        const usersDB = await DB.execute({
            psmt: sql,
            binding: []
        });

        console.log("users: %j", usersDB);

        const users = [];
        usersDB.forEach(usersDB => {
            const {
                user_id,
                username,
                email,
                student_id,
                type,
                company,
                generation,
                github,
                created_at,
                canceled_at
            } = usersDB;

            const usersObj = {
                userId: user_id,
                userName: username,
                email: email,
                studentId: student_id,
                type: ((type) => {
                    if (!type) return "비회원";

                    switch (type) {
                        case "admin":
                            return "admin";
                        case "member":
                            return "member";
                        default:
                            return "unknown";
                    }
                })(type),
                company: company,
                generation: generation,
                github: github,
                createdAt: dayjs(created_at).format("YYYY-MM-DD HH:MM:ss"),
                canceledAt: ((canceled_at) => {
                    if (!!canceled_at) {
                        return dayjs(canceled_at).format("YYYY-MM-DD HH:MM:ss")
                    }
                    return null;
                })(canceled_at),
            }

            users.push(usersObj);
        })

        res.status(200).json({
            message: `관리자 권한으로 ${MSG.READ_USERDATA_SUCCESS}`,
            status: 200,
            servertime: dayjs().format('YYYY-MM-DD HH:MM:ss'),
            data: {
                users
            }
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({
            message: MSG.UNKNOWN_ERROR,
            status: 500,
            servertime: dayjs().format('YYYY-MM-DD HH:MM:ss'),
            data: {}
        });
    }
});

//유저 상세 조회
router.get("/users/:userId", async (req, res) => {
    const userId = req.params.userId;
    try {
        const [userDB] = await DB.execute({
            psmt: `select user_id,username,email,student_id,type,company,generation,github,created_at,canceled_at from USER where user_id=?`,
            binding: [userId]
        });
        //console.log("user: ", JSON.stringify(user)와 동일
        console.log("user: %j", userDB);

        if (!userDB) {
            res.status(404).json({
                message: MSG.NO_USER_DATA,
                status: 404,
                servertime: dayjs().format('YYYY-MM-DD HH:MM:ss'),
                data: {}
            });
        } else {
            const {
                user_id,
                username,
                email,
                student_id,
                type,
                company,
                generation,
                github,
                created_at,
                canceled_at
            } = userDB;

            res.status(200).json({
                message: `어드민 권한으로 ${username}${MSG.READ_USER_SUCCESS}`,
                status: 200,
                servertime: dayjs().format('YYYY-MM-DD HH:MM:ss'),
                data: {
                    userId: user_id,
                    userName: username,
                    email: email,
                    studentId: student_id,
                    type: ((type) => {
                        if (!type) return "비회원";

                        switch (type) {
                            case "admin":
                                return "admin";
                            case "member":
                                return "member";
                            default:
                                return "unknown";
                        }
                    })(type),
                    company: company,
                    generation: generation,
                    github: github,
                    createdAt: dayjs(created_at).format("YYYY-MM-DD HH:MM:ss"),
                    canceledAt: ((canceled_at) => {
                        if (!!canceled_at) {
                            return dayjs(canceled_at).format("YYYY-MM-DD HH:MM:ss")
                        }
                        return null;
                    })(canceled_at),
                }
            })
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: MSG.UNKNOWN_ERROR,
            status: 500,
            servertime: dayjs().format('YYYY-MM-DD HH:MM:ss'),
            data: {}
        });
    }
});

//유저 등록
router.post("/users", async (req, res) => {
    const {
        userName,
        password,
        name,
        studentId,
        email,
        generation,
        type,
        company,
        github
    } = req.body
    const correctEmail = /^[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/;

    try {
        const [checkEmail] = await DB.execute({
            psmt: `select user_id from USER where email = ?`,
            binding: [email]
        });
        const [checkUserName] = await DB.execute({
            psmt: `select user_id from USER where username = ?`,
            binding: [userName]
        });
        const [checkStudentId] = await DB.execute({
            psmt: `select user_id from USER where student_id = ?`,
            binding: [studentId]
        });

        if (!userName || !password || !name || !studentId || !email || !generation || !type) {
            res.status(404).json({
                message: MSG.NO_REQUIRED_INFO,
                status: 404,
                servertime: dayjs().format('YYYY-MM-DD HH:MM:ss'),
                data: {}
            });
        } else if (correctEmail.test(email) != true) {
            res.status(403).json({
                message: MSG.WRONG_EMAIL,
                status: 403,
                servertime: dayjs().format('YYYY-MM-DD HH:MM:ss'),
                data: {}
            });
        } else if (studentId.length != 7) {
            res.status(403).json({
                message: MSG.WRONG_STUDENTID,
                status: 403,
                servertime: dayjs().format('YYYY-MM-DD HH:MM:ss'),
                data: {}
            });
        } else if (type != "admin" && type != "member") {
            res.status(403).json({
                message: MSG.WRONG_TYPE,
                status: 403,
                servertime: dayjs().format('YYYY-MM-DD HH:MM:ss'),
                data: {}
            });
        } else if (checkEmail != null) {
            res.status(403).json({
                message: MSG.EXIST_EMAIL,
                status: 403,
                servertime: dayjs().format('YYYY-MM-DD HH:MM:ss'),
                data: {}
            });
        } else if (checkUserName != null) {
            res.status(403).json({
                message: MSG.EXIST_USERNAME,
                status: 403,
                servertime: dayjs().format('YYYY-MM-DD HH:MM:ss'),
                data: {}
            });
        } else if (checkStudentId != null) {
            res.status(403).json({
                message: MSG.EXIST_STUDENTID,
                status: 403,
                servertime: dayjs().format('YYYY-MM-DD HH:MM:ss'),
                data: {}
            });
        } else {
            await DB.execute({
                psmt: `insert into USER (username, password, name, student_id, email, generation, type, company, github, created_at, updated_at) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                binding: [userName, password, name, studentId, email, generation, type, company, github]
            });

            res.status(201).json({
                message: MSG.USER_ADDED,
                status: 201,
                servertime: dayjs().format('YYYY-MM-DD HH:MM:ss'),
                data: {}
            })
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: MSG.UNKNOWN_ERROR,
            status: 500,
            servertime: dayjs().format('YYYY-MM-DD HH:MM:ss'),
            data: {}
        });
    }
})

//유저 삭제
router.patch("/users/:userId/kick", async (req, res) => {
    const userId = req.params.userId;

    try {
        const [user] = await DB.execute({
            psmt: `select username from USER where user_id = ?`,
            binding: [userId]
        })
        if (!user) {
            res.status(404).json({
                message: MSG.NO_USER_DATA,
                status: 404,
                servertime: dayjs().format('YYYY-MM-DD HH:MM:ss'),
                data: {}
            });
        } else {
            await DB.execute({
                psmt: `update USER SET canceled_at = NOW() where user_id = ?`,
                binding: [userId]
            })

            res.status(201).json({
                message: MSG.USER_KICK_SUCCESS,
                status: 201,
                servertime: dayjs().format('YYYY-MM-DD HH:MM:ss'),
                data: {}
            });
        }
    } catch (error) {
        console.log(error);
        res.status(501).json({
            message: error.message,
            status: 501,
            servertime: dayjs().format('YYYY-MM-DD HH:MM:ss'),
            data: {}
        });
    }
})

//삭제된 게시물 포함 게시글 조회
router.get("/posts", async (req, res) => {
    try {
        const postsDB = await DB.execute({
            psmt: `select post_id, username, title, content, p.created_at, p.updated_at, p.canceled_at, category from POST p, USER u WHERE p.user_id = u.user_id`,
            binding: []
        })

        console.log("users: %j", postsDB);

        const posts = [];
        postsDB.forEach(postsDB => {
            const {
                post_id,
                username,
                title,
                content,
                created_at,
                updated_at,
                canceled_at,
                category
            } = postsDB;

            const postsObj = {
                postId: post_id,
                writerName: username,
                title: title,
                content: content,
                createdAt: dayjs(created_at).format("YYYY-MM-DD HH:MM:ss"),
                updatedAt: ((updated_at) => {
                    if (!!updated_at) {
                        return dayjs(updated_at).format("YYYY-MM-DD HH:MM:ss")
                    }
                    return null;
                })(updated_at),
                canceledAt: ((canceled_at) => {
                    if (!!canceled_at) {
                        return dayjs(canceled_at).format("YYYY-MM-DD HH:MM:ss")
                    }
                    return null;
                })(canceled_at),
                category: category
            }
            posts.push(postsObj);
        })
        res.status(200).json({
            message: MSG.READ_POSTDATA_SUCCESS,
            status: 200,
            servertime: dayjs().format('YYYY-MM-DD HH:MM:ss'),
            data: {
                posts
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: MSG.UNKNOWN_ERROR,
            status: 500,
            servertime: dayjs().format('YYYY-MM-DD HH:MM:ss'),
            data: {}
        });
    }
})

//특정 회원이 작성한 글 조회
router.get("/posts/:userId", async (req, res) => {
    const userId = req.params.userId;
    try {
        const postsDB = await DB.execute({
            psmt: `select post_id, title, content, created_at, updated_at, canceled_at, category from POST WHERE user_id = ?`,
            binding: [userId]
        });

        console.log("post: %j", postsDB);
        if (!postsDB) {
            res.status(404).json({
                message: MSG.CANT_READ_POSTDATA,
                status: 404,
                servertime: dayjs().format('YYYY-MM-DD HH:MM:ss'),
                data: {}
            });
        } else {
            const posts = [];
            postsDB.forEach(postsDB => {
                const {
                    post_id,
                    title,
                    content,
                    created_at,
                    updated_at,
                    canceled_at,
                    category,
                } = postsDB;

                const postsObj = {
                    postId: post_id,
                    title: title,
                    content: content,
                    createdAt: dayjs(created_at).format("YYYY-MM-DD HH:MM:ss"),
                    updatedAt: ((updated_at) => {
                        if (!!updated_at) {
                            return dayjs(updated_at).format("YYYY-MM-DD HH:MM:ss")
                        }
                        return null;
                    })(updated_at),
                    canceledAt: ((canceled_at) => {
                        if (!!canceled_at) {
                            return dayjs(canceled_at).format("YYYY-MM-DD HH:MM:ss")
                        }
                        return null;
                    })(canceled_at),
                    category: category
                }

                posts.push(postsObj);
            })

            res.status(200).json({
                message: `관리자 권한으로 ${MSG.READ_POSTDATA_SUCCESS}`,
                status: 200,
                servertime: dayjs().format('YYYY-MM-DD HH:MM:ss'),
                data: {
                    posts
                }
            });
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({
            message: MSG.UNKNOWN_ERROR,
            status: 500,
            servertime: dayjs().format('YYYY-MM-DD HH:MM:ss'),
            data: {}
        });
    }
})

module.exports = router;