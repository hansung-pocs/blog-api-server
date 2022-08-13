const express = require('express');
const dayjs = require('dayjs');
const {v4: uuidv4} = require('uuid');

const DB = require('../common/database');
const MSG = require('../common/message');
const util = require('../common/util');
const {isNotLoggedIn, isLoggedIn} = require('../common/middlewares');

const router = express.Router();

router.post('/login', isNotLoggedIn, async (req, res) => {
    const {username, password} = req.body;
    const deviceType = req.header('x-pocs-device-type')

    if (!username || !password || !deviceType) {
        return res.status(403).json(util.getReturnObject(MSG.NO_REQUIRED_INFO, 403, {}));
    }

    try {
        const [user] = await DB.execute({
            psmt: `select * from USER where username = ?`,
            binding: [username]
        });

        if (!user) {
            return res.status(403).json(util.getReturnObject(MSG.NO_USER_DATA, 403, {}));
        }

        if (user.password !== password) {
            return res.status(403).json(util.getReturnObject('비밀번호가 틀렸습니다.', 403, {}));
        }

        const sessionToken = uuidv4();
        await DB.execute({
            psmt: `insert into SESSION (user_id, token, device_type, expiredAt ,created_at) VALUES(?, ?, ?, ?,NOW())`,
            binding: [user.user_id, sessionToken, deviceType, dayjs().add(90, 'day').toDate()]
        });


        return res.status(200).json(util.getReturnObject('로그인 성공', 200, {sessionToken, ...userDetailInfo(user)}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {}));
    }
});

router.post('/logout', isLoggedIn, async (req, res, next) => {
    const sessionToken = req.header('x-pocs-session-token');

    // 추후 deviceType에 대한 필터링 추가
    // const deviceType = req.header('x-pocs-device-type');

    if (!sessionToken) {
        return res.status(403).json(util.getReturnObject(MSG.NO_REQUIRED_INFO, 403, {}));
    }

    try {
        const [session] = await DB.execute({
            psmt: `select * from SESSION where token = ?`,
            binding: [sessionToken]
        });

        if (!session) {
            return res.status(403).json(util.getReturnObject('해당 세션을 찾을 수 없습니다.', 403, {}));
        }

        if (dayjs().isAfter(dayjs(session.expiredAt || '1900-01-01'))) {
            return res.status(403).json(util.getReturnObject('만료된 세션입니다.', 200, {}));
        }

        await DB.execute({
            psmt: `delete from SESSION where token = ?`,
            binding: [sessionToken],
        });

        return res.status(200).json(util.getReturnObject('로그아웃 성공', 200, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {}));
    }
});

router.post('/validation', (req, res) => {
    const user = req.user;
    if (!!user) {
        return res.status(200).json(util.getReturnObject('유효한 세션입니다.', 200, {...userDetailInfo(user)}));
    } else {
        return res.status(403).json(util.getReturnObject('유효하지 않은 세션입니다.', 403, {}));
    }
});

const userDetailInfo = user => {
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
    } = user;

    return {
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
    }
}

module.exports = router;