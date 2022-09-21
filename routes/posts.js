const express = require('express');
const router = express.Router();

const DB = require('../common/database');
const dayjs = require('dayjs');
const MSG = require('../common/message');
const Util = require('../common/util');
const {isLoggedIn} = require('../common/middlewares');

const categoryList = ['memory', 'notice', 'study', 'knowhow', 'reference', 'qna'];

/* POST new post */
router.post('/', isLoggedIn, async (req, res) => {

    const user = req.user;
    const {
        onlyMember,
        title,
        content,
        category
    } = req.body;

    try {
        if (!title || !content || !category || onlyMember == undefined) {
            return res.status(403).json(Util.getReturnObject(MSG.NO_REQUIRED_INFO, 403, {}));
        }

        if (!categoryList.includes(category)) {
            return res.status(403).json(Util.getReturnObject(MSG.WRONG_CATEGORY, 403, {}));
        }

        // 일반 회원이 카테고리가 notice인 게시글의 추가를 요청하거나 비회원 유저가 카테고리가 qna가 아닌 게시글의 추가를 요청한 경우
        if ((user.type === 'member' && category === 'notice') || ((!user.type) && category !== 'qna')) {
            return res.status(403).json(Util.getReturnObject(MSG.NO_AUTHORITY, 403, {}));
        }

        await DB.execute({
            psmt: `insert into POST (title, content, user_id, only_member, created_at, category) VALUES(?, ?, ?, ?, NOW(), ?)`,
            binding: [title, content, user.user_id, onlyMember, category]
        });

        return res.status(201).json(Util.getReturnObject(MSG.POST_ADDED, 201, {}));
    } catch (error) {
        console.error(error);
        res.status(500).json(Util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {}));
    }
});


/* GET posts list */
router.get('/', isLoggedIn, async (req, res) => {

    const user = req.user;

    const filter = req.query.id;
    const offset = Number(req.query.offset);
    const page = Number(req.query.pageNum);
    const title = decodeURI(req.query.title);
    const start = (page - 1) * offset;

    try {
        if (isNaN(offset) || isNaN(page)) {
            return res.status(403).json(Util.getReturnObject(MSG.NO_REQUIRED_INFO, 403, {}));
        }

        if (!user.type) {
            var sql = `select post_id, name, title, content, views, only_member, p.created_at, p.updated_at, category from POST p, USER u where u.user_id = p.user_id and p.canceled_at is NULL and only_member is false`;
        } else {
            var sql = `select post_id, name, title, content, views, only_member, p.created_at, p.updated_at, category from POST p, USER u where u.user_id = p.user_id and p.canceled_at is NULL`;
        }

        if (title != "undefined") {
            sql += ` and title like '%${title}%'`
        }

        if (filter == null) {
            sql += ` order by p.created_at DESC limit ?, ?;`;
        } else {
            if (filter === 'best') {
                sql += ` order by views DESC limit ?, ?;`;
            } else if (categoryList.includes(filter)) {
                sql += ` and category = '${filter}' order by p.created_at DESC limit ?, ?;`;
            } else {
                return res.status(400).json(Util.getReturnObject('잘못된 id값입니다.', 400, {}));
            }
        }

        const [postsDB, countDB] = await Promise.all([
            await DB.execute({
                psmt: sql,
                binding: [start, offset]
            }),
            await DB.execute({
                psmt: `select category, count(category) as count from POST where canceled_at is null group by category`,
                binding: []
            })
        ])

        countDB.sort();

        const posts = [];
        postsDB.forEach(postsDB => {
            const {
                post_id,
                name,
                title,
                content,
                views,
                only_member,
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
                onlyMember: !!only_member,
                createdAt: dayjs(created_at).format('YYYY-MM-DD'),
                updatedAt: ((updated_at) => {
                    if (!!updated_at) {
                        return dayjs(updated_at).format('YYYY-MM-DD')
                    }
                    return null;
                })(updated_at),
                category: (category)
            }
            posts.push(postsObj);
        });

        const categories = []
        countDB.forEach(countDB => {
            const {
                category,
                count
            } = countDB

            const categoriesObj = {
                category: ((category) => {
                    if (!category) return 'error';

                    switch (category) {
                        case 'best':
                            return '인기글';
                        case 'notice':
                            return '공지사항';
                        case 'knowhow':
                            return '노하우';
                        case 'reference':
                            return '추천';
                        case 'memory':
                            return '추억';
                        case 'study':
                            return '스터디';
                        case 'qna' || 'QNA' :
                            return 'qna';
                        default:
                            return 'error';
                    }
                })(category),
                count: count
            }
            categories.push(categoriesObj)
        })

        res.status(200).json(Util.getReturnObject(MSG.READ_POSTDATA_SUCCESS, 200, {categories, posts}));
    } catch (error) {
        console.log(error);
        res.status(500).json(Util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {}));
    }
});

