"use client";

import { useEffect, useRef } from "react";
import {
  createChart, ColorType, IChartApi, ISeriesApi,
  CandlestickData, LineData, CandlestickSeries, AreaSeries,
} from "lightweight-charts";

interface TradingChartProps {
  data:      any[];
  type?:     "candle" | "area";
  height?:   number;
  intraday?: boolean; // true → show HH:MM labels on x-axis
}

export function TradingChart({ data, type = "candle", height = 400, intraday = false }: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef          = useRef<IChartApi | null>(null);
  const seriesRef         = useRef<ISeriesApi<"Candlestick"> | ISeriesApi<"Area"> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#000000" },
        textColor: "#a1a1aa",
        fontFamily: "var(--font-geist-sans)",
      },
      grid: {
        vertLines: { color: "#1a1a1a" },
        horzLines: { color: "#1a1a1a" },
      },
      width:  chartContainerRef.current.clientWidth,
      height,
      timeScale: {
        borderColor:    "#27272a",
        timeVisible:    intraday,   // show HH:MM only for intraday
        secondsVisible: false,
        fixLeftEdge:    true,
        fixRightEdge:   true,
      },
      rightPriceScale: { borderColor: "#27272a" },
      crosshair: {
        mode: 0,
        vertLine: { color: "#f91117", labelBackgroundColor: "#f91117" },
        horzLine: { color: "#f91117", labelBackgroundColor: "#f91117" },
      },
    });

    chartRef.current = chart;

    if (type === "candle") {
      const s = chart.addSeries(CandlestickSeries, {
        upColor:        "#26a69a",
        downColor:      "#ef5350",
        borderUpColor:  "#26a69a",
        borderDownColor:"#ef5350",
        wickUpColor:    "#26a69a",
        wickDownColor:  "#ef5350",
      });
      s.setData(data as CandlestickData[]);
      seriesRef.current = s as any;
    } else {
      const s = chart.addSeries(AreaSeries, {
        lineColor:   "#f91117",
        topColor:    "rgba(249,17,23,0.4)",
        bottomColor: "rgba(249,17,23,0)",
        lineWidth: 2,
      });
      s.setData(data.map(d => ({ time: d.time, value: d.close })) as LineData[]);
      seriesRef.current = s as any;
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data, type, height, intraday]);

  return <div ref={chartContainerRef} className="w-full h-full" />;
}
