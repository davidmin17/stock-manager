"use client";

import { useState, useEffect, useRef } from "react";
import type { StockInfo } from "@/types/stock";

export function useStockSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StockInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<StockInfo | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim() || selected) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data: StockInfo[] = await res.json();
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, selected]);

  const selectStock = (stock: StockInfo) => {
    setSelected(stock);
    setQuery(stock.name);
    setResults([]);
  };

  const clear = () => {
    setQuery("");
    setSelected(null);
    setResults([]);
  };

  return { query, setQuery, results, isLoading, selected, selectStock, clear };
}
