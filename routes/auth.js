const express = require('express');
const {v4: uuidv4} = require('uuid');

const DB = require('../common/database');
const dayjs = require('dayjs');
const MSG = require('../common/message');
const Util = require('../common/util');
const {isNotLoggedIn, isLoggedIn} = require('../common/middlewares');

const router = express.Router();

router.post('/login', isNotLoggedIn, async (req, res) => {
    const {username, password} = req.body;
    const deviceType = req.header('x-pocs-device-type')

    if (!username || !password || !deviceType) {
        return res.status(403).json(Util.getReturnObject(MSG.NO_REQUIRED_INFO, 403, {}));
    }

    try {
        const [user] = await DB.execute({
            psmt: `select * from USER where username = ?`,
            binding: [username]
        });

        if (!user) {
            return res.status(403).json(Util.getReturnObject(MSG.NO_USER_DATA, 403, {}));
        }

        if (user.password !== password) {
            return res.status(403).json(Util.getReturnObject('비밀번호가 틀렸습니다.', 403, {}));
        }

        const sessionToken = uuidv4();
        await DB.execute({
            psmt: `insert into SESSION (user_id, token, device_type, expiredAt ,created_at) VALUES(?, ?, ?, ?,NOW())`,
            binding: [user.user_id, sessionToken, deviceType, dayjs().add(90, 'day').toDate()]
        });

        console.log(userDetailInfo(user));

        return res.status(200).json(Util.getReturnObject('로그인 성공', 200, {sessionToken, user: userDetailInfo(user)}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(Util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {}));
    }
});

router.post('/logout', isLoggedIn, async (req, res, next) => {
    const sessionToken = req.header('x-pocs-session-token');

    // 추후 deviceType에 대한 필터링 추가
    // const deviceType = req.header('x-pocs-device-type');

    if (!sessionToken) {
        return res.status(403).json(Util.getReturnObject(MSG.NO_REQUIRED_INFO, 403, {}));
    }

    try {
        const [session] = await DB.execute({
            psmt: `select * from SESSION where token = ?`,
            binding: [sessionToken]
        });

        if (!session) {
            return res.status(403).json(Util.getReturnObject('해당 세션을 찾을 수 없습니다.', 403, {}));
        }

        if (dayjs().isAfter(dayjs(session.expiredAt || '1900-01-01'))) {
            return res.status(403).json(Util.getReturnObject('만료된 세션입니다.', 200, {}));
        }

        await DB.execute({
            psmt: `delete from SESSION where token = ?`,
            binding: [sessionToken],
        });

        return res.status(200).json(Util.getReturnObject('로그아웃 성공', 200, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(Util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {}));
    }
});

router.post('/validation', (req, res) => {
    const user = req.user;
    if (!!user) {
        return res.status(200).json(Util.getReturnObject('유효한 세션입니다.', 200, {user: userDetailInfo(user)}));
    } else {
        return res.status(403).json(Util.getReturnObject('유효하지 않은 세션입니다.', 403, {}));
    }
});

const userDetailInfo = user => {
    const {
        user_id,
        name,
        username,
        email,
        student_id,
        type,
        company,
        generation,
        github,
        created_at,
    } = user;

    if (!type) {
        return {
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
    } else {
        return {
            userId: user_id,
            defaultInfo : {
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
    }


}

module.exports = router;