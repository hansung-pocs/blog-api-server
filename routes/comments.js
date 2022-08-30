const express = require('express');
const router = express.Router();

const DB = require('../common/database');
const dayjs = require('dayjs');
const MSG = require('../common/message');
const Util = require('../common/util');
const {isLoggedIn} = require('../common/middlewares');


/* POST add new comment */
router.post('/', isLoggedIn, async (req, res) => {

    const user = req.user;
    const {
        postId,
        content,
        parentId
    } = req.body;

    try {
        // postId 또는 댓글에 입력한 내용이 없는 경우
        if (!postId || !content) {
            return res.status(400).json(Util.getReturnObject(MSG.NO_REQUIRED_INFO, 400, {}));
        }

        // postId가 잘못된 경우(DB에 없거나 삭제된 post_id를 전송한 경우), 404 -> 요청 리소스를 찾을 수 없음
        const [postDB] = await DB.execute({
            psmt: `select post_id, user_id, canceled_at from POST where post_id = ?`,
            binding: [postId]
        });

        if (!postDB || postDB.canceled_at !== null) {
            return res.status(404).json(Util.getReturnObject(MSG.NO_POST_DATA, 404, {}));
        }

        if (user.type === null && postDB.user_id !== user.user_id) {
            return res.status(400).json(Util.getReturnObject(MSG.NO_AUTHORITY, 400, {}));
        }

        // parentId가 DB에 없는 commentId를 입력했을 때 (자기참조외래키 조건을 만족시키기 위한 장치)
        if (!!parentId) {
            const [invalidParentId] = await DB.execute({
                psmt: `select post_id from COMMENT where comment_id = ?`,
                binding: [parentId]
            })

            if (!invalidParentId) {
                return res.status(400).json(Util.getReturnObject('유효하지 않은 parentId값입니다', 400, {}));
            } else {
                await DB.execute({
                    psmt: `insert into COMMENT (post_id, user_id, parent_id, content, created_at) VALUES(?, ?, ?, ?, NOW())`,
                    binding: [postId, user.user_id, parentId, content]
                });
                return res.status(201).json(Util.getReturnObject('대댓글이 작성되었습니다', 201, {}));
            }
        } else {
            // insert하면서 추가된 키 값 가져오기! (insertId)
            const newComment = await DB.execute({
                psmt: `insert into COMMENT (post_id, user_id, content, created_at) VALUES(?, ?, ?, NOW())`,
                binding: [postId, user.user_id, content]
            });

            await DB.execute({
                psmt: `update COMMENT set parent_id = ? where comment_id = ?`,
                binding: [newComment.insertId, newComment.insertId]
            });

            return res.status(201).json(Util.getReturnObject('댓글이 추가되었습니다.', 201, {}));
        }

    } catch (error) {
        console.error(error);
        res.status(500).json(Util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {}));
    }
});


/* PATCH (delete) comment */
router.patch('/:commentId/delete', isLoggedIn, async (req, res) => {

    const user = req.user;
    const commentId = req.params.commentId;

    try {
        // 잘못된 commentId를 전송한 경우
        const [commentDB] = await DB.execute({
            psmt: `select user_id, canceled_at from COMMENT where comment_id = ?`,
            binding: [commentId]
        });

        if (commentDB.canceled_at !== null) {
            return res.status(403).json(Util.getReturnObject('없거나 삭제된 댓글 입니다', 403, {}));
        }

        // 삭제를 요청한 사람이 댓글을 작성한 사람이나 관리자가 아닌 경우
        if (commentDB.user_id !== user.user_id && user.type != 'admin') {
            return res.status(403).json(Util.getReturnObject('본인이 작성한 댓글만 삭제할 수 있습니다.', 403, {}));
        }

        await DB.execute({
            psmt: `update COMMENT set canceled_at = NOW() where comment_id = ?`,
            binding: [commentId]
        });
        return res.status(201).json(Util.getReturnObject('댓글이 삭제되었습니다.', 201, {}));

    } catch (e) {
        console.error(e);
        return res.status(501).json(Util.getReturnObject(e.message, 501, {}));
    }
});


