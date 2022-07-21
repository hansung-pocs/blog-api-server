var express = require('express');
var router = express.Router();

// const DB = require("../common/database");

//https://day.js.org/docs/en/parse/string-format
const dayjs = require('dayjs')

/* GET users listing. */
// router.get('/', function (req, res, next) {
//     res.send('respond with a resource');
// });

router.get("/", (req, res) => {

    const notices = [{
        title: "공지사항 제목3",
        createdAt: "2022-07-07"
    }, {
        title: "공지사항 제목2",
        createdAt: "2022-07-06"
    }, {
        title: "공지사항 제목1",
        createdAt: "2022-07-05"
    }];

    res.json({
        notices
    });
});

router.post("/", (req, res) => {
    const body = req.body;
    const {title, content, userId} = body;

    console.log("body: %j", body);
    if (!title || !content || !userId) {
        res.status(400).json({
            message: "입력이 잘못되었습니다.",
            success: false
        });
    }

    if (userId != 1) {
        res.status(400).json({
            message: "권한이 없습니다.",
            success: false
        });
    }

    res.json({
        id: 1,
        success: true
    });
});

router.get("/:noticeId", (req, res) => {
    const noticeId = req.params.noticeId;
    if (noticeId != 1) {
        res.json({
            success: false,
            message: "해당 공지사항이 존재하지 않습니다."
        });
    }

    res.json({
        title: "공지사항 알립니다.",
        content: "유구한 역사와 전통에 빛나는 우리 대한국민은 3·1운동으로 건립된 대한민국임시정부의 법통과 불의에 항거한 4·19민주이념을 계승하고, 조국의 민주개혁과 평화적 통일의 사명에 입각하여 정의·인도와 동포애로써 민족의 단결을 공고히 하고, 모든 사회적 폐습과 불의를 타파하며, 자율과 조화를 바탕으로 자유민주적 기본질서를 더욱 확고히 하여 정치·경제·사회·문화의 모든 영역에 있어서 각인의 기회를 균등히 하고, 능력을 최고도로 발휘하게 하며, 자유와 권리에 따르는 책임과 의무를 완수하게 하여, 안으로는 국민생활의 균등한 향상을 기하고 밖으로는 항구적인 세계평화와 인류공영에 이바지함으로써 우리들과 우리들의 자손의 안전과 자유와 행복을 영원히 확보할 것을 다짐하면서 1948년 7월 12일에 제정되고 8차에 걸쳐 개정된 헌법을 이제 국회의 의결을 거쳐 국민투표에 의하여 개정한다.",
        createdAt: "2022-07-07",
        user: {
            id: 1,
            name: "홍길동"
        }
    });
})


module.exports = router;
