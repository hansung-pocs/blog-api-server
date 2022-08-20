
## 220820
- GET /users/{userId} 요청시 500 에러 발생 문제 해결 (#8)
- GET /users 요청시 500 에러 발생 문제 해결 (#7)

**페이지네이션이 적용된 API를 전송할 때는 offset과 pageNum을 필수적으로 함께 전송해주셔야 합니다.**

페이지네이션이 적용된 API
1. GET /users
2. GET /posts
3. GET /admin/users
4. GET /admin/posts
5. GET /admin/posts/:userId
