import { estaAutenticado } from "@/lib/admin-auth";
import { obterSupabaseAdmin } from "@/lib/supabase-admin";
import { autenticar, aprovarEvento, rejeitarEvento, sair } from "./actions";
import { TIPOS_EVENTO, type Evento } from "@/types/evento";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

export default async function RevisaoPage() {
  const autenticado = await estaAutenticado();

  if (!autenticado) {
    return <LoginForm />;
  }

  const { data, error } = await obterSupabaseAdmin()
    .from("eventos")
    .select("*")
    .eq("status", "pendente_revisao")
    .order("atualizado_em", { ascending: false });

  const eventos = (data ?? []) as Evento[];

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Fila de revisão</h1>
          <p className="text-sm text-muted-foreground">
            Eventos capturados automaticamente com confiança abaixo do limiar — não aparecem no site até serem aprovados.
          </p>
        </div>
        <form action={sair}>
          <Button type="submit" variant="outline" size="sm">
            Sair
          </Button>
        </form>
      </div>

      {error && (
        <p className="text-sm text-destructive">Erro ao carregar eventos: {error.message}</p>
      )}

      {!error && eventos.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum evento pendente de revisão no momento.</p>
      )}

      <div className="flex flex-col gap-4">
        {eventos.map((evento) => (
          <Card key={evento.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>{evento.nome}</CardTitle>
                  <CardDescription>
                    {evento.cidade}/{evento.estado} · {evento.local}
                  </CardDescription>
                </div>
                <Badge variant="secondary">{TIPOS_EVENTO[evento.tipo]}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <p className="text-muted-foreground">{evento.descricao}</p>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <div>
                  <dt className="font-medium text-foreground">Datas</dt>
                  <dd>
                    {evento.data_inicio} → {evento.data_fim}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Confiança</dt>
                  <dd>{evento.confianca != null ? `${Math.round(evento.confianca * 100)}%` : "—"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Fonte</dt>
                  <dd>{evento.fonte_nome ?? "—"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Endereço</dt>
                  <dd>{evento.endereco}</dd>
                </div>
              </dl>
              {evento.fonte_url && (
                <a
                  href={evento.fonte_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary underline underline-offset-2"
                >
                  Ver página de origem
                </a>
              )}
            </CardContent>
            <CardFooter className="flex justify-end gap-2 bg-transparent p-0 px-4 pb-4">
              <form action={rejeitarEvento.bind(null, evento.id)}>
                <Button type="submit" variant="outline" size="sm">
                  Rejeitar
                </Button>
              </form>
              <form action={aprovarEvento.bind(null, evento.id)}>
                <Button type="submit" size="sm">
                  Aprovar e publicar
                </Button>
              </form>
            </CardFooter>
          </Card>
        ))}
      </div>
    </main>
  );
}

function LoginForm() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-sm flex-col justify-center gap-4 px-4">
      <div>
        <h1 className="text-xl font-semibold">Fila de revisão</h1>
        <p className="text-sm text-muted-foreground">
          Área restrita — acesso temporário por senha enquanto o login do app está desativado.
        </p>
      </div>
      <form action={autenticar} className="flex flex-col gap-3 rounded-xl border bg-card p-6">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="senha">Senha</Label>
          <Input id="senha" name="senha" type="password" required autoFocus />
        </div>
        <Button type="submit" className="w-full">
          Entrar
        </Button>
      </form>
    </main>
  );
}
