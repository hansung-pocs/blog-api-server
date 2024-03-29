const express = require('express');
const router = express.Router();

const DB = require('../common/database');
const dayjs = require('dayjs');
const MSG = require('../common/message');
const Util = require('../common/util');
const {isLoggedIn} = require('../common/middlewares');


/* GET home page. */
router.get('/', isLoggedIn, async (req, res) => {

    const user = req.user;

    try {
        const categoryList = ['notice', 'knowhow', 'reference', 'memory', 'study', 'qna'];

        if (user.type === null) {
            var sql1 = `select post_id, name, title, content, views, only_member, p.created_at as created_at, p.updated_at as updated_at, category from POST p, USER u where p.user_id = u.user_id and p.canceled_at is NULL and only_member is false order by views DESC limit 0, 3`;
        } else if (user.type === 'admin' || user.type === 'member') {
            var sql1 = `select post_id, name, title, content, views, only_member, p.created_at as created_at, p.updated_at as updated_at, category from POST p, USER u where p.user_id = u.user_id and p.canceled_at is NULL order by views DESC limit 0, 3`;
        }

        const bestPostDB = await DB.execute({
            psmt: sql1,
            binding: []
        })

        const bestPosts = [];

        bestPostDB.forEach(bestPostDB => {
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
            } = bestPostDB;

            const bestPostsObj = {
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
            bestPosts.push(bestPostsObj);
        })

        const noticePosts = [];
        const knowhowPosts = [];
        const referencePosts = [];
        const memoryPosts = [];
        const studyPosts = [];
        const qnaPosts = [];

        if (user.type === null) {
            var sql2 = `select post_id, name, title, content, views, only_member, p.created_at as created_at, p.updated_at as updated_at, category from POST p, USER u where category = ? and p.canceled_at is NULL and only_member is false order by created_at DESC limit 0, 3;`;
        } else if (user.type === 'admin' || user.type === 'member') {
            var sql2 = `select post_id, name, title, content, views, only_member, p.created_at as created_at, p.updated_at as updated_at, category from POST p, USER u where category = ? and p.canceled_at is NULL order by created_at DESC limit 0, 3;`;
        }

        for (const categoryForBinding of categoryList) {
            const postDB = await DB.execute({
                psmt: sql2,
                binding: [categoryForBinding]
            })

            postDB.forEach(postDB => {
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
                } = postDB;

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
                if (category === 'notice') {
                    noticePosts.push(postsObj);
                }
                if (category === 'knowhow') {
                    knowhowPosts.push(postsObj);
                }
                if (category === 'reference') {
                    referencePosts.push(postsObj);
                }
                if (category === 'memory') {
                    memoryPosts.push(postsObj);
                }
                if (category === 'study') {
                    studyPosts.push(postsObj);
                }
                if (category === 'qna') {
                    qnaPosts.push(postsObj);
                }
            });
        }

        res.status(200).json(Util.getReturnObject(MSG.READ_POSTDATA_SUCCESS, 200, {
            bestPosts, noticePosts, knowhowPosts, referencePosts, memoryPosts, studyPosts, qnaPosts
        }));
    } catch (error) {
        console.log(error);
        res.status(500).json(Util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {}));
    }
});

module.exports = router;