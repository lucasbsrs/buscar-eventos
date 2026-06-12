"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Search, SlidersHorizontal, MapPin, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/DateRangePicker";
import { TIPOS_EVENTO, type TipoEvento } from "@/types/evento";

export function EventFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nomeFromUrl = searchParams.get("nome") ?? "";
  const localizacaoFromUrl = searchParams.get("localizacao") ?? "";

  const [nome, setNome] = useState(nomeFromUrl);
  const [localizacao, setLocalizacao] = useState(localizacaoFromUrl);

  // Sincroniza estado local quando a URL muda externamente (ex: limpar filtros)
  useEffect(() => { setNome(nomeFromUrl); }, [nomeFromUrl]);
  useEffect(() => { setLocalizacao(localizacaoFromUrl); }, [localizacaoFromUrl]);

  const atualizarUrl = useCallback(
    (chave: string, valor: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (valor) params.set(chave, valor); else params.delete(chave);
      router.push(`/?${params.toString()}`);
    },
    [router, searchParams]
  );

  // Atualiza início e fim do período de uma só vez
  const atualizarDatas = useCallback(
    (from: string, to: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (from) params.set("data_inicio", from); else params.delete("data_inicio");
      if (to) params.set("data_fim", to); else params.delete("data_fim");
      router.push(`/?${params.toString()}`);
    },
    [router, searchParams]
  );

  // Debounce para campos de texto
  const nomeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localizacaoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleNome(valor: string) {
    setNome(valor);
    if (nomeTimer.current) clearTimeout(nomeTimer.current);
    nomeTimer.current = setTimeout(() => {
      if (valor !== nomeFromUrl) atualizarUrl("nome", valor);
    }, 400);
  }

  function handleLocalizacao(valor: string) {
    setLocalizacao(valor);
    if (localizacaoTimer.current) clearTimeout(localizacaoTimer.current);
    localizacaoTimer.current = setTimeout(() => {
      if (valor !== localizacaoFromUrl) atualizarUrl("localizacao", valor);
    }, 400);
  }

  const limparFiltros = () => router.push("/");
  const temFiltros = searchParams.toString().length > 0;

  return (
    <div className="rounded-2xl border bg-card shadow-sm p-4 flex flex-col gap-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <SlidersHorizontal className="h-4 w-4 text-primary" />
        Filtrar eventos
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Nome */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar por nome..."
            className="pl-9 bg-muted/50 border-transparent focus:border-primary focus:bg-background transition-colors"
            value={nome}
            onChange={(e) => handleNome(e.target.value)}
          />
        </div>

        {/* Localização */}
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Cidade ou estado..."
            className="pl-9 bg-muted/50 border-transparent focus:border-primary focus:bg-background transition-colors"
            value={localizacao}
            onChange={(e) => handleLocalizacao(e.target.value)}
          />
        </div>

        {/* Tipo */}
        <Select
          value={searchParams.get("tipo") ?? ""}
          onValueChange={(v) => atualizarUrl("tipo", !v || v === "todos" ? "" : v)}
        >
          <SelectTrigger className="bg-muted/50 border-transparent focus:border-primary">
            <SelectValue placeholder="Tipo de evento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            {(Object.entries(TIPOS_EVENTO) as [TipoEvento, string][]).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Período (data de início do evento) */}
        <DateRangePicker
          from={searchParams.get("data_inicio") ?? undefined}
          to={searchParams.get("data_fim") ?? undefined}
          onChange={atualizarDatas}
        />
      </div>

      {temFiltros && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={limparFiltros}
            className="text-muted-foreground hover:text-destructive text-xs"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Limpar todos os filtros
          </Button>
        </div>
      )}
    </div>
  );
}
