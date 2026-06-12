import { NextRequest, NextResponse } from "next/server";
import { buscarEventos } from "@/lib/db/eventos";
import type { FiltrosEvento, TipoEvento } from "@/types/evento";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const filtros: FiltrosEvento = {
    localizacao: searchParams.get("localizacao") ?? undefined,
    tipo: (searchParams.get("tipo") as TipoEvento) ?? undefined,
    nome: searchParams.get("nome") ?? undefined,
    data_inicio: searchParams.get("data_inicio") ?? undefined,
    data_fim: searchParams.get("data_fim") ?? undefined,
  };

  try {
    const eventos = await buscarEventos(filtros);
    return NextResponse.json(eventos);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar eventos" },
      { status: 500 }
    );
  }
}
