var express = require('express');
var router = express.Router();

const DB = require('../common/database');
const MSG = require('../common/message')
const dayjs = require('dayjs')

/* GET users listing. */
router.get('/', async (req, res) => {

    const sortingOption = req.query.sort;

    try {
        let sql = `select * from USER where canceled_at is NULL`;

        if (sortingOption === "generation") {
            console.log("sorting by generation");
            sql += ` order by generation DESC`;
        } else if (sortingOption === "studentId") {
            console.log("sorting by studentId");
            sql += ` order by student_id`;
        } // else if (searchingOption)
        else {
            sql += ` order by created_at DESC"`;
        }

        const usersDB = await DB.execute({
            psmt: sql,
            binding: []
        });

        /*
        !일반 회원이 유저 검색을 했을 때 삭제된 유저를 검색한 경우!
        => status: 404 Not Found
        요청 리소스를 찾을 수 없음
        - 요청 리소스를 찾을 수 없음
        - 또는 클라이언트가 권한이 부족한 리소스에 접근할 때 해당 리소스를 숨기고 싶을 때
         */

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
            }
            users.push(usersObj);
        })

        res.status(200).json({
            message: MSG.READ_USERDATA_SUCCESS,
            servertime: dayjs.format('YYYY-MM-DD HH:mm:ss'),
            data: {
                users
            }
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({
            message: MSG.UNKNOWN_ERROR,
            status: 500,
            servertime: dayjs.format('YYYY-MM-DD HH:mm:ss'),
            data: {}
        });
    }
});

//유저 상세 조회
router.get("/:userId", async (req, res) => {

    const user_id = req.params.userId;

    try {
        const userDB = await DB.execute({
            psmt: `select * from USER where user_id = ?`,
            binding: [user_id]
        });

        //console.log("user: ", JSON.stringify(user)와 동일
        console.log("user: %j", userDB);

        if (!userDB) {
            res.status(404).json({
                message: MSG.CANT_READ_USERDATA,
                status: 404,
                servertime: dayjs.format('YYYY-MM-DD HH:mm:ss'),
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
                    createdAt: dayjs(created_at).format("YYYY-MM-DD HH:MM:ss")
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

    res.status(200).json({
        message: userDB.username + MSG.READ_USERDATA_SUCCESS,
        status: 200,
        servertime: dayjs.format('YYYY-MM-DD HH:mm:ss'),
        data: {
            userId: userDB.user_id,
            userName: userDB.username,
            email: userDB.email,
            studentId: userDB.student_id,
            type: userDB.type, // 'admin', 'member' 둘중 하나 default : unknown
            company: userDB.company || "null", //없으면 "-"
            generation: userDB.generation, //기수
            github: userDB.github || "null", // 깃허브 주소, 없으면 "-"
            createdAt: userDB.created_at // YYYY-MM-DD
        }
    });
})

//유저 프로필 수정
router.patch('/:user_id', async (req, res) => {
    const password = req.body.password;
    const userName = req.body.userName;
    const email = req.body.email;
    const github = req.body.github;
    const company = req.body.company;
    const userId = req.params.userId;

    try {
        // 요청한 사람이 본인 또는 관리자인지 검증 필요
        // 일단 관리자만
        const userDB = await DB.execute({
            psmt: `select type from USER where user_id = ?`,
            binding: [userId]
        });

        if (!userDB[0].type || userDB[0].type === 'unknown') {
            res.status(403).json({
                message: MSG.NO_AUTHORITY,
                status: 403,
                servertime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                data: {}
            });
        } else if (userDB[0].type === 'admin') {
            let sql = `update USER set`;
            const bindings = [];

            if (password != NULL) {
                sql += ` password = ?,`;
                bindings.push(password);
            }

            if (userName != NULL) {
                sql += ` username = ?,`;
                bindings.push(userName);
            }

            if (email != NULL) {
                sql += ` email = ?,`;
                bindings.push(email);
            }

            if (github != NULL) {
                sql += ` github = ?,`;
                bindings.push(password);
            }

            if (company != NULL) {
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
                data: {}
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