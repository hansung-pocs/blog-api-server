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

        res.status(200).json(util.getReturnObject(`관리자 권한으로 ${MSG.READ_USERDATA_SUCCESS}`, 200, {users}));
    } catch (e) {
        console.error(e);
        res.status(500).json(util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {}));
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
            res.status(404).json(util.getReturnObject(MSG.NO_USER_DATA, 404, {}));
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

            res.status(200).json(util.getReturnObject(`어드민 권한으로 ${username}${MSG.READ_USER_SUCCESS}`, 200, {
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
            }));
        }
    } catch (error) {
        console.error(error);
        res.status(500).json(util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {}));
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
            res.status(404).json(util.getReturnObject(MSG.NO_REQUIRED_INFO, 404, {}));
        }

        const [checkEmail, checkUserName, checkStudentId] = await Promise.all([
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
            res.status(403).json(util.getReturnObject(MSG.WRONG_EMAIL, 403, {}));
        }
        if (studentId.length != 7) {
            res.status(403).json(util.getReturnObject(MSG.WRONG_STUDENTID, 403, {}));
        }
        if (type != 'admin' && type != 'member') {
            res.status(403).json(util.getReturnObject(MSG.WRONG_TYPE, 403, {}));
        }
        if (!checkEmail) {
            res.status(403).json(util.getReturnObject(MSG.EXIST_EMAIL, 403, {}));
        }
        if (!checkUserName) {
            res.status(403).json(util.getReturnObject(MSG.EXIST_USERNAME, 403, {}));
        }
        if (!checkStudentId) {
            res.status(403).json(util.getReturnObject(MSG.EXIST_STUDENTID, 403, {}));
        }

        await DB.execute({
            psmt: `insert into USER (username, password, name, student_id, email, generation, type, company, github, created_at, updated_at) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            binding: [userName, password, name, studentId, email, generation, type, company, github]
        });

        res.status(201).json(util.getReturnObject(MSG.USER_ADDED, 201, {}));
    } catch (error) {
        console.log(error);
        res.status(500).json(util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {}));
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
            res.status(404).json(util.getReturnObject(MSG.NO_USER_DATA, 404, {}));
        } else {
            await DB.execute({
                psmt: `update USER SET canceled_at = NOW() where user_id = ?`,
                binding: [userId]
            })

            res.status(201).json(util.getReturnObject(MSG.USER_KICK_SUCCESS, 201, {}));
        }
    } catch (error) {
        console.log(error);
        res.status(501).json(util.getReturnObject(error.message, 501, {}));
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
        res.status(200).json(util.getReturnObject(MSG.READ_POSTDATA_SUCCESS, 200, {posts}));
    } catch (error) {
        console.log(error);
        res.status(500).json(util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {}));
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
            res.status(404).json(util.getReturnObject(MSG.CANT_READ_POSTDATA, 404, {}));
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
            res.status(200).json(util.getReturnObject(`관리자 권한으로 ${MSG.READ_POSTDATA_SUCCESS}`, 200, {posts}));
        }
    } catch (e) {
        console.error(e);
        res.status(500).json(util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {}));
    }
})

module.exports = router;