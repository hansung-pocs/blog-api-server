const express = require('express');
const router = express.Router();
const util = require('../common/util');

const DB = require('../common/database');
//https://day.js.org/docs/en/parse/string-format
const dayjs = require('dayjs')
const MSG = require('../common/message');

/* GET user list by admin */
router.get('/users', async (req, res) => {

    const sortOption = req.query.sort;

    try {
        let sql = `select user_id, username, email, student_id, type, company, generation, github, created_at, canceled_at from USER`;

        if (sortOption == 'generation') {
            sql += ` order by generation DESC;`;
        } else if (sortOption == 'studentId') {
            sql += ` order by student_id;`;
        } else {
            sql += ` order by created_at DESC;`;    // default는 생성된 순의 내림차순으로 정렬
        }

        const usersDB = await DB.execute({
            psmt: sql,
            binding: []
        });

        console.log('users: %j', usersDB);

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
                    // 어차피 POST할 때 type은 member or admin으로 주고 default = unknown으로 했는데 꼭 필요?
                    if (!type) return '비회원';

                    switch (type) {
                        case 'admin':
                            return 'admin';
                        case 'member':
                            return 'member';
                        default:
                            return 'unknown';
                    }
                })(type),
                company: company || null,
                generation: generation,
                github: github || null,
                createdAt: dayjs(created_at).format('YYYY-MM-DD HH:mm:ss'),
                canceledAt: ((canceled_at) => {
                    if (!!canceled_at) {
                        return dayjs(canceled_at).format('YYYY-MM-DD HH:mm:ss')
                    }
                    return null;
                })(canceled_at),
            }

            users.push(usersObj);
        })

        res.status(200).json(util.getReturnObject(`관리자 권한으로 ${MSG.READ_USERDATA_SUCCESS}`,200,users));
    } catch (e) {
        console.error(e);
        res.status(500).json(util.getReturnObject(MSG.UNKNOWN_ERROR,500,{}));
    }
});

