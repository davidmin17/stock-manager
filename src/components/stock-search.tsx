"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useStockSearch } from "@/hooks/use-stock-search";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Loader2 } from "lucide-react";
import type { StockInfo } from "@/types/stock";

interface StockSearchProps {
  onAnalyze: (stock: StockInfo) => void;
  isAnalyzing: boolean;
}

export function StockSearch({ onAnalyze, isAnalyzing }: StockSearchProps) {
  const { query, setQuery, results, selected, selectStock, clear } =
    useStockSearch();
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);

  const handleSelect = useCallback(
    (stock: StockInfo) => {
      selectStock(stock);
      setHighlightIndex(-1);
    },
    [selectStock]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) {
      if (e.key === "Enter" && selected) {
        onAnalyze(selected);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightIndex >= 0 && highlightIndex < results.length) {
          handleSelect(results[highlightIndex]);
        }
        break;
      case "Escape":
        setHighlightIndex(-1);
        clear();
        break;
    }
  };

  useEffect(() => {
    if (highlightIndex < 0 || !listRef.current) return;
    const items = listRef.current.querySelectorAll("[data-item]");
    items[highlightIndex]?.scrollIntoView({ block: "nearest" });
  }, [highlightIndex]);

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="종목명 또는 종목코드 검색 (예: 삼성전자, ㅅㅅ)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlightIndex(-1);
            if (selected) clear();
          }}
          onKeyDown={handleKeyDown}
          className="pl-9 pr-9 h-11 bg-muted/30 border-border/50 focus:bg-background transition-colors"
          disabled={isAnalyzing}
        />
        {query && (
          <button
            onClick={() => {
              clear();
              setHighlightIndex(-1);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {results.length > 0 && (
          <div
            ref={listRef}
            className="absolute z-50 w-full mt-1 bg-popover border border-border/50 rounded-lg shadow-xl max-h-60 overflow-auto backdrop-blur-sm"
          >
            {results.map((stock, i) => (
              <button
                key={stock.code}
                data-item
                onClick={() => handleSelect(stock)}
                className={`w-full px-4 py-2.5 text-left flex justify-between items-center transition-colors ${
                  i === highlightIndex
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                }`}
              >
                <span className="font-medium">{stock.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-mono">
                    {stock.code}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                    {stock.market}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <Button
        onClick={() => selected && onAnalyze(selected)}
        disabled={!selected || isAnalyzing}
        size="lg"
        className="h-11 px-6 shrink-0"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            분석 중...
          </>
        ) : (
          "분석 시작"
        )}
      </Button>
    </div>
  );
}
