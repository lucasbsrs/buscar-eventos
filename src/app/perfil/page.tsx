import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { buscarPerfil, fotoExibida } from "@/lib/perfil";
import { salvarPerfil, atualizarFoto } from "./actions";
import { sair } from "@/lib/auth-actions";
import { PerfilForm } from "@/components/PerfilForm";

export default async function PerfilPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/entrar?redirect=/perfil");
  }

  const perfil = await buscarPerfil(user.id);

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Meu perfil</h1>
        <p className="text-muted-foreground mt-1">{user.email}</p>
      </div>
      <PerfilForm
        salvarAction={salvarPerfil}
        atualizarFotoAction={atualizarFoto}
        sairAction={sair}
        fotoUrl={fotoExibida(perfil, user)}
        valoresIniciais={{
          nome: perfil?.nome ?? "",
          sobrenome: perfil?.sobrenome ?? "",
          data_nascimento: perfil?.data_nascimento ?? "",
          cidade: perfil?.cidade ?? "",
          estado: perfil?.estado ?? "",
        }}
      />
    </div>
  );
}
