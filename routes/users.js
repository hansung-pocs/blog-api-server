var express = require('express');
var router = express.Router();

const DB = require('../common/database');
const MSG = require('../common/message')
const dayjs = require('dayjs')

/* GET users listing. */
router.get('/', async (req, res) => {

    const sortingOption = req.query.sorting;
    console.log(typeof(sortingOption));
    console.log(sortingOption);

    // sorting, searching option
    //const searched = await DB.execute({

    try {
        let sql = `select * from USER where canceled_at is NULL`;

        if (sortingOption === "generation") {
            console.log("sorting by generation");
            sql += ` order by generation DESC`;
        } else if (sortingOption === "studentId") {
            console.log("sorting by studentId");
            sql += ` order by student_id`;
        } // else if (searchingOption)

        const usersDB = await DB.execute({
            psmt: sql,
            binding: []
        });

        if (!usersDB) {
            res.status(404).json({
                message: MSG.CANT_READ_USERDATA,
                status: 404,
                servertime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                data: {}
            });
        }

        const users = new Array();
        for (let i in usersDB) {
            let usersObj = new Object();
            usersObj.user_id = usersDB[i].user_id;
            usersObj.userName = usersDB[i].username;
            usersObj.email = usersDB[i].email;
            usersObj.studentIdd = usersDB[i].student_id;
            usersObj.type = ((type) => {
                switch (type) {
                    case "admin":
                        return "admin";
                    case "user":
                        return "user";
                    default:
                        return "unknown";
                }
            })(usersDB[i].type);
            usersObj.company = usersDB[i].company || "-";
            usersObj.generation = usersDB[i].generation;
            usersObj.github = usersDB[i].github || "-";
            usersObj.createdAt = dayjs(usersDB[i].created_at).format("YY-MM-DD");

            users.push(usersObj);
        }

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

        console.log("user: %j", userDB);

        if (!userDB) {
            res.status(404).json({
                message: MSG.CANT_READ_USERDATA,
                status: 404,
                servertime: dayjs.format('YYYY-MM-DD HH:mm:ss'),
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
                createdAt : userDB.created_at // YYYY-MM-DD
            }
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({
            message: "알 수 없는 오류가 발생했습니다.",
            servertime: new Date()
        });
    }
});



//유저 프로필 수정
router.patch('/:user_id', async (req,res) => {
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