/* GET user detail by admin */
router.get('/users/:userId', async (req, res) => {

    const userId = req.params.userId;

    try {
        const [userDB] = await DB.execute({
            psmt: `select user_id, username, email, student_id, type, company, generation, github, created_at, canceled_at from USER where user_id = ?`,
            binding: [userId]
        });

        console.log('user: %j', userDB);

        if (!userDB) {
            res.status(404).json({
                message: MSG.NO_USER_DATA,
                status: 404,
                servertime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
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
                servertime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                data: {
                    userId: user_id,
                    userName: username,
                    email: email,
                    studentId: student_id,
                    type: ((type) => {
                        if (!type) return '비회원';

                        switch (type) {
                            case 'admin':
                                return 'admin';
                            case 'member':
                                return 'member';
                            default:
                                return 'unknown';
                        }
                    })(type),
                    company: company || null,
                    generation: generation,
                    github: github || null,
                    createdAt: dayjs(created_at).format('YYYY-MM-DD HH:mm:ss'),
                    canceledAt: ((canceled_at) => {
                        if (!!canceled_at) {
                            return dayjs(canceled_at).format('YYYY-MM-DD HH:mm:ss')
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
            servertime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            data: {}
        });
    }
});

/* POST regist new user by admin */
router.post('/users', async (req, res) => {
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
        if (!userName || !password || !name || !studentId || !email || !generation || !type) {
            res.status(404).json({
                message: MSG.NO_REQUIRED_INFO,
                status: 404,
                servertime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                data: {}
            });
        }

        const [checkEmail, checkUsername, checkStudentId] = await Promise.all([
            await DB.execute({
                psmt: `select user_id from USER where email = ?`,
                binding: [email]
            }),
            await DB.execute({
                psmt: `select user_id from USER where username = ?`,
                binding: [userName]
            }),
            await DB.execute({
                psmt: `select user_id from USER where student_id = ?`,
                binding: [studentId]
            })
        ]);

        if (!correctEmail.test(email)) {
            res.status(403).json({
                message: MSG.WRONG_EMAIL,
                status: 403,
                servertime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                data: {}
            });
        }
        if (studentId.length != 7) {
            res.status(403).json({
                message: MSG.WRONG_STUDENTID,
                status: 403,
                servertime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                data: {}
            });
        }
        if (type != 'admin' && type != 'member') {
            res.status(403).json({
                message: MSG.WRONG_TYPE,
                status: 403,
                servertime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                data: {}
            });
        }
        if (!checkEmail) {
            res.status(403).json({
                message: MSG.EXIST_EMAIL,
                status: 403,
                servertime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                data: {}
            });
        }
        if (!checkUserName) {
            res.status(403).json({
                message: MSG.EXIST_USERNAME,
                status: 403,
                servertime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                data: {}
            });
        }
        if (!checkStudentId) {
            res.status(403).json({
                message: MSG.EXIST_STUDENTID,
                status: 403,
                servertime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                data: {}
            });
        }

        await DB.execute({
            psmt: `insert into USER (username, password, name, student_id, email, generation, type, company, github, created_at, updated_at) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            binding: [userName, password, name, studentId, email, generation, type, company, github]
        });

        res.status(201).json({
            message: MSG.USER_ADDED,
            status: 201,
            servertime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            data: {}
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: MSG.UNKNOWN_ERROR,
            status: 500,
            servertime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            data: {}
        });
    }
})

/* PATCH (delete) user by admin */
router.patch('/users/:userId/kick', async (req, res) => {
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
                servertime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
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
                servertime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                data: {}
            });
        }
    } catch (error) {
        console.log(error);
        res.status(501).json({
            message: error.message,
            status: 501,
            servertime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            data: {}
        });
    }
})

/* GET posts list by admin(included deleted posts) */
router.get('/posts', async (req, res) => {
    try {
        const postsDB = await DB.execute({
            psmt: `select post_id, username, title, content, p.created_at, p.updated_at, p.canceled_at, category from POST p, USER u WHERE p.user_id = u.user_id`,
            binding: []
        })

        console.log('users: %j', postsDB);

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
                createdAt: dayjs(created_at).format('YYYY-MM-DD HH:mm:ss'),
                updatedAt: ((updated_at) => {
                    if (!!updated_at) {
                        return dayjs(updated_at).format('YYYY-MM-DD HH:mm:ss')
                    }
                    return null;
                })(updated_at),
                canceledAt: ((canceled_at) => {
                    if (!!canceled_at) {
                        return dayjs(canceled_at).format('YYYY-MM-DD HH:mm:ss')
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
            servertime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            data: {
                posts
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: MSG.UNKNOWN_ERROR,
            status: 500,
            servertime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            data: {}
        });
    }
})

/* GET get for posts written by a specific user by admin */
router.get('/posts/:userId', async (req, res) => {

    const userId = req.params.userId;

    try {
        const [postsDB] = await DB.execute({
            psmt: `select post_id, title, content, created_at, updated_at, canceled_at, category from POST WHERE user_id = ?`,
            binding: [userId]
        });

        console.log('post: %j', postsDB);
        if (!postsDB) {
            res.status(404).json({
                message: MSG.CANT_READ_POSTDATA,
                status: 404,
                servertime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
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
                    createdAt: dayjs(created_at).format('YYYY-MM-DD HH:mm:ss'),
                    updatedAt: ((updated_at) => {
                        if (!!updated_at) {
                            return dayjs(updated_at).format('YYYY-MM-DD HH:mm:ss')
                        }
                        return null;
                    })(updated_at),
                    canceledAt: ((canceled_at) => {
                        if (!!canceled_at) {
                            return dayjs(canceled_at).format('YYYY-MM-DD HH:mm:ss')
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
                servertime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
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
            servertime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            data: {}
        });
    }
})

/* PATCH (edit) user info */
router.patch('/../admin/users/:user_id', async (req, res) => {

    const {
        password,
        userName,
        email,
        github,
        company,
        userId
    } = req.body;

    try {
        // 요청한 사람이 본인 또는 관리자인지 검증 필요
        // 일단 관리자만
        const [userDB] = await DB.execute({
            psmt: `select type from USER where user_id = ?`,
            binding: [userId]
        });

        if (!userDB.type || userDB.type === 'member' || userDB.type === 'unknown') {
            res.status(403).json({
                message: MSG.NO_AUTHORITY,
                status: 403,
                servertime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                data: {}
            });
        } else if (userDB[0].type === 'admin') {
            let sql = `update USER set`;
            const bindings = [];

            if (!!password) {
                sql += ` password = ?,`;
                bindings.push(password);
            }
            if (!!userName) {
                sql += ` username = ?,`;
                bindings.push(userName);
            }
            if (!!email) {
                sql += ` email = ?,`;
                bindings.push(email);
            }
            if (!!github) {
                sql += ` github = ?,`;
                bindings.push(password);
            }
            if (!!company) {
                sql += ` company = ?,`;
                bindings.push(company);
            }

            sql += ` updated_at = NOW() where user_id = ?;`;
            bindings.push(userId);

            const ret = await DB.execute({
                psmt: sql,
                binding: bindings
            });

            res.status(201).json({
                message: MSG.USER_UPDATE_SUCCESS,
                status: 201,
                servertime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                data: {
                    ret
                }
            });
        }
    } catch (e) {
        console.log(e);
        res.status(500).json({
            message: MSG.UNKNOWN_ERROR,
            status: 500,
            servertime: dayjs(new Date()).format(),
            data: {}
        });
    }
})

module.exports = router;