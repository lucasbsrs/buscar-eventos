import { redirect } from "next/navigation";
import { criarEvento } from "./actions";
import { NovoEventoForm } from "@/components/NovoEventoForm";
import { createSupabaseServer } from "@/lib/supabase-server";

export default async function NovoEventoPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/entrar?redirect=/eventos/novo");
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Cadastrar evento</h1>
        <p className="text-muted-foreground mt-1">
          Preencha os dados do seu evento para divulgá-lo
        </p>
      </div>
      <NovoEventoForm action={criarEvento} />
    </div>
  );
}
