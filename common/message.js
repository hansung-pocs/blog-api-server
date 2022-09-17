// USER-related MSG
const CANT_READ_USERDATA = '유저 목록을 불러올 수 없습니다.'
const READ_USERDATA_SUCCESS = '유저 목록을 조회합니다.'
const NO_USER_DATA = '없거나 탈퇴한 유저입니다.'
const READ_USER_SUCCESS = '님을 조회합니다.'
const USER_ADDED = '새로운 유저가 등록되었습니다.'
const USER_KICK_SUCCESS = '유저가 탈퇴 처리되었습니다.'
const USER_UPDATE_SUCCESS = '유저 정보가 업데이트되었습니다.'

// POST-related MSG
const CANT_READ_POSTDATA = '등록된 게시물이 없습니다.'
const READ_POSTDATA_SUCCESS = '게시글 목록을 조회합니다.'
const NO_POST_DATA = '없거나 삭제된 게시글입니다.'
const READ_POST_SUCCESS = '글을 조회합니다.'
const POST_ADDED = '게시글이 등록되었습니다.'
const POST_UPDATE_SUCCESS = '게시글 수정이 완료됐습니다.'
const POST_DELETE_SUCCESS = '게시글을 삭제하였습니다.'

// ERROR-related MSG
const UNKNOWN_ERROR = '알 수 없는 오류가 발생했습니다.'
const NO_CHANGED_INFO = '바뀔 값이 없습니다.'
const NO_AUTHORITY = '권한이 없습니다.'
const NO_REQUIRED_INFO = '필수 정보가 없습니다.'
const EXIST_EMAIL = '이미 존재하는 이메일입니다.'
const EXIST_USERNAME = '이미 존재하는 ID입니다.'
const EXIST_STUDENTID = '이미 존재하는 학번입니다.'
const WRONG_EMAIL = '잘못된 형식의 이메일입니다.'
const WRONG_STUDENTID = '잘못된 형식의 학번입니다.'
const WRONG_TYPE = '잘못된 형식의 유저 권한 등급입니다.'
const WRONG_CATEGORY = '잘못된 형식의 카테고리입니다.'
const NOT_YOUR_POST = '본인 글이 아닙니다.'

module.exports = {
    CANT_READ_USERDATA,
    CANT_READ_POSTDATA,
    READ_USERDATA_SUCCESS,
    NO_USER_DATA,
    NO_POST_DATA,
    READ_USER_SUCCESS,
    READ_POST_SUCCESS,
    UNKNOWN_ERROR,
    USER_UPDATE_SUCCESS,
    READ_POSTDATA_SUCCESS,
    NO_CHANGED_INFO,
    NO_AUTHORITY,
    NO_REQUIRED_INFO,
    POST_ADDED,
    POST_UPDATE_SUCCESS,
    USER_ADDED,
    POST_DELETE_SUCCESS,
    USER_KICK_SUCCESS,
    EXIST_EMAIL,
    EXIST_USERNAME,
    EXIST_STUDENTID,
    WRONG_EMAIL,
    WRONG_STUDENTID,
    WRONG_TYPE,
    WRONG_CATEGORY,
    NOT_YOUR_POST
}