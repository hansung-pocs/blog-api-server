const express = require('express');
const router = express.Router();

const DB = require('../common/database');

const dayjs = require('dayjs');
const MSG = require('../common/message');
const Util = require('../common/util');
const {isLoggedIn} = require('../common/middlewares');

/* POST new post */
router.post('/', isLoggedIn, async (req, res) => {
    const {
        userId,
        title,
        content,
        category
    } = req.body;

    try {
        const [userDB] = await DB.execute({
            psmt: `select type from USER where user_id = ?`,
            binding: [userId]
        });

        const {type} = userDB;

        if (!userId || !title || !content || !category) {
            return res.status(403).json(Util.getReturnObject(MSG.NO_REQUIRED_INFO, 403, {}));
        }

        if (!['memory', 'notice', 'study', 'knowhow', 'reference', 'QNA'].includes(category)) {
            return res.status(403).json(Util.getReturnObject(MSG.WRONG_CATEGORY, 403, {}));
        }

        // 멤버인 사람이 공지를 남기거나
        // 비회원이 QNA아닌 글 쓸 경우
        if ((type === 'member' && category === 'notice') || ((!type) && category != 'QNA')) {
            return res.status(403).json(Util.getReturnObject(MSG.NO_AUTHORITY, 403, {}));
        }

        await DB.execute({
            psmt: `insert into POST (title, content, user_id, created_at, category) VALUES(?, ?, ?, NOW(), ?)`,
            binding: [title, content, userId, category]
        });

        return res.status(201).json(Util.getReturnObject(MSG.POST_ADDED, 201, {}));
    } catch (error) {
        console.error(error);
        res.status(500).json(Util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {}));
    }
});

/* GET posts list */
router.get('/', async (req, res) => {
    const filter = req.query.id;
    const offset = Number(req.query.offset);
    const page = Number(req.query.pageNum);
    const start = (page - 1) * offset;

    try {
        if(isNaN(offset) || isNaN(page)){
            return res.status(403).json(Util.getReturnObject(MSG.NO_REQUIRED_INFO, 403, {}));
        }

        let sql = `select post_id, name, title, content, views, p.created_at, p.updated_at, category from POST p, USER u WHERE u.user_id = p.user_id and p.canceled_at is NULL`;

        // id값이 없을 때 -> order by p.created_at DESC
        // id값에 잘못된 값이 들어왔을 때 -> res.status(400)....
        // 정상적인 id값: best, notice, memory, knowhow, reference, study

        if (filter == null) {
            sql += ` order by p.created_at DESC limit ?, ?;`;
        } else {
            if (filter === 'best') {
                sql += ` order by views DESC limit ?, ?;`;
            } else if (filter === 'notice' || filter === 'memory' || filter === 'knowhow' || filter === 'reference' || filter === 'study') {
                sql += ` and category = '${filter}' order by p.created_at DESC limit ?, ?;`;
            } else {
                return res.status(400).json(Util.getReturnObject('잘못된 id값입니다.', 400, {}));
            }
        }


        const postsDB = await DB.execute({
            psmt: sql,
            binding: [start, offset]
        });

        console.log('posts: %j', postsDB);

        const postsAll = [];
        postsDB.forEach(postsDB => {
            const {
                post_id,
                name,
                title,
                content,
                views,
                created_at,
                updated_at,
                category
            } = postsDB;

            const postsObj = {
                postId: post_id,
                writerName: name,
                title: title,
                content: content,
                views: views,
                createdAt: dayjs(created_at).format('YYYY-MM-DD'),
                updatedAt: ((updated_at) => {
                    if (!!updated_at) {
                        return dayjs(updated_at).format('YYYY-MM-DD')
                    }
                    return null;
                })(updated_at),
                category: category
            }
            postsAll.push(postsObj);
        });

        res.status(200).json(Util.getReturnObject(MSG.READ_POSTDATA_SUCCESS, 200, {postsAll}));
    } catch (error) {
        console.log(error);
        res.status(500).json(Util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {}));
    }
});

