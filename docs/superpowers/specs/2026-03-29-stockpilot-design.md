# StockPilot Design Spec

> 전체 설계는 프로젝트 루트의 `CLAUDE.md`에 상세히 기술되어 있음.
> 이 문서는 구현 시 참고할 핵심 결정 사항만 정리.

## 핵심 결정 사항

1. **KIS_ACCOUNT_NO, KIS_HTS_ID 제거** — 시세 조회 API만 사용하므로 계좌 정보 불필요
2. **TDD 미적용** — 외부 API 연동(KIS, Gemini)이 핵심이므로 mocking 기반 테스트 대신 실제 API 호출로 검증
3. **Phase 분리** — Phase 1+2 (기반+에이전트) → Phase 3+4 (UI+완성) 순차 진행
4. **종목코드 데이터** — KRX에서 전종목 데이터를 JSON으로 준비 (빌드 시 정적 포함)
5. **Gemini 모델** — `gemini-2.5-pro-preview-05-06` 사용 (CLAUDE.md의 gemini-3.1-pro-preview는 placeholder)
