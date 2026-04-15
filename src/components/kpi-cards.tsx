import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";

interface KPIData {
  cgnt: any;
  ocg: any;
}

export function KPICards({ data }: { data: KPIData }) {
  if (!data) return null;

  const renderCard = (ticker: string, stock: any) => {
    const isPositive = stock.changePercent >= 0;
    const ChangeIcon = isPositive ? ArrowUpRight : ArrowDownRight;
    const changeColor = isPositive ? "text-emerald-500" : "text-destructive";

    return (
      <Card className="bg-card/50 backdrop-blur-md border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            {ticker}
          </CardTitle>
          <Activity className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stock.price.toFixed(3)} <span className="text-sm font-normal text-muted-foreground">{stock.currency}</span>
          </div>
          <p className={`text-xs ${changeColor} flex items-center mt-1`}>
            {isPositive ? "+" : ""}{stock.changePercent.toFixed(2)}%
            <ChangeIcon className="h-3 w-3 ml-1" />
          </p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {renderCard("CGNT.V (TSX-V)", data.cgnt)}
      {renderCard("OCG.V (TSX-V)", data.ocg)}
      <Card className="bg-card/50 backdrop-blur-md border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            Volumen Combinado
          </CardTitle>
          <Activity className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {((data.cgnt.volume || 0) + (data.ocg.volume || 0)).toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Acciones negociadas hoy</p>
        </CardContent>
      </Card>
    </div>
  );
}
