var express = require('express');
var router = express.Router();

const DB = require("../common/database");

//https://day.js.org/docs/en/parse/string-format
const dayjs = require('dayjs')

/* GET users listing. */
router.get('/', async (req, res) => {
    let option = req.params.option;
    try{
        const users = await DB.execute({
            psmt: `select user_id,username,email,student_id,type,company,generation from USER where canceled_at IS NULL`,
            binding: [option]
        });

        console.log("users: %j",users);
        if(!users){
            res.status(404).json({ok: false, message: "잘못된 요청입니다."});
        }

        res.json({users : users});
    }catch (e){
        console.error(e);

        res.status(500).json({
            ok: false,
            message: "알 수 없는 오류가 발생했습니다."
        });
    }
});

//유저 상세 조회
router.get("/:userId", async (req, res) => {
    const userId = req.params.userId;

    try {
        //DB.execute의 결과가 [{user_id:123}]; 이런식이라서
        //구조분해할당으로 바로 꺼낸다.
        const [user] = await DB.execute({
            psmt: `select * from USER where user_id = ?`,
            binding: [userId]
        });
        //console.log("user: ", JSON.stringify(user)와 동일
        console.log("user: %j", user);

        if (!user) {
            return res.status(404).json({
                ok: false,
                message: "해당 유저를 찾을 수 없습니다.",
            });
        }

        res.json({
            ok: true,
            id: user.user_id,
            username: user.username,
            student_id: user.student_id,

            //즉시실행함수
            type: ((type) => {
                if (!type) {
                    return "일반유저";
                }

                switch (type) {
                    case "sub":
                        return "부관리자";
                    case "primary":
                        return "관리자";
                    default:
                        return "unknown";
                }
            })(user.type),

            created_at: dayjs(user.created_at).format("YY-MM-DD"),
        })
    } catch (e) {
        console.error(e);
        res.status(500).json({
            ok: false,
            message: "알 수 없는 오류가 발생했습니다."
        });
    }
});

//유저 이름 검색
router.get("/name/:username", async (req, res) => {
    const username = decodeURIComponent(req.params.username);

    try {
        const user = await DB.execute({
            psmt: `select user_id,username,student_id,type,created_at from USER where canceled_at IS NULL and username = ?`,
            binding: [username]
        });
        //console.log("user: ", JSON.stringify(user)와 동일
        console.log("user: %j", user);

        if (!user) {
            return res.status(404).json({
                ok: false,
                message: "해당 유저를 찾을 수 없습니다.",
            });
        }

        for(let i in user){
            user[i].created_at = dayjs(user[i].created_at).format("YY-MM-DD")
        }

        res.json({user : user});

    } catch (e) {
        console.error(e);
        res.status(500).json({
            ok: false,
            message: "알 수 없는 오류가 발생했습니다."
        });
    }
});

module.exports = router;
