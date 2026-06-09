// 사용자에게 그대로 노출해도 안전한 에러 (내부 정보 미포함).
// 라우트 catch에서 이 타입만 메시지를 클라이언트에 전달한다.
export class UserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserFacingError";
  }
}
