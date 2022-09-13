const express = require('express');
const router = express.Router();
const {v4: uuidv4} = require('uuid');
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const sharp = require("sharp");

const DB = require('../common/database');
const MSG = require('../common/message')
const dayjs = require('dayjs')
const Util = require('../common/util');
const {isLoggedIn, isNotLoggedIn} = require('../common/middlewares');


const uploadProfile = multer({
    storage: multer.diskStorage({
        destination(req, file, cb) {
            cb(null, "public" + "/uploads/user/profile/")
        },
        filename(req, file, cb) {
            const ext = path.extname(file.originalname);
            cb(null, uuidv4() + ext); //v4 is uuid
        }
    })
});

router.patch('/:user_id/profile', isLoggedIn, uploadProfile.single("image"), async (req, res, next) => {

    const user = req.user;
    const userId = req.params.user_id;

    try {
        const [userDB] = await DB.execute({
            psmt: `select * from USER where user_id = ?`,
            binding: [userId]
        });

        if (user.user_id !== userDB.user_id) {
            return res.status(403).json(Util.getReturnObject(MSG.NO_AUTHORITY, 403, {}));
        }

        const file = req.file;

        if (!file) {
            return res.status(403).json(Util.getReturnObject('등록할 이미지가 없습니다.', 403, {}));
        }

        console.log(file);

        const image = sharp(file.path);
        const {format} = await image.metadata();
        const compressedImage = await image[format]({quality: 70}).toBuffer();
        fs.writeFileSync(file.path, compressedImage);

        const location = file.path.split("/")
        console.log("location: " + location);
        const uuid = location[location.length - 1].split(".")[0];
        console.log("uuid: " + uuid);
        console.log("uuid type: " + typeof(uuid));
        const mediaUrl = `http://34.64.161.55:8001/${file.destination}` + location.at(-1);
        console.log("mediaUrl: " + mediaUrl);

        await DB.execute({
            psmt: "update USER set profile_image_url = ? where user_id = ?",
            binding: [mediaUrl, user.user_id]
        });

        res.json({
            ok: true,
            userProfileId: uuid
        });
    } catch (error) {
        console.log(error);
        next();
    }
});

/* GET users list. */
router.get('/', isLoggedIn, async (req, res) => {

    const user = req.user;

    const sortOption = req.query.sort;
    const searchOption = decodeURI(req.query.search);
    const offset = Number(req.query.offset);
    const page = Number(req.query.pageNum);
    const start = (page - 1) * offset;

    try {

        if (user.type === null) {
            return res.status(403).json(Util.getReturnObject(MSG.NO_AUTHORITY, 403, {}));
        }

        if (isNaN(offset) || isNaN(page)) {
            return res.status(403).json(Util.getReturnObject(MSG.NO_REQUIRED_INFO, 403, {}));
        }

        let sql = `select * from USER where canceled_at is NULL and type is not null`;

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

        const [[userCount], usersDB] = await Promise.all([
            await DB.execute({
                psmt: `select count(user_id) as count from USER where type is not null and canceled_at is null`,
                binding: []
            }),
            await DB.execute({
                psmt: sql,
                binding: [start, offset]
            })
        ]);

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

            if (!type) {
                const usersObj = {
                    userId: user_id,
                    type: ((type) => {
                        if (!type) return 'anonymous';

                        switch (type) {
                            case 'admin':
                                return 'admin';
                            case 'member':
                                return 'member';
                            default:
                                return 'unknown';
                        }
                    })(type),
                    createdAt: dayjs(created_at).format('YYYY-MM-DD')
                }
                users.push(usersObj);
            } else {
                const usersObj = {
                    userId: user_id,
                    defaultInfo: {
                        name: name,
                        email: email,
                        studentId: student_id,
                        company: company || null,
                        generation: generation,
                        github: github || null
                    },
                    type: ((type) => {
                        if (!type) return 'anonymous';

                        switch (type) {
                            case 'admin':
                                return 'admin';
                            case 'member':
                                return 'member';
                            default:
                                return 'unknown';
                        }
                    })(type),
                    createdAt: dayjs(created_at).format('YYYY-MM-DD')
                }
                users.push(usersObj);
            }
        })

        const countAllUsers = userCount.count;
        res.status(200).json(Util.getReturnObject(MSG.READ_USERDATA_SUCCESS, 200, {users, countAllUsers}));
    } catch (e) {
        console.error(e);
        res.status(500).json(Util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {}));
    }
});

