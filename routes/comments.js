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
        const [nonePost] = await DB.execute({
            psmt: `select post_id, canceled_at from POST where post_id = ?`,
            binding: [postId]
        });

        if (!nonePost || nonePost.canceled_at !== null) {
            return res.status(404).json(Util.getReturnObject(MSG.NO_POST_DATA, 404, {}));
        }

        const [postDB] = await DB.execute({
            psmt: `select user_id from POST where post_id = ?`,
            binding: [postId]
        })

        // 비회원이 본인이 작성한 게시글이 아닌 것에 댓글을 추가하려고 하는 경우 (QNA에만 해당)
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
            await DB.execute({
                psmt: `insert into COMMENT (post_id, user_id, content, created_at) VALUES(?, ?, ?, NOW())`,
                binding: [postId, user.user_id, content]
            });

            const [updateParentId] = await DB.execute({
                psmt: `select comment_id from COMMENT where content = ?`,
                binding: [content]
            })

            await DB.execute({
                psmt: `update COMMENT set parent_id = ? where content = ?`,
                binding: [updateParentId.comment_id, content]
            });

            return res.status(201).json(Util.getReturnObject('댓글이 추가되었습니다.', 201, {}));
        }

    } catch (error) {
        console.error(error);
        res.status(500).json(Util.getReturnObject(MSG.UNKNOWN_ERROR, 500, {}));
    }
});


/* PATCH (delete) comment */




/* PATCH (edit) comment */




/* GET comments by postId */




module.exports = router;