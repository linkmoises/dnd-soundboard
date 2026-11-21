"use client";

import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type CreditBadgeProps = {
  name: string;
  children: ReactNode;
};

/** Badge circular de créditos, compartido por las tarjetas de todas las columnas. */
export const CreditBadge = ({ name, children }: CreditBadgeProps) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 rounded-full border border-border/60 bg-background/70 text-muted-foreground opacity-80 backdrop-blur hover:text-foreground hover:opacity-100"
          aria-label={`Ver crédito de ${name}`}
        >
          <Info size={12} />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{children}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export default CreditBadge;
