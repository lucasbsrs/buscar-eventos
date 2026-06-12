import { criarEvento } from "./actions";
import { NovoEventoForm } from "@/components/NovoEventoForm";

export default function NovoEventoPage() {
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
