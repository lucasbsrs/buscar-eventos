import Link from "next/link";
import { login } from "@/app/auth/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AuthFormWrapper } from "@/components/AuthFormWrapper";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">Entrar</h1>
        <p className="text-muted-foreground mt-1">Acesse sua conta de organizador</p>
      </div>

      <div className="border rounded-xl p-6 bg-card flex flex-col gap-4">
        <GoogleAuthButton />

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">ou</span>
          <Separator className="flex-1" />
        </div>

        <AuthFormWrapper action={login}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" required placeholder="seu@email.com" />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" name="password" type="password" required placeholder="••••••••" />
            </div>

            <Button type="submit" className="w-full mt-2">
              Entrar
            </Button>
          </div>
        </AuthFormWrapper>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Não tem conta?{" "}
        <Link href="/cadastro" className="underline text-foreground hover:text-primary">
          Cadastre-se
        </Link>
      </p>
    </div>
  );
}
