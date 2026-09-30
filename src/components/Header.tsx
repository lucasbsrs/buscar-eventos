import Link from "next/link";
import { Sparkles, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSupabaseServer } from "@/lib/supabase-server";
import { buscarPerfil, fotoExibida } from "@/lib/perfil";
import { HeaderUserMenu } from "@/components/HeaderUserMenu";

export async function Header() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const perfil = user ? await buscarPerfil(user.id) : null;

  return (
    <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl shrink-0">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-md">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="bg-gradient-to-r from-violet-600 to-purple-500 bg-clip-text text-transparent">
            Eventaku
          </span>
        </Link>

        <nav className="flex items-center gap-3">
          <Link href="/eventos/novo">
            <Button size="sm" className="gap-1.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-sm">
              <Plus className="h-3.5 w-3.5" />
              Cadastrar evento
            </Button>
          </Link>

          {user ? (
            <HeaderUserMenu fotoUrl={fotoExibida(perfil, user)} email={user.email ?? ""} />
          ) : (
            <Link href="/entrar">
              <Button variant="outline" size="sm">
                Entrar
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
