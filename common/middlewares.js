const DB = require('./database');
const Util = require("./util");

exports.deserializeUser = (async (req, res, next) => {
    const sessionToken = req.header('x-pocs-session-token');

    if (!sessionToken) {
        next();
        return;
    }

    try {
        const [user] = await DB.execute({
            psmt: 'select u.user_id, u.username, u.company, u.email, u.created_at, u.github, u.name, u.student_id, u.type' +
                ' from USER u left join SESSION s on u.user_id = s.user_id' +
                ' where s.token = ? and s.expiredAt > ?;',
            binding: [sessionToken, new Date()]
        });

        if (!user) {
            return res.status(403).json(Util.getReturnObject("없는 세션입니다.", 200, {}));
        }
        req.user = user;
        next();
    } catch (err) {
        next();
    }
})

exports.isLoggedIn = (req, res, next) => {
    if (!!req.user) {
        next();
    } else {
        return res.status(403).json(Util.getReturnObject("로그인이 필요합니다.", 403, {}));
    }
};

exports.isNotLoggedIn = (req, res, next) => {
    if (!req.user) {
        next();
    } else {
        return res.status(403).json(Util.getReturnObject("로그아웃이 필요합니다.", 403, {}));
    }
};

exports.isAdmin = (req, res, next) => {
    const user = req.user;
    if (!!user && user.type === 'admin') {
        next();
    } else {
    }
    return res.status(403).json(Util.getReturnObject('권한이 없습니다. 필요합니다.', 403, {}));
}