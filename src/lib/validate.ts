/** 종목코드 검증 (6자리 숫자) */
export function isValidStockCode(code: unknown): code is string {
  return typeof code === "string" && /^\d{6}$/.test(code);
}

/** 종목명 검증 (1-50자, 한글/영문/숫자/공백/특수문자 일부만 허용) */
export function isValidStockName(name: unknown): name is string {
  return (
    typeof name === "string" &&
    name.length >= 1 &&
    name.length <= 50 &&
    /^[가-힣a-zA-Z0-9\s.&()]+$/.test(name)
  );
}