/* GET post detail */
router.get('/:postId', isLoggedIn, async (req, res) => {

    const user = req.user;
    const postId = req.params.postId;

    try {

        // const [[nonePost], [postDB]] = await Promise.all([
        //     await DB.execute({
        //         psmt: `select title, canceled_at from POST where post_id = ?`,
        //         binding: [postId]
        //     }),
        //     await DB.execute({
        //         psmt: `select title, content, views, only_member, p.created_at, p.updated_at, category, u.user_id, name, email, type, p.canceled_at from POST p, USER u where p.canceled_at is null and u.user_id = p.user_id and post_id = ?`,
        //         binding: [postId]
        //     })
        // ])

        const [postDB] = await DB.execute({
            psmt: ' select title, content, views, only_member, p.created_at as created_at, p.updated_at as updated_at, ' +
                'category, u.user_id as user_id, name, email, type, p.canceled_at as canceled_at ' +
                'from POST p, USER u where p.canceled_at is null and u.user_id = p.user_id and post_id = ?;',
            binding: [postId]
        })

        // 데이터에 없는 postId를 입력한 경우
        if (!postDB || postDB.canceled_at !== null) {
            return res.status(404).json(Util.getReturnObject(MSG.NO_POST_DATA, 404, {}));
        }

        if (user.type === null && postDB.only_member) {
            return res.status(403).json(Util.getReturnObject(MSG.NO_AUTHORITY, 403, {}));
        }

        await DB.execute({
            psmt: `update POST set views = views + 1 where post_id = ?`,
            binding: [postId]
        });

        const {
            title,
            content,
            views,
            only_member,
            created_at,
            updated_at,
            category,
            user_id,
            name,
            email,
            type
        } = postDB;

        return res.status(200).json(Util.getReturnObject(`${title} ${MSG.READ_POST_SUCCESS}`, 200, {
            title: title,
            content: content,
            views: views,
            onlyMember: !!only_member,
            createdAt: dayjs(created_at).format('YYYY-MM-DD HH:mm:ss'),
            updatedAt: ((updated_at) => {
                if (!!updated_at) {
                    return dayjs(updated_at).format('YYYY-MM-DD HH:mm:ss')
                }
                return null;
            })(updated_at),
            category: (category),
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
router.patch('/:postId', isLoggedIn, async (req, res, next) => {

    const user = req.user;
    const {
        title,
        content,
        category,
        onlyMember
    } = req.body

    const postId = req.params.postId;

    try {
        if (!title || !content || !category || onlyMember == undefined) {
            return res.status(403).json(Util.getReturnObject(MSG.NO_REQUIRED_INFO, 403, {}));
        }

        const [postDB] = await DB.execute({
            psmt: `select * from POST where post_id = ?`,
            binding: [postId]
        })

        if (postDB.user_id !== user.user_id) {
            return res.status(403).json(Util.getReturnObject(MSG.NOT_YOUR_POST, 403, {}));
        }
        if (!postDB || postDB.canceled_at !== null) {
            return res.status(403).json(Util.getReturnObject(MSG.NO_POST_DATA, 403, {}));
        }
        if (!categoryList.includes(category)) {
            return res.status(403).json(Util.getReturnObject(MSG.WRONG_CATEGORY, 403, {}));
        }

        let sql = 'update POST set';
        const bindings = [];

        if (postDB.title !== title) {
            sql += ' title = ?,';
            bindings.push(title);
        }
        if (postDB.content !== content) {
            sql += ' content = ?,';
            bindings.push(content);
        }
        if (postDB.category !== category) {
            sql += ' category = ?,';
            bindings.push(category);
        }

        //if ((onlyMember === true || onlyMember === false) && postDB.only_member !== onlyMember) {
        if (postDB.only_member !== onlyMember) {
            sql += ' only_member = ?,';
            bindings.push(onlyMember);
        }

        if (bindings.length > 0) {
            sql += ' updated_at = NOW() where post_id = ?;';
            bindings.push(postId);

            await DB.execute({
                psmt: sql,
                binding: bindings
            });
        }
        return res.status(200).json(Util.getReturnObject(MSG.POST_UPDATE_SUCCESS, 200, {}));

    } catch (e) {
        console.error(e);
        res.status(500).json(Util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {}));
    }
});


/* PATCH (delete) post */
router.patch('/:postId/delete', isLoggedIn, async (req, res, next) => {

    const user = req.user;
    const postId = req.params.postId;

    try {
        const [postDB] = await DB.execute({
            psmt: `select user_id, canceled_at from POST where post_id = ?`,
            binding: [postId]
        })

        if (!postDB || postDB.canceled_at !== null) {
            return res.status(403).json(Util.getReturnObject(MSG.NO_POST_DATA, 403, {}));
        }

        if (user.type !== 'admin' && postDB.user_id !== user.user_id) {
            return res.status(403).json(Util.getReturnObject(MSG.NOT_YOUR_POST, 403, {}));
        }

        await DB.execute({
            psmt: `update POST set canceled_at = NOW() where post_id = ?`,
            binding: [postId]
        });

        return res.status(200).json(Util.getReturnObject(MSG.POST_DELETE_SUCCESS, 200, {}));

    } catch (e) {
        console.error(e);
        return res.status(501).json(Util.getReturnObject(MSG.UNKNOWN_ERROR, 501, {}));
    }
});

module.exports = router;