/* GET user detail */
router.get('/:user_id', isLoggedIn, async (req, res) => {

    const userId = req.params.user_id;
    const user = req.user;

    try {
        //비회원은 유저 목록 볼 수 없음
        if (user.type === null) {
            return res.status(403).json(Util.getReturnObject(MSG.NO_AUTHORITY, 403, {}));
        }

        const [userDB] = await DB.execute({
            psmt: `select * from USER where user_id = ? and type is NOT NULL`,
            binding: [userId]
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
            if (!type) {
                return res.status(200).json(Util.getReturnObject(`${name} ${MSG.READ_USER_SUCCESS}`, 200, {
                    userId: user_id,
                    type: ((type) => {
                        if (!type) return 'anonymous';

                        switch (type) {
                            case 'admin':
                                return 'admin';
                            case 'member':
                                return 'member';
                            default:
                                return 'unknown';
                        }
                    })(type),
                    createdAt: dayjs(created_at).format('YYYY-MM-DD')
                }))
            } else {
                return res.status(200).json(Util.getReturnObject(`${name} ${MSG.READ_USER_SUCCESS}`, 200, {
                    userId: user_id,
                    defaultInfo: {
                        name: name,
                        email: email,
                        studentId: student_id,
                        company: company || null,
                        generation: generation,
                        github: github || null
                    },
                    type: ((type) => {
                        if (!type) return 'anonymous';

                        switch (type) {
                            case 'admin':
                                return 'admin';
                            case 'member':
                                return 'member';
                            default:
                                return 'unknown';
                        }
                    })(type),
                    createdAt: dayjs(created_at).format('YYYY-MM-DD')
                }))
            }
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json(Util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {}));
    }
});

/* PATCH (edit) user info */
router.patch('/:user_id', isLoggedIn, uploadProfile.single("image"), async (req, res) => {

    const user = req.user;
    const userId = req.params.user_id;
    const body = req.body;
    const {email} = body;
    const {password} = body;

    const correctEmail = /^[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/;
    if (!email || !correctEmail.test(email)) {
        return res.status(403).json(Util.getReturnObject(MSG.WRONG_EMAIL, 403, {}));
    }

    try {
        const [userDB] = await DB.execute({
            psmt: `select * from USER where user_id = ?`,
            binding: [userId]
        });

        if (user.user_id !== userDB.user_id) {
            return res.status(403).json(Util.getReturnObject(MSG.NO_AUTHORITY, 403, {}));
        }

        if (userDB.canceled_at !== null) {
            return res.status(403).json(Util.getReturnObject(MSG.NO_USER_DATA, 403, {}));
        }

        if (!['admin', 'member'].includes(user.type)) {
            return res.status(403).json(Util.getReturnObject(MSG.NO_AUTHORITY, 403, {}));
        }

        if (!!password && password.length < 6) {
            return res.status(403).json(Util.getReturnObject('비밀번호는 최소 6자 이상이어야 합니다.', 403, {}));
        }

        if (!password) {
            var {sql, bindings} = (() => {
                let sql = `update USER set`;
                const bindings = [];
                ['name', 'email', 'github', 'company'].forEach(col => {
                    if (userDB[col] != body[col]) {
                        sql += ` ${col} = ?,`;
                        bindings.push(body[col]);
                    }
                });

                sql += ` updated_at = NOW() where user_id = ?;`;
                bindings.push(userId);

                return {bindings, sql};
            })(body);
        } else {
            var {sql, bindings} = (() => {
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
        }

        await DB.execute({
            psmt: sql,
            binding: bindings
        });

        return res.status(200).json(Util.getReturnObject(MSG.USER_UPDATE_SUCCESS, 200, {}));
    } catch (e) {
        return res.status(500).json(Util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {}));
    }
});


//비회원 회원가입
router.post('/', isNotLoggedIn, async (req, res) => {

    const {
        userName,
        password
    } = req.body

    try {
        if (!userName || !password) {
            return res.status(403).json(Util.getReturnObject(MSG.NO_REQUIRED_INFO, 403, {}));
        }

        if (password.length < 6) {
            return res.status(403).json(Util.getReturnObject('비밀번호는 최소 6자 이상이어야 합니다.', 403, {}));
        }

        const [checkUserName] = await DB.execute({
            psmt: `select user_id from USER where username = ?`,
            binding: [userName]
        });

        if (checkUserName !== null) {
            return res.status(403).json(Util.getReturnObject(MSG.EXIST_USERNAME, 403, {}));
        }
        await DB.execute({
            psmt: `insert into USER (username, password, created_at) VALUES(?, ?, NOW())`,
            binding: [userName, password]
        });

        return res.status(201).json(Util.getReturnObject(MSG.USER_ADDED, 201, {}));

    } catch (error) {
        console.log(error);
        return res.status(500).json(Util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {}));
    }
});

module.exports = router;