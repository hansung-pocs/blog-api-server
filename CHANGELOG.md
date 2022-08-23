## 2022-08-23
- 카테고리 목록 한글로 리턴
- 삭제되지 않은 답글이 존재하는 댓글의 경우 canceledAt 보내기

## 2022-08-22
- 댓글 삭제 후 댓글 목록 요청시 응답에 삭제된 댓글까지 존재함 문제 해결 (#16)
- PATCH /comments/{commentId} 요청시 501 응답 반환됨 문제 해결 (#15)
- 카테고리별 게시글 수 데이터 문제 해결 (#13)
- 댓글 CRUD 추가
  - 댓글 추가 시 같은 내용의 댓글 추가 금지
- 관리자 권한으로 사용자 목록 조회 데이터 문저 헤결 (#12)


## 2022-08-21
- GET /users 요청시 필수 정보가 null인 회원이 있음 (#11)
- countOfAllUsers가 offset만큼만 나오는 것을 전체 유저수가 나오도록 수정

## 2022-08-20
- GET /users/{userId} 요청시 500 에러 발생 문제 해결 (#8)
- GET /users 요청시 500 에러 발생 문제 해결 (#7)

**페이지네이션이 적용된 API를 전송할 때는 offset과 pageNum을 필수적으로 함께 전송해주셔야 합니다.**

페이지네이션이 적용된 API
1. GET /users
2. GET /posts
3. GET /admin/users
4. GET /admin/posts
5. GET /admin/posts/:userId
