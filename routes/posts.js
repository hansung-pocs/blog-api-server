const express = require('express');
const router = express.Router();

const DB = require('../common/database');
const MSG = require('../common/message');
const dayjs = require('dayjs');

/* POST new post */
router.post('/', async (req, res) => {
    const {
        title,
        content,
        userId,
        category
    } = req.body;
    try {
        const [userDB] = await DB.execute({
            psmt: `select type from USER where user_id = ?`,
            binding: [userId]
        });

        const {type = 'member'} = userDB;

        if (!userId || !title || !content || !category) {
            res.status(404).json({
                message: MSG.NO_REQUIRED_INFO,
                status: 404,
                servertime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                data: {}
            })
        } else if (category != 'memory' && category != 'notice' && category != 'study' && category != 'knowhow' && category != 'reference') {
            res.status(403).json({
                message: MSG.WRONG_CATEGORY,
                status: 403,
                servertime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                data: {}
            })
        } else {
            switch (type) {
                case 'member' : {
                    res.status(403).json({
                        message: MSG.NO_AUTHORITY,
                        status: 403,
                        servertime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                        data: {}
                    });
                }
                case 'admin': {
                    await DB.execute({
                        psmt: `insert into POST (title, content, user_id, created_at, category) VALUES(?,?,?,NOW(),?)`,
                        binding: [title, content, userId, category]
                    });

                    res.status(201).json({
                        message: MSG.POST_ADDED,
                        status: 201,
                        servertime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                        data: {}
                    });
                }
            }
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: MSG.UNKNOWN_ERROR,
            status: 500,
            servertime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            data: {}
        });
    }
})

/* GET posts list */
router.get('/', async (req, res) => {
    try {
        const postsDB = await DB.execute({
            psmt: `select post_id, username, title, content, p.created_at, p.updated_at, category from POST p, USER u WHERE u.user_id = p.user_id`,
            binding: []
        });

        console.log('posts: %j', postsDB);

        const posts = [];
        postsDB.forEach(postsDB => {
            const {
                post_id,
                username,
                title,
                content,
                created_at,
                updated_at,
                category
            } = postsDB;

            const postsObj = {
                postId: post_id,
                writerName: username,
                title: title,
                content: content,
                createdAt: dayjs(created_at).format('YYYY-MM-DD HH:mm:ss'),
                updatedAt: ((updated_at) => {
                    if (!!updated_at) {
                        return dayjs(updated_at).format('YYYY-MM-DD HH:mm:ss')
                    }
                    return null;
                })(updated_at),
                category: category
            }

            posts.push(postsObj);
        })

        res.status(200).json({
            message: MSG.READ_POSTDATA_SUCCESS,
            status: 200,
            servertime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            data: {
                posts
            }
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: MSG.UNKNOWN_ERROR,
            status: 500,
            servertime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            data: {}
        });
    }
})

/* GET post detail */
router.get('/:postId', async (req, res) => {
    const postId = req.params.postId;
    try {
        const [postDB] = await DB.execute({
            psmt: `select title, content, p.created_at, p.updated_at, category, u.user_id, username, email, type from POST p, USER u WHERE u.user_id = p.user_id and post_id = ?`,
            binding: [postId]
        });

        console.log('post: %j', postDB);
        if (!postDB) {
            res.status(404).json({
                message: MSG.NO_POST_DATA,
                status: 404,
                servertime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                data: {}
            });
        } else {
            const {
                title,
                content,
                created_at,
                updated_at,
                category,
                user_id,
                username,
                email,
                type
            } = postDB;

            res.status(200).json({
                message: `${title} ${MSG.READ_POST_SUCCESS}`,
                status: 200,
                servertime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                data: {
                    title: title,
                    content: content,
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
                        userName: username,
                        email: email,
                        type: type
                    }
                }
            });
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({
            message: MSG.UNKNOWN_ERROR,
            status: 500,
            servertime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            data: {}
        });
    }
})

/* PATCH (edit) post info */
router.patch('/:postId', async (req, res, next) => {

    const {
        userId,
        title,
        content,
        category
    } = req.body

    const postId = req.params.postId;

    try {
        const [userDB] = await DB.execute({
            psmt: `select type from USER where user_id = ?`,
            binding: [userId]
        });

        if (!userDB.type || userDB.type === 'member' || userDB.type === 'unknown') {
            res.status(403).json({
                message: MSG.NO_AUTHORITY,
                status: 403,
                servertime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                data: {}
            });
        } else if (userDB.type === 'admin') {
            let sql = 'update POST set';
            const bindings = [];

            if (!!title) {
                sql += ' title = ?,';
                bindings.push(title);
            }
            if (!!content) {
                sql += ' content = ?,';
                bindings.push(content);
            }
            if (!!category) {
                sql += ' category = ?,';
                bindings.push(category);
            }
            if (!!userId) {
                sql += ' user_id = ?,';
                bindings.push(userId);
            }
            sql += ' updated_at = NOW() where post_id = ?;';
            bindings.push(postId);

            const ret = await DB.execute({
                psmt: sql,
                binding: bindings
            });

            res.status(201).json({
                message: MSG.POST_UPDATE_SUCCESS,
                status: 201,
                servertime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                data: {
                    ret
                }
            });
        }

    } catch (e) {
        console.error(e);
        res.status(500).json({
            message: MSG.UNKNOWN_ERROR,
            status: 501,
            servertime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            data: {}
        });
    }
})

/* PATCH (delete) post */
router.patch('/:postId/delete', async (req, res, next) => {
    const userId = req.body.userId;
    const postId = req.params.postId;
    try {
        const [userDB] = await DB.execute({
            psmt: `select type from USER where user_id = ?`,
            binding: [userId]
        });

        if (!userDB.type || userDB.type === 'member' || userDB.type === 'unknown') {
            res.status(403).json({
                message: MSG.NO_AUTHORITY,
                status: 403,
                servertime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                data: {}
            });
        } else if (userDB.type === 'admin') {
            await DB.execute({
                psmt: `update POST set canceled_at = NOW() where post_id = ?`,
                binding: [postId]
            });

            res.status(201).json({
                message: MSG.POST_DELETE_SUCCESS,
                status: 201,
                servertime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                data: {}
            });
        }

    } catch (e) {
        console.error(e);
        res.status(501).json({
            message: e.message,
            status: 501,
            servertime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            data: {}
        });
    }
})



// notice



module.exports = router;