/* PATCH (edit) comment */
router.patch('/:comment_id', isLoggedIn, async (req, res) => {

    const user = req.user;
    const commentId = req.params.comment_id;
    const content = req.body.content;

    try {
        const [commentDB] = await DB.execute({
            psmt: `select * from COMMENT where comment_id = ?`,
            binding: [commentId]
        });

        if (commentDB.canceled_at !== null) {
            return res.status(400).json(Util.getReturnObject('없거나 삭제된 댓글입니다.', 400, {}));
        }
        if (commentDB.user_id !== user.user_id) {
            return res.status(400).json(Util.getReturnObject('해당 댓글을 수정할 수 없습니다.', 400, {}));
        }
        if (content === commentDB.content) {
            return res.status(400).json(Util.getReturnObject('수정된 내용이 없습니다.', 400, {}));
        }

        let sql = 'update COMMENT set';
        const bindings = [];

        if (!!content && commentDB.content != content) {
            sql += ' content = ?,';
            bindings.push(content);
        }

        if (bindings.length > 0) {
            sql += ' updated_at = NOW() where comment_id = ?;';
            bindings.push(commentId);

            await DB.execute({
                psmt: sql,
                binding: bindings
            });
        }
        return res.status(200).json(Util.getReturnObject('댓글이 정상적으로 수정되었습니다.', 200, {}));

    } catch (error) {
        console.error(error);
        return res.status(500).json(Util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {}));
    }
});


/* GET comments by postId */
router.get('/:postId', isLoggedIn, async (req, res) => {

    const user = req.user;
    const postId = req.params.postId;

    try {
        const [nonePost] = await DB.execute({
            psmt: `select canceled_at from POST where post_id = ?`,
            binding: [postId]
        });

        // 데이터에 없는 postId를 입력한 경우
        if (!nonePost || nonePost.canceled_at !== null) {
            return res.status(404).json(Util.getReturnObject(MSG.NO_POST_DATA, 404, {}));
        }

        const commentsDB = await DB.execute({
            psmt: `select comment_id, parent_id, c.user_id as user_id, name, post_id, content, c.created_at as created_at, c.updated_at as updated_at, c.canceled_at as canceled_at from COMMENT c, USER u where c.user_id = u.user_id and post_id = ? order by parent_id, c.created_at`,
            binding: [postId]
        });

        const commentsFilter = await Promise.all(
            commentsDB.map(
                async commentsDB => {
                    const {
                        comment_id,
                        parent_id,
                        user_id,
                        name,
                        post_id,
                        content,
                        created_at,
                        updated_at,
                        canceled_at
                    } = commentsDB;

                    // 삭제된 답글이면 건너뛰기
                    if (comment_id !== parent_id && canceled_at !== null) {
                        return;
                    }

                    const getCommentCount = async (comment_id, parent_id) => {
                        if (comment_id === parent_id) {
                            const [childrenCount] = await DB.execute({
                                psmt: `select count(comment_id) as childrenCount from COMMENT where parent_id = ? and parent_id != comment_id and canceled_at is null`,
                                binding: [parent_id]
                            })
                            return childrenCount.childrenCount;
                        } else {
                            return null;
                        }
                    };

                    return {
                        commentId: comment_id,
                        parentId: parent_id,
                        postId: post_id,
                        childrenCount: await getCommentCount(comment_id, parent_id),
                        writer: {
                            userId: user_id,
                            name: name
                        },
                        content: content,
                        createdAt: dayjs(created_at).format('YYYY-MM-DD'),
                        updatedAt: ((updated_at) => {
                            if (!!updated_at) {
                                return dayjs(updated_at).format('YYYY-MM-DD')
                            }
                            return null;
                        })(updated_at),
                        canceledAt: ((canceled_at) => {
                            if (!!canceled_at) {
                                return dayjs(canceled_at).format('YYYY-MM-DD')
                            }
                            return null;
                        })(canceled_at)
                    }
                }
            )
        );

        // 삭제된 답글과 답글이 안달린 삭제된 댓글은 보여지지 않도록
        function filterCanceledReply(item) {
            if (item == undefined || (item.comment_id === item.parent_id && item.childrenCount === 0)) {
                return false;
            }
            return true;
        }

        const comments = commentsFilter.filter(filterCanceledReply);

        res.status(200).json(Util.getReturnObject('댓글 목록 조회 성공', 200, {comments}));
    } catch (error) {
        console.log(error);
        res.status(500).json(Util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {}));
    }
});


module.exports = router;