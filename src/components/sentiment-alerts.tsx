import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, TrendingUp, AlertTriangle } from "lucide-react";

export function SentimentAlerts() {
  const alerts = [
    {
      id: 1,
      type: "positive",
      message: "Pico de sentimiento positivo detectado en foros minoristas (Reddit/Discord) respecto a la movilización del tercer taladro.",
      time: "Hace 2 horas",
      icon: TrendingUp,
    },
    {
      id: 2,
      type: "neutral",
      message: "Institución Tier-1 navegando la sección ESG del proyecto Mocoa por más de 5 minutos.",
      time: "Hace 5 horas",
      icon: MessageSquare,
    },
    {
      id: 3,
      type: "warning",
      message: "Aumento de volatilidad en cotos de cobre a nivel macroeconómico.",
      time: "Ayer",
      icon: AlertTriangle,
    }
  ];

  const getBadgeVariant = (type: string) => {
    switch(type) {
      case "positive": return "default";
      case "warning": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <Card className="col-span-1 bg-card/50 backdrop-blur-md border-border">
      <CardHeader>
        <CardTitle className="text-xl">Inteligencia de Mercado (IA)</CardTitle>
        <CardDescription>Monitoreo de sentimiento en vivo sobre Copper Giant.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.map((alert) => {
          const Icon = alert.icon;
          return (
            <div key={alert.id} className="flex flex-col space-y-2 p-3 rounded-lg border border-border/50 bg-background/50 relative overflow-hidden group">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/20 group-hover:bg-primary transition-colors" />
              <div className="flex items-center justify-between">
                <Badge variant={getBadgeVariant(alert.type) as any} className="capitalize text-xs">
                  {alert.type}
                </Badge>
                <span className="text-xs text-muted-foreground">{alert.time}</span>
              </div>
              <p className="text-sm text-foreground/90 leading-snug flex gap-2">
                <Icon className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                {alert.message}
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
