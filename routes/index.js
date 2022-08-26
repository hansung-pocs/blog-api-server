const express = require('express');
const router = express.Router();
const DB = require('../common/database');
const dayjs = require('dayjs');
const MSG = require('../common/message');
const Util = require('../common/util');

/* GET home page. */
router.get('/', async (req, res) => {

    try {

        const categoryList = ['best', 'notice', 'knowhow', 'reference', 'memory', 'study', 'qna'];

        const posts = [];
        for (const categoryForBinding of categoryList) {
            const postDB = await DB.execute({
                psmt: `select * from POST where category = ? and canceled_at is NULL order by created_at DESC limit 0, 3;`,
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
                posts.push(postsObj);
            });
        }
        const categories = []
        const countDB = await DB.execute({
            psmt: `select category, count(category) as count from POST where canceled_at is null group by category`,
            binding: []
        })

        countDB.sort();
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
                        case 'qna':
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
    }
    catch (error){
            console.log(error);
            res.status(500).json(Util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {}));
        }
    }
)
    ;

    module.exports = router;