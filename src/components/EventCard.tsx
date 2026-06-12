import Image from "next/image";
import Link from "next/link";
import { MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import type { Evento } from "@/types/evento";
import { TIPOS_EVENTO } from "@/types/evento";

const TIPO_EMOJI: Record<string, string> = {
  anime: "🎌",
  games: "🎮",
  hq: "📚",
  cosplay: "🦸",
  tecnologia: "💻",
  rpg: "🎲",
  "cultura-pop": "🌟",
  outro: "🎪",
};

interface EventCardProps {
  evento: Evento;
}

export function EventCard({ evento }: EventCardProps) {
  const dataInicio = new Date(evento.data_inicio);
  const dataFim = new Date(evento.data_fim);
  const mesmaData = dataInicio.toDateString() === dataFim.toDateString();

  const periodoFormatado = mesmaData
    ? format(dataInicio, "dd 'de' MMM yyyy", { locale: ptBR })
    : `${format(dataInicio, "dd/MM")} – ${format(dataFim, "dd/MM/yyyy")}`;

  const emoji = TIPO_EMOJI[evento.tipo] ?? "🎪";

  return (
    <Link href={`/eventos/${evento.id}`} className="group block h-full">
      <div className="rounded-2xl overflow-hidden border bg-card h-full flex flex-col shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        {/* Imagem */}
        <div className="relative h-48 bg-gradient-to-br from-violet-100 to-purple-100 overflow-hidden flex-shrink-0">
          {evento.imagem_url ? (
            <Image
              src={evento.imagem_url}
              alt={evento.nome}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">
              {emoji}
            </div>
          )}
          {/* Gradient overlay bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5">
            <span className="inline-flex items-center gap-1 text-xs font-medium bg-black/50 backdrop-blur-sm text-white rounded-full px-2.5 py-1">
              {emoji} {TIPOS_EVENTO[evento.tipo]}
            </span>
          </div>
          {evento.gratuito && (
            <div className="absolute top-2.5 right-2.5">
              <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white text-xs shadow-sm">
                Gratuito
              </Badge>
            </div>
          )}
        </div>

        {/* Conteúdo */}
        <div className="p-4 flex flex-col flex-1 gap-3">
          <h3 className="font-bold text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {evento.nome}
          </h3>
          <p className="text-muted-foreground text-sm line-clamp-2 flex-1">
            {evento.descricao}
          </p>

          <div className="flex flex-col gap-1.5 pt-2 border-t text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary/70 shrink-0" />
              <span className="capitalize">{periodoFormatado}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary/70 shrink-0" />
              <span className="truncate">{evento.cidade}, {evento.estado}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
