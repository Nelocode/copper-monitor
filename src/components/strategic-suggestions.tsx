import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Lightbulb, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StrategicSuggestions() {
  return (
    <Alert className="bg-primary/5 border-primary/20 mt-6 lg:col-span-3">
      <Lightbulb className="h-5 w-5 text-primary" />
      <AlertTitle className="text-lg font-semibold text-primary">Sugerencia Estratégica AI</AlertTitle>
      <AlertDescription className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-muted-foreground leading-relaxed">
          Basado en el volumen de negociación reciente y la liquidez actual del mercado (promedio subiendo un 12% en OCG.V), 
          se recomienda publicar el comunicado de prensa de actualización de <strong>La Estrella / Mocoa</strong> mañana a las <strong>08:30 AM EST</strong> para maximizar el impacto en foros minoristas e inversores institucionales.
        </p>
        <Button variant="outline" className="shrink-0 border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground">
          Revisar Borrador <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  );
}
