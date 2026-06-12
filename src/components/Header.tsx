import Link from "next/link";
import { Sparkles, UserRound, Plus } from "lucide-react";
import Image from "next/image";
import { createSupabaseServer } from "@/lib/supabase-server";
import { logout } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";

export async function Header() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  const avatar = user?.user_metadata?.avatar_url ?? null;
  const nome =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email?.split("@")[0] ??
    null;

  return (
    <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl shrink-0">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-md">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="bg-gradient-to-r from-violet-600 to-purple-500 bg-clip-text text-transparent">
            OtakuEventos
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/eventos/novo">
                <Button size="sm" className="gap-1.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-sm">
                  <Plus className="h-3.5 w-3.5" />
                  Cadastrar evento
                </Button>
              </Link>
              <Link
                href="/perfil"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <div className="relative h-7 w-7 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-sm">
                  {avatar ? (
                    <Image src={avatar} alt={nome ?? "Perfil"} fill sizes="28px" className="object-cover" />
                  ) : (
                    <UserRound className="h-4 w-4 text-white" />
                  )}
                </div>
                <span className="hidden sm:block max-w-[120px] truncate font-medium">
                  {nome ?? "Perfil"}
                </span>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
              >
                Entrar
              </Link>
              <Link href="/cadastro">
                <Button size="sm" variant="outline" className="border-violet-200 hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700">
                  Criar conta
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
