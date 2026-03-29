import fs from "fs";
import path from "path";

interface StockEntry {
  code: string;
  name: string;
  market: "KOSPI" | "KOSDAQ";
}

async function fetchMarket(market: "STK" | "KSQ"): Promise<StockEntry[]> {
  const res = await fetch(
    "http://data.krx.co.kr/comm/bldAttend/getJsonData.cmd",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent": "Mozilla/5.0",
      },
      body: new URLSearchParams({
        bld: "dbms/MDC/STAT/standard/MDCSTAT01901",
        mktId: market,
        share: "1",
        csvxls_isNo: "false",
      }),
    }
  );
  const data = await res.json();
  return (data.OutBlock_1 || []).map((item: Record<string, string>) => ({
    code: item.ISU_SRT_CD,
    name: item.ISU_ABBRV,
    market: market === "STK" ? "KOSPI" : "KOSDAQ",
  }));
}

async function main() {
  console.log("Fetching KOSPI stocks...");
  const kospi = await fetchMarket("STK");
  console.log(`Got ${kospi.length} KOSPI stocks`);

  console.log("Fetching KOSDAQ stocks...");
  const kosdaq = await fetchMarket("KSQ");
  console.log(`Got ${kosdaq.length} KOSDAQ stocks`);

  const all = [...kospi, ...kosdaq].sort((a, b) =>
    a.code.localeCompare(b.code)
  );
  const outPath = path.join(process.cwd(), "data", "stock-codes.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(all, null, 2), "utf-8");
  console.log(`Saved ${all.length} stocks to ${outPath}`);
}

main().catch(console.error);
