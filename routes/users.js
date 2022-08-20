const express = require('express');
const router = express.Router();

const DB = require('../common/database');
const MSG = require('../common/message')
const dayjs = require('dayjs')
const Util = require('../common/util');
const {isLoggedIn, isNotLoggedIn} = require('../common/middlewares');

/* GET users list. */
router.get('/', isLoggedIn, async (req, res) => {
    const sortOption = req.query.sort;
    const searchOption = decodeURI(req.query.search);
    const offset = Number(req.query.offset);
    const page = Number(req.query.pageNum);
    const start = (page - 1) * offset;

    try {
        if(isNaN(offset) || isNaN(page)){
            return res.status(403).json(Util.getReturnObject(MSG.NO_REQUIRED_INFO, 403, {}));
        }

        let sql = `select * from USER where canceled_at is NULL`;
        if (searchOption != "undefined") {
            sql += ` and name like '%${searchOption}%'`;
        }

        if (sortOption == 'generation') {
            sql += ` order by generation DESC limit ?, ?;`;
        } else if (sortOption == 'studentId') {
            sql += ` order by student_id limit ?, ?;`;
        } else {
            sql += ` order by created_at DESC limit ?, ?;`;    // default는 생성된 순의 내림차순으로 정렬
        }

        const usersDB = await DB.execute({
            psmt: sql,
            binding: [start, offset]
        });

        const users = [];
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
                created_at
            } = usersDB;

            const usersObj = {
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
                createdAt: dayjs(created_at).format('YYYY-MM-DD')
            }
            users.push(usersObj);
        })

        const countAllUsers = users.length;
        res.status(200).json(Util.getReturnObject(MSG.READ_USERDATA_SUCCESS, 200, {users, countAllUsers}));
    } catch (e) {
        console.error(e);
        res.status(500).json(Util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {}));
    }
});

/* GET user detail */
//router.get('/:userId', isLoggedIn, async (req, res) => {
router.get('/:userId', isLoggedIn, async (req, res) => {
    const user_id = req.params.userId;

    try {
        const [userDB] = await DB.execute({
            psmt: `select * from USER where user_id = ? and type is NOT NULL`,
            binding: [user_id]
        });

        if (!userDB) {
            return res.status(404).json(Util.getReturnObject(MSG.NO_USER_DATA, 404, {}));
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

        if (!!canceled_at) {
            return res.status(403).json(Util.getReturnObject(MSG.NO_AUTHORITY, 403, {}));
        } else {
            return res.status(200).json(Util.getReturnObject(`${name} ${MSG.READ_USER_SUCCESS}`, 200, {
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
                createdAt: dayjs(created_at).format('YYYY-MM-DD HH:mm:ss')
            }));
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json(Util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {}));
    }
});

/* PATCH (edit) user info */
//router.patch('/:user_id', isLoggedIn, async (req, res) => {
router.patch('/:user_id', isLoggedIn, async (req, res) => {
    const userId = req.params.user_id;
    const body = req.body;

    const {email} = body;

    const correctEmail = /^[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/;
    if (!email || !correctEmail.test(email)) {
        return res.status(403).json(Util.getReturnObject(MSG.WRONG_EMAIL, 403, {}));
    }

    try {
        const [userDB] = await DB.execute({
            psmt: `select * from USER where user_id = ?`,
            binding: [userId]
        });

        if (userDB.canceled_at != null) {
            return res.status(403).json(Util.getReturnObject(MSG.NO_USER_DATA, 403, {}));
        }

        if (!['admin', 'member'].includes(userDB.type)) {
            return res.status(403).json(Util.getReturnObject(MSG.NO_AUTHORITY, 403, {}));
        }

        const {sql, bindings} = (() => {
            let sql = `update USER set`;
            const bindings = [];
            ['password', 'name', 'email', 'github', 'company'].forEach(col => {
                if (userDB[col] != body[col]) {
                    sql += ` ${col} = ?,`;
                    bindings.push(body[col]);
                }
            });

            sql += ` updated_at = NOW() where user_id = ?;`;
            bindings.push(userId);

            return {bindings, sql};
        })(body);

        await DB.execute({
            psmt: sql,
            binding: bindings
        });
        return res.status(200).json(Util.getReturnObject(MSG.USER_UPDATE_SUCCESS, 200, {}));
    } catch (e) {
        console.log(e);
        return res.status(500).json(Util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {}));
    }
});

//비회원 회원가입
//router.post('/', async (req, res) => {
router.post('/', isNotLoggedIn, async (req, res) => {
    const {
        userName,
        password,
    } = req.body

    try {
        const [checkUserName] = await DB.execute({
            psmt: `select user_id from USER where username = ?`,
            binding: [userName]
        });

        if (!userName || !password) {
            return res.status(403).json(Util.getReturnObject(MSG.NO_REQUIRED_INFO, 403, {}));
        }
        if (checkUserName != null) {
            return res.status(403).json(Util.getReturnObject(MSG.EXIST_USERNAME, 403, {}));
        }
        await DB.execute({
            psmt: `insert into USER (username, password, created_at, updated_at) VALUES(?, ?, NOW(), NOW())`,
            binding: [userName, password]
        });

        return res.status(201).json(Util.getReturnObject(MSG.USER_ADDED, 201, {}));

    } catch (error) {
        console.log(error);
        return res.status(500).json(Util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {}));
    }
});

module.exports = router;