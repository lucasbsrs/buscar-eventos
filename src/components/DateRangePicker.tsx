"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, X } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  from?: string; // yyyy-MM-dd
  to?: string;   // yyyy-MM-dd
  onChange: (from: string, to: string) => void;
}

function toDate(str?: string): Date | undefined {
  return str ? new Date(str + "T00:00:00") : undefined;
}

export function DateRangePicker({ from, to, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Seleção em andamento — isolada da URL até estar completa
  const [localRange, setLocalRange] = useState<DateRange | undefined>({
    from: toDate(from),
    to: toDate(to),
  });

  // Sincroniza com a URL quando muda externamente (ex: limpar filtros)
  useEffect(() => {
    setLocalRange({ from: toDate(from), to: toDate(to) });
  }, [from, to]);

  // Fecha ao clicar fora; descarta seleção parcial
  useEffect(() => {
    if (!open) return;
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setLocalRange({ from: toDate(from), to: toDate(to) });
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open, from, to]);

  function handleSelect(selected: DateRange | undefined) {
    setLocalRange(selected);
    // Só confirma quando o período completo (início + fim) estiver selecionado
    if (selected?.from && selected?.to) {
      onChange(format(selected.from, "yyyy-MM-dd"), format(selected.to, "yyyy-MM-dd"));
      setOpen(false);
    }
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    setLocalRange(undefined);
    onChange("", "");
    setOpen(false);
  }

  const selecionandoFim = open && !!localRange?.from && !localRange?.to;
  const temData = !!from || !!to;

  const label = (() => {
    const range = open ? localRange : { from: toDate(from), to: toDate(to) };
    if (range?.from && range?.to)
      return `${format(range.from, "dd/MM/yy")} – ${format(range.to, "dd/MM/yy")}`;
    if (selecionandoFim && range?.from)
      return `${format(range.from, "dd/MM/yy")} — escolha o fim`;
    return "Selecionar período";
  })();

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-transparent bg-muted/50 px-3 text-sm transition-colors hover:border-primary/40 focus:border-primary focus:bg-background focus:outline-none",
          temData ? "text-foreground" : "text-muted-foreground"
        )}
      >
        <span className="flex items-center gap-2 min-w-0">
          <CalendarIcon className={cn(
            "h-4 w-4 shrink-0",
            selecionandoFim ? "text-primary animate-pulse" : "text-primary/70"
          )} />
          <span className="truncate">{label}</span>
        </span>
        {temData && (
          <span
            role="button"
            onClick={handleClear}
            className="shrink-0 rounded-sm p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 rounded-xl border bg-popover shadow-lg ring-1 ring-foreground/10">
          {selecionandoFim && (
            <p className="text-xs text-muted-foreground text-center pt-3 px-4">
              Agora selecione a data final do período
            </p>
          )}
          <Calendar
            mode="range"
            min={1}
            selected={localRange}
            onSelect={handleSelect}
            locale={ptBR}
            numberOfMonths={2}
            defaultMonth={localRange?.from}
          />
          {(temData || selecionandoFim) && (
            <div className="border-t p-2 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-muted-foreground hover:text-destructive text-xs"
              >
                Limpar período
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