/* GET post detail */
router.get('/:postId', async (req, res) => {

    const postId = req.params.postId;

    try {
        const [nonePost] = await DB.execute({
            psmt: `select title from POST p, USER u where u.user_id = p.user_id and post_id = ?`,
            binding: [postId]
        });

        // 데이터에 없는 postId를 입력한 경우
        if (!nonePost) {
            return res.status(404).json(Util.getReturnObject(MSG.NO_POST_DATA, 404, {}));
        }

        await DB.execute({
            psmt: `update POST set views = views + 1 where post_id = ?`,
            binding: [postId]
        });

        const [postDB] = await DB.execute({
            psmt: `select title, content, views, p.created_at, p.updated_at, category, u.user_id, name, email, type, p.canceled_at from POST p, USER u where p.canceled_at is null and u.user_id = p.user_id and post_id = ?`,
            binding: [postId]
        });

        const {
            title,
            content,
            views,
            created_at,
            updated_at,
            category,
            user_id,
            name,
            email,
            type,
            canceled_at,
        } = postDB;

        if (!!canceled_at) {
            return res.status(403).json(Util.getReturnObject(MSG.NO_POST_DATA, 403, {}));
        }

        return res.status(200).json(Util.getReturnObject(`${title} ${MSG.READ_POST_SUCCESS}`, 200, {
            title: title,
            content: content,
            views: views,
            createdAt: dayjs(created_at).format('YYYY-MM-DD HH:mm:ss'),
            updatedAt: ((updated_at) => {
                if (!!updated_at) {
                    return dayjs(updated_at).format('YYYY-MM-DD HH:mm:ss')
                }
                return null;
            })(updated_at),
            category: category,
            writer: {
                userId: user_id,
                name: name,
                email: email,
                type: type
            }
        }));
    } catch (e) {
        console.error(e);
        return res.status(500).json(Util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {}));
    }
});


/* PATCH (edit) post info */
// router.patch('/:postId', isLoggedIn, async (req, res, next) => {
router.patch('/:postId', async (req, res, next) => {

    const {
        userId,
        title,
        content,
        category
    } = req.body

    const postId = req.params.postId;

    try {
        const [postDB] = await DB.execute({
            psmt: `select * from POST where post_id = ?`,
            binding: [postId]
        })

        if (postDB.canceled_at != null) {
            return res.status(403).json(Util.getReturnObject(MSG.NO_POST_DATA, 403, {}));
        }
        if (postDB.user_id !== userId) {
            return res.status(403).json(Util.getReturnObject(MSG.NOT_YOUR_POST, 403, {}));
        }
        if (category != 'memory' && category != 'notice' && category != 'study' && category != 'knowhow' && category != 'reference' && category != 'QNA') {
            return res.status(403).json(Util.getReturnObject(MSG.WRONG_CATEGORY, 403, {}));
        }

        let sql = 'update POST set';
        const bindings = [];

        if (!!title && postDB.title != title) {
            sql += ' title = ?,';
            bindings.push(title);
        }
        if (!!content && postDB.content != content) {
            sql += ' content = ?,';
            bindings.push(content);
        }
        if (!!category && postDB.category != category) {
            sql += ' category = ?,';
            bindings.push(category);
        }

        if (bindings.length > 0) {
            sql += ' updated_at = NOW() where post_id = ?;';
            bindings.push(postId);

            await DB.execute({
                psmt: sql,
                binding: bindings
            });
        }
        return res.status(302).json(Util.getReturnObject(MSG.POST_UPDATE_SUCCESS, 302, {}));

    } catch (e) {
        console.error(e);
        res.status(500).json(Util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {}));
    }
});

/* PATCH (delete) post */
//router.patch('/:postId/delete', isLoggedIn, async (req, res, next) => {
router.patch('/:postId/delete', async (req, res, next) => {
    const userId = req.body.userId;
    const postId = req.params.postId;
    try {
        const [[userDB], [postDB]] = await Promise.all([
            await DB.execute({
                psmt: `select type, user_id from USER where user_id = ?`,
                binding: [userId]
            }),
            await DB.execute({
                psmt: `select user_id, canceled_at from POST where post_id = ?`,
                binding: [postId]
            })
        ])
        if (postDB.canceled_at != null) {
            return res.status(403).json(Util.getReturnObject(MSG.NO_POST_DATA, 403, {}));
        }

        if (!userId) {
            return res.status(403).json(Util.getReturnObject(MSG.NO_REQUIRED_INFO, 403, {}));
        }

        if (userDB.type !== 'admin' && postDB.user_id !== userId) {
            return res.status(403).json(Util.getReturnObject(MSG.NOT_YOUR_POST, 403, {}));
        }

        await DB.execute({
            psmt: `update POST set canceled_at = NOW() where post_id = ?`,
            binding: [postId]
        });
        return res.status(201).json(Util.getReturnObject(MSG.POST_DELETE_SUCCESS, 201, {}));

    } catch (e) {
        console.error(e);
        return res.status(501).json(Util.getReturnObject(e.message, 501, {}));
    }
});

module.exports = router;