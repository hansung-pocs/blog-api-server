var express = require('express');
const DB = require('../common/database');
const dayjs = require('dayjs');
const Util = require('../common/util');
const MSG = require('../common/message');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});

// GET best post by views
router.get('/best', async (req, res) => {
    try {
        const postsDB = await DB.execute({
            psmt: `select post_id, name, title, content, views, p.created_at, p.updated_at, category from POST p, USER u WHERE u.user_id = p.user_id and p.canceled_at is NULL order by views DESC`,
            binding: []
        });

        const posts = [];
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
                views: views,
                title: title,
                content: content,
                createdAt: dayjs(created_at).format('YYYY-MM-DD'),
                updatedAt: ((updated_at) => {
                    if (!!updated_at) {
                        return dayjs(updated_at).format('YYYY-MM-DD')
                    }
                    return null;
                })(updated_at),
                category: category
            }

            posts.push(postsObj);
        })
        res.status(200).json(Util.getReturnObject(MSG.READ_POSTDATA_SUCCESS, 200, {posts}));
    } catch (error) {
        console.log(error);
        res.status(500).json(Util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {}));
    }
});


// category lists and count
router.get('/categories', async (req, res) => {

});


// posts list by category
router.get('/categories/:category', async (req, res) => {
    const category = req.params.category;

    try {
        const postsDB = await DB.execute({
            psmt: `select post_id, name, title, content, views, p.created_at, p.updated_at, category from POST p, USER u WHERE u.user_id = p.user_id and p.canceled_at is NULL and category = ? order by created_at DESC`,
            binding: [category]
        });

        const posts = [];
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
                views: views,
                title: title,
                content: content,
                createdAt: dayjs(created_at).format('YYYY-MM-DD'),
                updatedAt: ((updated_at) => {
                    if (!!updated_at) {
                        return dayjs(updated_at).format('YYYY-MM-DD')
                    }
                    return null;
                })(updated_at),
                category: category
            }

            posts.push(postsObj);
        })
        res.status(200).json(Util.getReturnObject(MSG.READ_POSTDATA_SUCCESS, 200, {posts}));
    } catch (error) {
        console.log(error);
        res.status(500).json(Util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {}));
    }
});




module.exports = router;