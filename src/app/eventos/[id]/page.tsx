import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Calendar, ExternalLink, ArrowLeft, Tag } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { buscarEventoPorId } from "@/lib/db/eventos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TIPOS_EVENTO } from "@/types/evento";

interface EventoPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventoPage({ params }: EventoPageProps) {
  const { id } = await params;
  const evento = await buscarEventoPorId(id);

  if (!evento) notFound();

  const dataInicio = new Date(evento.data_inicio);
  const dataFim = new Date(evento.data_fim);
  const mesmaData = dataInicio.toDateString() === dataFim.toDateString();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/">
        <Button variant="ghost" size="sm" className="mb-6 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar
        </Button>
      </Link>

      <div className="relative h-72 sm:h-96 rounded-2xl overflow-hidden bg-muted mb-8">
        {evento.imagem_url ? (
          <Image src={evento.imagem_url} alt={evento.nome} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-7xl">🎌</div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Badge variant="secondary">
          <Tag className="h-3 w-3 mr-1" />
          {TIPOS_EVENTO[evento.tipo]}
        </Badge>
        {evento.gratuito && <Badge className="bg-green-600 text-white">Gratuito</Badge>}
      </div>

      <h1 className="text-3xl font-bold mb-4">{evento.nome}</h1>
      <p className="text-muted-foreground text-lg mb-8">{evento.descricao}</p>

      <div className="grid sm:grid-cols-2 gap-4 border rounded-xl p-6 mb-8">
        <div className="flex items-start gap-3">
          <Calendar className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="font-medium">Data</p>
            {mesmaData ? (
              <p className="text-muted-foreground">
                {format(dataInicio, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            ) : (
              <p className="text-muted-foreground">
                {format(dataInicio, "dd/MM/yyyy")} até {format(dataFim, "dd/MM/yyyy")}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="font-medium">Local</p>
            <p className="text-muted-foreground">{evento.local}</p>
            <p className="text-muted-foreground text-sm">{evento.endereco}</p>
            <p className="text-muted-foreground text-sm">
              {evento.cidade} - {evento.estado}
            </p>
          </div>
        </div>
      </div>

      {evento.site_url && (
        <a href={evento.site_url} target="_blank" rel="noopener noreferrer">
          <Button className="w-full sm:w-auto">
            <ExternalLink className="h-4 w-4 mr-2" />
            Site oficial do evento
          </Button>
        </a>
      )}
    </div>
  );
}
