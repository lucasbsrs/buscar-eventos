"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, SlidersHorizontal, MapPin, Map, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Combobox,
  ComboboxClear,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxList,
  ComboboxPopup,
} from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/DateRangePicker";
import { TIPOS_EVENTO, type LocalizacaoSugestao, type TipoEvento } from "@/types/evento";

function localizacaoEhIgual(a: LocalizacaoSugestao, b: LocalizacaoSugestao) {
  if (a.tipo !== b.tipo || a.estado !== b.estado) return false;
  if (a.tipo === "cidade" && b.tipo === "cidade") return a.cidade === b.cidade;
  return true;
}

interface EventFiltersProps {
  locations: LocalizacaoSugestao[];
}

export function EventFilters({ locations }: EventFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nomeFromUrl = searchParams.get("nome") ?? "";
  const estadoFromUrl = searchParams.get("estado") ?? "";
  const cidadeFromUrl = searchParams.get("cidade") ?? "";

  const [nome, setNome] = useState(nomeFromUrl);

  // Sincroniza estado local quando a URL muda externamente (ex: limpar filtros)
  useEffect(() => { setNome(nomeFromUrl); }, [nomeFromUrl]);

  const localizacaoSelecionada = useMemo<LocalizacaoSugestao | null>(() => {
    if (!estadoFromUrl) return null;
    if (cidadeFromUrl) {
      return { tipo: "cidade", cidade: cidadeFromUrl, estado: estadoFromUrl, label: `${cidadeFromUrl}, ${estadoFromUrl}` };
    }
    return { tipo: "estado", estado: estadoFromUrl, label: estadoFromUrl };
  }, [estadoFromUrl, cidadeFromUrl]);

  const gruposLocalizacao = useMemo(() => {
    const estados = locations.filter((l) => l.tipo === "estado");
    const cidades = locations.filter((l) => l.tipo === "cidade");
    return [
      { label: "Estados", items: estados },
      { label: "Cidades", items: cidades },
    ].filter((grupo) => grupo.items.length > 0);
  }, [locations]);

  const atualizarUrl = useCallback(
    (chave: string, valor: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (valor) params.set(chave, valor); else params.delete(chave);
      router.push(`/?${params.toString()}`);
    },
    [router, searchParams]
  );

  const selecionarLocalizacao = useCallback(
    (valor: LocalizacaoSugestao | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!valor) {
        params.delete("estado");
        params.delete("cidade");
      } else {
        params.set("estado", valor.estado);
        if (valor.tipo === "cidade") params.set("cidade", valor.cidade); else params.delete("cidade");
      }
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

  // Debounce para o campo de texto
  const nomeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleNome(valor: string) {
    setNome(valor);
    if (nomeTimer.current) clearTimeout(nomeTimer.current);
    nomeTimer.current = setTimeout(() => {
      if (valor !== nomeFromUrl) atualizarUrl("nome", valor);
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
          <Combobox
            items={gruposLocalizacao}
            value={localizacaoSelecionada}
            onValueChange={(valor) => selecionarLocalizacao(valor)}
            isItemEqualToValue={localizacaoEhIgual}
            itemToStringLabel={(item: LocalizacaoSugestao) => item.label}
          >
            <ComboboxInputGroup className="border-transparent bg-muted/50 pl-9 transition-colors focus-within:border-primary focus-within:bg-background">
              <MapPin className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <ComboboxInput placeholder="Cidade ou estado..." className="pl-0" />
              <ComboboxClear />
            </ComboboxInputGroup>
            <ComboboxPopup>
              <ComboboxEmpty>Nenhuma localização encontrada.</ComboboxEmpty>
              <ComboboxList>
                {(grupo: { label: string; items: LocalizacaoSugestao[] }) => (
                  <ComboboxGroup key={grupo.label} items={grupo.items}>
                    <ComboboxGroupLabel>{grupo.label}</ComboboxGroupLabel>
                    <ComboboxCollection>
                      {(item: LocalizacaoSugestao) => (
                        <ComboboxItem
                          key={item.tipo === "cidade" ? `${item.cidade}|${item.estado}` : item.estado}
                          value={item}
                        >
                          {item.tipo === "estado" ? (
                            <Map className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                          )}
                          {item.label}
                          <ComboboxItemIndicator />
                        </ComboboxItem>
                      )}
                    </ComboboxCollection>
                  </ComboboxGroup>
                )}
              </ComboboxList>
            </ComboboxPopup>
          </Combobox>
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

// Mesmo layout de EventFilters, usado como fallback do Suspense enquanto
// as localizações disponíveis são buscadas no servidor (ver design.md #6)
export function EventFiltersSkeleton() {
  return (
    <div className="rounded-2xl border bg-card shadow-sm p-4 flex flex-col gap-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <SlidersHorizontal className="h-4 w-4 text-primary" />
        Filtrar eventos
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input placeholder="Buscar por nome..." className="pl-9 bg-muted/50 border-transparent" disabled />
        </div>

        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input placeholder="Cidade ou estado..." className="pl-9 bg-muted/50 border-transparent" disabled />
        </div>

        <Select disabled>
          <SelectTrigger className="bg-muted/50 border-transparent">
            <SelectValue placeholder="Tipo de evento" />
          </SelectTrigger>
          <SelectContent />
        </Select>

        <div className="h-8 rounded-lg bg-muted/50" />
      </div>
    </div>
  );
}
