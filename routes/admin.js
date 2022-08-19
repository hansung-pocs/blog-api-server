const express = require('express');
const router = express.Router();

const DB = require('../common/database');
const dayjs = require('dayjs');
const MSG = require('../common/message');
const util = require('../common/util');
const {isAdmin} = require("../common/middlewares");

/* GET users list by admin */
router.get('/users', isAdmin, async (req, res) => {

    const sortOption = req.query.sort;
    const offset = req.query.offset;
    const page = req.query.pageNum;

    try {
        let sql = `select user_id, name, email, student_id, type, company, generation, github, created_at, canceled_at from USER`;

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

        const usersAll = [];
        usersDB.forEach(usersDB => {
            const {
                user_id,
                name,
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
                name: name,
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
                createdAt: dayjs(created_at).format('YYYY-MM-DD'),
                canceledAt: ((canceled_at) => {
                    if (!!canceled_at) {
                        return dayjs(canceled_at).format('YYYY-MM-DD')
                    }
                    return null;
                })(canceled_at),
            }
            usersAll.push(usersObj);
        })

        const users = [];
        let pagination = 0;
        for (let i = (offset * page) - offset; i < offset * page; i++) {
            users[pagination] = usersAll[i];
            pagination++;
        }

        return res.status(200).json(util.getReturnObject(`관리자 권한으로 ${MSG.READ_USERDATA_SUCCESS}`, 200, {users}));
    } catch (e) {
        console.error(e);
        return res.status(500).json(util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {}));
    }
});

