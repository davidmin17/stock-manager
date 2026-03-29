"use client";

import { useStockSearch } from "@/hooks/use-stock-search";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import type { StockInfo } from "@/types/stock";

interface StockSearchProps {
  onAnalyze: (stock: StockInfo) => void;
  isAnalyzing: boolean;
}

export function StockSearch({ onAnalyze, isAnalyzing }: StockSearchProps) {
  const { query, setQuery, results, selected, selectStock, clear } =
    useStockSearch();

  return (
    <div className="flex gap-3 items-start">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="종목명을 입력하세요... (예: 삼성전자, ㅅㅅ)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (selected) clear();
          }}
          className="pl-9 pr-9"
          disabled={isAnalyzing}
        />
        {query && (
          <button
            onClick={clear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {results.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
            {results.map((stock) => (
              <button
                key={stock.code}
                onClick={() => selectStock(stock)}
                className="w-full px-4 py-2 text-left hover:bg-accent flex justify-between items-center"
              >
                <span className="font-medium">{stock.name}</span>
                <span className="text-sm text-muted-foreground">
                  {stock.code} · {stock.market}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <Button
        onClick={() => selected && onAnalyze(selected)}
        disabled={!selected || isAnalyzing}
        size="lg"
      >
        {isAnalyzing ? "분석 중..." : "분석 시작"}
      </Button>
    </div>
  );
}
