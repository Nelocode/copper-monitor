"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function StockChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) return null;

  return (
    <Card className="col-span-1 lg:col-span-2 bg-card/50 backdrop-blur-md border-border">
      <CardHeader>
        <CardTitle className="text-xl">Comportamiento del Precio (Histórico)</CardTitle>
        <CardDescription>Consolidación de precio base y proyecciones recientes.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c86a3e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#c86a3e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#a1a1aa" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                stroke="#a1a1aa" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => `$${value.toFixed(2)}`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#121214', borderColor: '#27272a', borderRadius: '8px' }}
                itemStyle={{ color: '#fafafa' }}
                labelStyle={{ color: '#a1a1aa' }}
                formatter={(value: number) => [`$${value.toFixed(3)}`, 'Precio']}
                labelFormatter={(label) => new Date(label).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
              />
              <Area 
                type="monotone" 
                dataKey="price" 
                stroke="#c86a3e" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorPrice)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
