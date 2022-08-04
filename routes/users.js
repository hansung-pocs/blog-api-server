var express = require('express');
var router = express.Router();

const DB = require('../common/database');
const MSG = require('../common/message')
const dayjs = require('dayjs')
const util = require("../common/util");

/* GET users list. */
router.get('/', async (req, res) => {

    const sortOption = req.query.sort;
    // const searchOption = req.query.search;

    try {
        let sql = `select * from USER where canceled_at is NULL`;

        if (sortOption === 'generation') {
            console.log('sorting by generation');
            sql += ` order by generation DESC;`;
        } else if (sortOption === 'studentId') {
            console.log('sorting by studentId');
            sql += ` order by student_id;`;
        } // else if (searchOption)
        else {
            sql += ` order by created_at DESC;`;
        }

        const usersDB = await DB.execute({
            psmt: sql,
            binding: []
        });

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
            } = usersDB;

            const usersObj = {
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
            }
            users.push(usersObj);
        })

        res.status(200).json(util.getReturnObject(MSG.READ_USERDATA_SUCCESS, 200, {users}));

    } catch (e) {
        console.error(e);
        res.status(500).json(util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {}));
    }
});

/* GET user detail */
router.get('/:userId', async (req, res) => {

    const user_id = req.params.userId;

    try {
        const [userDB] = await DB.execute({
            psmt: `select * from USER where user_id = ?`,
            binding: [user_id]
        });

        //console.log('user: ', JSON.stringify(user)와 동일
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

            if (!!canceled_at) {
                res.status(403).json(util.getReturnObject(MSG.NO_USER_DATA, 403, {}));
            } else {
                res.status(200).json(util.getReturnObject(`${username} ${MSG.READ_USER_SUCCESS}`, 200, {
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
                    createdAt: dayjs(created_at).format('YYYY-MM-DD HH:mm:ss')
                }));
            }
        }
    } catch (error) {
        console.error(error);
        res.status(500).json(util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {}));
    }
})

/* PATCH (edit) user info */
router.patch('/:user_id', async (req, res) => {

    const userId = req.params.user_id;
    const {
        password,
        userName,
        email,
        github,
        company
    } = req.body;

    try {
        // 요청한 사람이 본인 또는 관리자인지 검증 필요
        const [userDB] = await DB.execute({
            psmt: `select * from USER where user_id = ?`,
            binding: [userId]
        });

        if (!userDB.type) {
            res.status(403).json(util.getReturnObject(MSG.NO_AUTHORITY, 403, {}));
        } else if (userDB.type === 'admin' || userDB.type === 'member') {
            let sql = `update USER set`;
            const bindings = [];
            console.log(bindings.length);

            if (userDB.password != password) {
                sql += ` password = ?,`;
                bindings.push(password);
            }
            if (userDB.username != userName) {
                sql += ` username = ?,`;
                bindings.push(userName);
            }
            if (userDB.email != email) {
                sql += ` email = ?,`;
                bindings.push(email);
            }
            if (userDB.github != github) {
                sql += ` github = ?,`;
                bindings.push(github);
            }
            if (userDB.company != company) {
                sql += ` company = ?,`;
                bindings.push(company);
            }

            if (bindings.length === 0) {
                res.status(404).json(util.getReturnObject(MSG.NO_CHANGED_INFO, 404, {}));
            } else {
                sql += ` updated_at = NOW() where user_id = ?;`;
                bindings.push(userId);

                await DB.execute({
                    psmt: sql,
                    binding: bindings
                });
                // http status code 204: 요청 수행 완료, 반환 값 없음.
                res.status(204).json(util.getReturnObject(MSG.USER_UPDATE_SUCCESS, 204, {}));
            }
        }
    } catch (e) {
        console.log(e);
        res.status(500).json(util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {}));
    }
})

module.exports = router;