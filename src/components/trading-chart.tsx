"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData, LineData, CandlestickSeries, AreaSeries } from "lightweight-charts";

interface TradingChartProps {
  data: any[];
  type?: "candle" | "area";
  height?: number;
}

export function TradingChart({ data, type = "candle", height = 400 }: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | ISeriesApi<"Area"> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chartOptions = {
      layout: {
        background: { type: ColorType.Solid, color: "#000000" },
        textColor: "#a1a1aa",
        fontFamily: "var(--font-geist-sans)",
      },
      grid: {
        vertLines: { color: "#1a1a1a" },
        horzLines: { color: "#1a1a1a" },
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
      timeScale: {
        borderColor: "#27272a",
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: "#27272a",
      },
      crosshair: {
        mode: 0,
        vertLine: {
          color: "#f91117",
          labelBackgroundColor: "#f91117",
        },
        horzLine: {
          color: "#f91117",
          labelBackgroundColor: "#f91117",
        },
      },
    };

    const chart = createChart(chartContainerRef.current, chartOptions);
    chartRef.current = chart;

    if (type === "candle") {
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: "#26a69a",
        downColor: "#ef5350",
        borderDownColor: "#ef5350",
        borderUpColor: "#26a69a",
        wickDownColor: "#ef5350",
        wickUpColor: "#26a69a",
      });
      candleSeries.setData(data as CandlestickData[]);
      seriesRef.current = candleSeries as any;
    } else {
      const areaSeries = chart.addSeries(AreaSeries, {
        lineColor: "#26a69a",
        topColor: "rgba(38, 166, 154, 0.4)",
        bottomColor: "rgba(38, 166, 154, 0)",
        lineWidth: 2,
      });
      areaSeries.setData(data.map(d => ({ time: d.time, value: d.close })) as LineData[]);
      seriesRef.current = areaSeries as any;
    }

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
  }, [data, type, height]);

  return <div ref={chartContainerRef} className="w-full h-full" />;
}
