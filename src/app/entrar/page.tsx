import Link from "next/link";
import { entrar, entrarComGoogle } from "./actions";
import { EntrarForm } from "@/components/EntrarForm";

interface EntrarPageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function EntrarPage({ searchParams }: EntrarPageProps) {
  const params = await searchParams;
  const redirectPara = params.redirect ?? "/";

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Entrar</h1>
        <p className="text-muted-foreground mt-1">Acesse sua conta para cadastrar eventos</p>
      </div>
      <EntrarForm entrarAction={entrar} entrarComGoogleAction={entrarComGoogle} redirectPara={redirectPara} />
      <p className="text-sm text-muted-foreground mt-4 text-center">
        Não tem conta?{" "}
        <Link href="/cadastro" className="text-primary underline underline-offset-2">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
