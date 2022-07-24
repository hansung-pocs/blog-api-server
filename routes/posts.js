let express = require('express');
let router = express.Router();

const Util = require("../common/util");
const PostRepo = require("../repository/post");

router.get('/', async (req, res) => {
    try {
        let ret = await PostRepo.getAllPosts({forAdmin:false});
        res.status(ret.status).json(ret);
    }
    
    catch (error) {
        console.log(error);
        res.status(500).json(
            Util.getReturnObject(error, 500, {})
        )
    }
});

router.post('/', async (req, res) => {
    try {
        let ret = await PostRepo.newPost({data : req.body})
        res.status(ret.status).json(ret);
    } catch(error){
        console.log(error);
        res.status(500).json(
            Util.getReturnObject(error, 500, {})
        )
    }
})

router.get("/:postId", async (req, res) => {
    const postId = req.params.postId;

    try {
        let user = await PostRepo.getPost({postId:postId, forAdmin:false});
        res.status(user.status).json(user);
        
    } catch (e) {
        console.log(e);
        res.status(500).json(
            Util.getReturnObject("알 수 없는 오류가 발생했습니다.", 500, {})
        )
    }
});

router.patch('/:postId', async (req, res) => {
    const postId = req.params.postId;

    try {
        let result = await PostRepo.editPost({
            postId : postId,
            data : req.body
        })

        res.status(result.status).json(result);
    } catch(error) {
        console.log(error);
        res.status(500).json(
            Util.getReturnObject("알 수 없는 오류가 발생했습니다.", 500, {})
        )
    }
});

router.patch('/:postId/delete', async (req, res) => {
    const postId = req.params.postId;

    try {
        let result = await PostRepo.deletePost({
            postId : postId
        })

        res.status(result.status).json(result);
    } catch(error) {
        console.log(error);
        res.status(500).json(
            Util.getReturnObject("알 수 없는 오류가 발생했습니다.", 500, {})
        )
    }
});


module.exports = router;
