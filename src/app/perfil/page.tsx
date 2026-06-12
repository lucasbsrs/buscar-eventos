import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { buscarEventosPorUsuario } from "@/lib/db/eventos";
import { EventCard } from "@/components/EventCard";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/auth/actions";
import { UserRound, Mail, CalendarDays, Plus, LogOut } from "lucide-react";

export default async function PerfilPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const eventos = await buscarEventosPorUsuario(user.id);

  const nome =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split("@")[0] ??
    "Usuário";

  const avatar = user.user_metadata?.avatar_url ?? null;

  const membro = new Date(user.created_at).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col">
      {/* Banner de perfil */}
      <div className="bg-gradient-to-br from-violet-900 via-purple-800 to-indigo-900 pt-10 pb-20 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center sm:items-end gap-5">
          <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 overflow-hidden flex items-center justify-center shadow-xl border-4 border-white/20 flex-shrink-0">
            {avatar ? (
              <Image src={avatar} alt={nome} fill sizes="96px" className="object-cover" />
            ) : (
              <UserRound className="h-12 w-12 text-white" />
            )}
          </div>
          <div className="flex-1 text-center sm:text-left text-white">
            <h1 className="text-2xl font-bold">{nome}</h1>
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-violet-200 justify-center sm:justify-start">
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {user.email}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                Membro desde {membro}
              </span>
            </div>
          </div>
          <form action={logout}>
            <Button type="submit" variant="ghost" size="sm" className="text-violet-200 hover:text-white hover:bg-white/10 gap-1.5 border border-white/20">
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </form>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-5xl mx-auto w-full px-4 -mt-10 pb-12 flex flex-col gap-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Eventos cadastrados", valor: eventos.length },
            { label: "Próximos eventos", valor: eventos.filter(e => new Date(e.data_inicio) >= new Date()).length },
            { label: "Eventos realizados", valor: eventos.filter(e => new Date(e.data_fim) < new Date()).length },
          ].map(({ label, valor }) => (
            <div key={label} className="bg-card border rounded-2xl p-5 shadow-sm text-center">
              <p className="text-3xl font-bold text-primary">{valor}</p>
              <p className="text-sm text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Eventos */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold">Meus eventos</h2>
            <Link href="/eventos/novo">
              <Button size="sm" className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Novo evento
              </Button>
            </Link>
          </div>

          {eventos.length === 0 ? (
            <div className="border rounded-2xl p-14 text-center text-muted-foreground bg-card">
              <p className="text-5xl mb-4">📅</p>
              <p className="font-semibold text-foreground">Nenhum evento cadastrado</p>
              <p className="text-sm mt-1 mb-6">Divulgue seu evento para a comunidade geek e otaku do Brasil</p>
              <Link href="/eventos/novo">
                <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700">
                  Cadastrar primeiro evento
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {eventos.map((evento) => (
                <EventCard key={evento.id} evento={evento} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
