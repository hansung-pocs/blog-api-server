let express = require('express');
let router = express.Router();

const Util = require("../common/util");
const AdminRepo = require("../repository/admin");
const UserRepo = require("../repository/user");
const PostRepo = require("../repository/post");

router.get('/users', async (req, res) => {
    try {
        let ret = await UserRepo.getAllUsers({forAdmin:true});
        res.status(ret.status).json(ret);
    }
    
    catch (error) {
        console.log(error);

        console.log(error);
        res.status(500).json(
            Util.getReturnObject(error, 500, {})
        )
    }
});

router.post('/users', async (req, res) => {
    try {
        let ret = await AdminRepo.newUser({data : req.body});
        res.status(ret.status).json(ret);
    }
    
    catch (error) {
        console.log(error);
        res.status(500).json(
            Util.getReturnObject(error, 500, {})
        )
    }
})

router.get("users/:userId", async (req, res) => {
    const userId = req.params.userId;

    try {
        let user = await UserRepo.getUser({userId:userId, forAdmin:true});
        res.status(user.status).json(user);
        
    } catch (e) {
        console.log(e);
        res.status(500).json(
            Util.getReturnObject("알 수 없는 오류가 발생했습니다.", 500, {})
        )
    }
})

router.patch('/users/:userId/kick', async (req, res) => {
    const userId = req.params.userId;

    try {
        let result = await AdminRepo.kickUser({
            userId : userId
        })

        res.status(result.status).json(result);
    } catch(error) {
        console.log(error);
        res.status(500).json(
            Util.getReturnObject("알 수 없는 오류가 발생했습니다.", 500, {})
        )
    }
})

router.get('/posts', async (req, res) => {
    try {
        let ret = await PostRepo.getAllPosts({forAdmin:true});
        res.status(ret.status).json(ret);
    }
    
    catch (error) {
        console.log(error);
        res.status(500).json(
            Util.getReturnObject(error, 500, {})
        )
    }
});

router.get('/posts/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
        let ret = await AdminRepo.getPostsByUserID({userId:userId});
        res.status(ret.status).json(ret);
    }
    
    catch (error) {
        console.log(error);
        res.status(500).json(
            Util.getReturnObject(error, 500, {})
        )
    }
});



module.exports = router;