/* GET user detail by admin */
router.get('/users/:userId', isAdmin, async (req, res) => {

    const userId = req.params.userId;

    try {
        const [userDB] = await DB.execute({
            psmt: `select * from USER where user_id = ?`,
            binding: [userId]
        });

        if (!userDB) {
            return res.status(404).json(util.getReturnObject(MSG.NO_USER_DATA, 404, {}));
        }

        const {
            user_id,
            name,
            email,
            student_id,
            type,
            company,
            generation,
            github,
            created_at,
            canceled_at
        } = userDB;

        return res.status(200).json(util.getReturnObject(`어드민 권한으로 ${name}${MSG.READ_USER_SUCCESS}`, 200, {
            userId: user_id,
            name: name,
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
    } catch (error) {
        console.error(error);
        res.status(500).json(util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {}));
    }
});

/* POST regist new user by admin */
router.post('/users', isAdmin, async (req, res) => {
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
        const [[checkUserName], [checkStudentId], [checkEmail]] = await Promise.all([
            await DB.execute({
                psmt: `select user_id from USER where name = ?`,
                binding: [userName]
            }),
            await DB.execute({
                psmt: `select user_id from USER where student_id = ?`,
                binding: [studentId]
            }),
            await DB.execute({
                psmt: `select user_id from USER where email = ?`,
                binding: [email]
            })
        ]);

        if (!userName || !password || !name || !studentId || !email || !generation || !type) {
            return res.status(403).json(utill.getReturnObject(MSG.NO_REQUIRED_INFO, 403, {}));
        }
        if (!correctEmail.test(email)) {
            return res.status(403).json(utill.getReturnObject(MSG.WRONG_EMAIL, 403, {}));
        }
        if (1000000 >= studentId && studentId >= 9999999) {
            return res.status(403).json(utill.getReturnObject(MSG.WRONG_STUDENTID, 403, {}));
        }
        if (type != 'admin' && type != 'member') {
            return res.status(403).json(utill.getReturnObject(MSG.WRONG_TYPE, 403, {}));
        }
        if (checkUserName != null) {
            return res.status(403).json(utill.getReturnObject(MSG.EXIST_USERNAME, 403, {}));
        }
        if (checkStudentId != null) {
            return res.status(403).json(utill.getReturnObject(MSG.EXIST_STUDENTID, 403, {}));
        }
        if (checkEmail != null) {
            return res.status(403).json(utill.getReturnObject(MSG.EXIST_EMAIL, 403, {}));
        }

        await DB.execute({
            psmt: `insert into USER (name, password, name, student_id, email, generation, type, company, github, created_at, updated_at) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            binding: [userName, password, name, studentId, email, generation, type, company, github]
        });

        return res.status(201).json(util.getReturnObject(MSG.USER_ADDED, 201, {}));

    } catch (error) {
        console.log(error);
        res.status(500).json(util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {}));
    }
});

/* PATCH (delete) user by admin */
router.patch('/users/:userId/kick', isAdmin, async (req, res) => {
    const userId = req.params.userId;

    try {
        const [user] = await DB.execute({
            psmt: `select canceled_at from USER where user_id = ?`,
            binding: [userId]
        })
        if (!user) {
            return res.status(404).json(util.getReturnObject(MSG.NO_USER_DATA, 404, {}));
        }
        if (user.canceled_at != null) {
            return res.status(403).json(util.getReturnObject(MSG.NO_USER_DATA, 403, {}));
        }

        await DB.execute({
            psmt: `update USER SET canceled_at = NOW() where user_id = ?`,
            binding: [userId]
        })

        return res.status(201).json(util.getReturnObject(MSG.USER_KICK_SUCCESS, 201, {}));
    } catch (error) {
        console.log(error);
        return res.status(501).json(util.getReturnObject(error.message, 501, {}));
    }
});

/* GET posts list by admin(included deleted posts) */
router.get('/posts', isAdmin, async (req, res) => {
    const offset = req.query.offset;
    const page = req.query.pageNum;
    const title = decodeURI(req.query.title);
    try {
        let sql = `select post_id, name, title, content, p.created_at, p.updated_at, p.canceled_at, category from POST p, USER u WHERE p.user_id = u.user_id`;

        if (!!title) {
            sql += ` and title like '%${title}%'`
        }

        const postsDB = await DB.execute({
            psmt: sql + ` order by created_at DESC;`,
            binding: []
        });

        const postsAll = [];
        postsDB.forEach(postsDB => {
            const {
                post_id,
                name,
                title,
                content,
                created_at,
                updated_at,
                canceled_at,
                category
            } = postsDB;

            const postsObj = {
                postId: post_id,
                writerName: name,
                title: title,
                content: content,
                createdAt: dayjs(created_at).format('YYYY-MM-DD'),
                updatedAt: ((updated_at) => {
                    if (!!updated_at) {
                        return dayjs(updated_at).format('YYYY-MM-DD')
                    }
                    return null;
                })(updated_at),
                canceledAt: ((canceled_at) => {
                    if (!!canceled_at) {
                        return dayjs(canceled_at).format('YYYY-MM-DD')
                    }
                    return null;
                })(canceled_at),
                category: category
            }
            postsAll.push(postsObj);
        })
        const posts = [];
        let pagination = 0;
        for (let i = (offset * page) - offset; i < offset * page; i++) {
            posts[pagination] = postsAll[i];
            pagination++;
        }
        return res.status(200).json(util.getReturnObject(MSG.READ_POSTDATA_SUCCESS, 200, {posts}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {}));
    }
});

/* GET get for posts written by a specific user by admin */
router.get('/posts/:userId', isAdmin, async (req, res) => {
    const userId = req.params.userId;
    const offset = req.query.offset;
    const page = req.query.pageNum;
    const title = decodeURI(req.query.title);

    try {
        let sql = `
        select
        post_id, title, content, created_at, updated_at, canceled_at, category
        from
        POST
        WHERE
        user_id = ? `;

        if (!!title) {
            sql += ` and
        title
        like
        '%${title}%'`
        }
        const postsDB = await DB.execute({
            psmt: sql + `
        order
        by
        created_at
        DESC;
        `,
            binding: []
        });

        console.log('post: %j', postsDB);

        if (postsDB.length === 0) {
            res.status(404).json(utill.getReturnObject(MSG.CANT_READ_POSTDATA, 404, {}));
        }
        const postsAll = [];
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

            postsAll.push(postsObj);
        })
        const posts = [];
        let pagination = 0;
        for (let i = (offset * page) - offset; i < offset * page; i++) {
            posts[pagination] = postsAll[i];
            pagination++;
        }
        return res.status(200).json(util.getReturnObject(`관리자 권한으로 userID : ${userId}의 ${MSG.READ_POSTDATA_SUCCESS}`, 200, {posts}));
    } catch (e) {
        console.error(e);
        return res.status(500).json(util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {}));
    }
});

/* PATCH (delete) post by admin */
router.patch('/posts/:postId/delete', isAdmin, async (req, res, next) => {

    const postId = req.params.postId;
    try {

        const [postDB] = await DB.execute({
            psmt: `select * from POST where post_id = ? `,
            binding: [postId]
        });

        if (!postDB) {
            return res.status(403).json(util.getReturnObject(MSG.NO_POST_DATA, 403, {}));
        }
        if (!!postDB.canceled_at) {
            return res.status(403).json(util.getReturnObject(MSG.NO_POST_DATA, 403, {}));
        }
        await DB.execute({
            psmt: `update POST set canceled_at = NOW() where post_id = ? `,
            binding: [postId]
        });

        return res.status(201).json(util.getReturnObject(`관리자 권한으로 ${MSG.POST_DELETE_SUCCESS}`, 201, {}));
    } catch (e) {
        console.error(e);
        return res.status(501).json(util.getReturnObject(e.message, 501, {}));
    }
});

module.exports = router;