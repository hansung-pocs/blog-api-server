var express = require('express');
var router = express.Router();

const DB = require('../common/database');
const MSG = require('../common/message')
const dayjs = require('dayjs')
const util = require('../common/util');

/* GET users list. */
router.get('/', async (req, res) => {

    const sortOption = req.query.sort;
    const searchOption = req.query.search;

    try {
        let sql = `select * from USER where canceled_at is NULL`;
        // let sql2 = `select count(*) as count from USER where canceled_at is NULL`;

        if (sortOption === 'generation') {
            sql += ` order by generation DESC;`;
        } else if (sortOption === 'studentId') {
            sql += ` order by student_id;`;
        } else if (!!searchOption) {
            sql += ` and name like '%${searchOption}%';`;
        } else {
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
                name,
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

        res.status(200).json(util.getReturnObject(MSG.READ_USERDATA_SUCCESS, 200, {
            users,
            countAllUsers
        }));

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
                res.status(403).json(util.getReturnObject(MSG.NO_AUTHORITY, 403, {}));
            } else {
                res.status(200).json(util.getReturnObject(`${name} ${MSG.READ_USER_SUCCESS}`, 200, {
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
        }
    } catch (error) {
        console.error(error);
        res.status(500).json(util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {}));
    }
});

/* PATCH (edit) user info */
router.patch('/:user_id', async (req, res) => {

    const userId = req.params.user_id;
    const {
        password,
        name,
        email,
        github,
        company
    } = req.body;

    const correctEmail = /^[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/;

    try {
        // 요청한 사람이 본인 또는 관리자인지 검증 필요
        const [checkEmail] = await DB.execute({
            psmt: `select user_id from USER where email = ?`,
            binding: [email]
        });

        const [userDB] = await DB.execute({
            psmt: `select * from USER where user_id = ?`,
            binding: [userId]
        });

      //  const [[checkEmail], [userDB]] = await Promise.all

        if (userDB.canceled_at != null) {
            res.status(403).json(util.getReturnObject(MSG.NO_USER_DATA, 403, {}));
        } else if (!correctEmail.test(email)) {
            res.status(403).json(util.getReturnObject(MSG.WRONG_EMAIL, 403, {}));
        } else if (userDB.type === 'admin' || userDB.type === 'member') {
            let sql = `update USER set`;
            const bindings = [];
            console.log(bindings.length);

            if (userDB.password != password) {
                sql += ` password = ?,`;
                bindings.push(password);
            }
            if (userDB.name != name) {
                sql += ` name = ?,`;
                bindings.push(name);
            }
            if (userDB.email != email) {
                if (checkEmail != null) {
                    res.status(403).json(util.getReturnObject(MSG.EXIST_EMAIL, 403, {}));
                }
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
                res.status(302).json(util.getReturnObject(MSG.USER_UPDATE_SUCCESS, 302, {}));
            }
        }
    } catch (e) {
        console.log(e);
        res.status(500).json(util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {}));
    }
});

module.exports = router;