import { cadastrar } from "./actions";
import { CadastroForm } from "@/components/CadastroForm";

export default function CadastroPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Criar conta</h1>
        <p className="text-muted-foreground mt-1">
          Crie uma conta para poder cadastrar eventos
        </p>
      </div>
      <CadastroForm action={cadastrar} />
    </div>
  );
}
