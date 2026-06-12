import { Suspense } from "react";
import { buscarEventos } from "@/lib/db/eventos";
import { EventCard } from "@/components/EventCard";
import { EventFilters } from "@/components/EventFilters";
import type { FiltrosEvento, TipoEvento } from "@/types/evento";

interface HomeProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

async function ListaEventos({ filtros }: { filtros: FiltrosEvento }) {
  const eventos = await buscarEventos(filtros);

  if (eventos.length === 0) {
    return (
      <div className="text-center py-24 text-muted-foreground">
        <p className="text-5xl mb-4">🔍</p>
        <p className="text-lg font-semibold text-foreground">Nenhum evento encontrado</p>
        <p className="text-sm mt-1">Tente ajustar os filtros de busca</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {eventos.map((evento) => (
        <EventCard key={evento.id} evento={evento} />
      ))}
    </div>
  );
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;

  const filtros: FiltrosEvento = {
    localizacao: params.localizacao,
    tipo: params.tipo as TipoEvento | undefined,
    nome: params.nome,
    data_inicio: params.data_inicio,
    data_fim: params.data_fim,
  };

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-900 via-purple-800 to-indigo-900 text-white py-16 px-4">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="relative max-w-7xl mx-auto text-center flex flex-col items-center gap-4">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium">
            <span className="text-yellow-300">✦</span>
            O maior agregador geek do Brasil
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Encontre eventos{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-400">
              Geek & Otaku
            </span>
          </h1>
          <p className="text-lg text-violet-200 max-w-xl">
            Anime, games, cosplay, HQ, RPG e muito mais — tudo em um só lugar para a comunidade nerd do Brasil.
          </p>
          <div className="flex gap-3 flex-wrap justify-center mt-2 text-sm text-violet-300">
            {["🎌 Anime", "🎮 Games", "🦸 Cosplay", "🎲 RPG", "📚 HQ / Mangá"].map((tag) => (
              <span key={tag} className="bg-white/10 rounded-full px-3 py-1">{tag}</span>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
        <Suspense>
          <EventFilters />
        </Suspense>

        <div>
          <h2 className="text-xl font-bold mb-5 text-foreground">Próximos eventos</h2>
          <Suspense
            fallback={
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-72 rounded-2xl bg-muted animate-pulse" />
                ))}
              </div>
            }
          >
            <ListaEventos filtros={filtros} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
