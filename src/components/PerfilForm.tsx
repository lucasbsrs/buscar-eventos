"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Toast } from "@base-ui/react/toast";
import { Camera, UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ESTADOS_BR } from "@/types/evento";

interface PerfilValores {
  nome: string;
  sobrenome: string;
  data_nascimento: string;
  cidade: string;
  estado: string;
}

interface PerfilFormProps {
  salvarAction: (formData: FormData) => Promise<{ error: string } | void>;
  atualizarFotoAction: (formData: FormData) => Promise<{ error: string } | { fotoUrl: string }>;
  sairAction: () => Promise<void>;
  fotoUrl: string | null;
  valoresIniciais: PerfilValores;
}

export function PerfilForm({
  salvarAction,
  atualizarFotoAction,
  sairAction,
  fotoUrl,
  valoresIniciais,
}: PerfilFormProps) {
  const toastManager = Toast.useToastManager();

  const [nome, setNome] = useState(valoresIniciais.nome);
  const [sobrenome, setSobrenome] = useState(valoresIniciais.sobrenome);
  const [dataNascimento, setDataNascimento] = useState(valoresIniciais.data_nascimento);
  const [cidade, setCidade] = useState(valoresIniciais.cidade);
  const [estado, setEstado] = useState(valoresIniciais.estado);
  const [erro, setErro] = useState<string | null>(null);

  const [fotoAtual, setFotoAtual] = useState(fotoUrl);
  const [erroFoto, setErroFoto] = useState<string | null>(null);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const inputFotoRef = useRef<HTMLInputElement>(null);

  // Campos controlados por estado (em vez de defaultValue): o React reseta
  // inputs não controlados assim que um <form action={fn}> é submetido, antes
  // mesmo da Server Action responder — com defaultValue isso apagava o campo
  // visualmente até a página ser recarregada.
  async function handleSubmit(formData: FormData) {
    setErro(null);
    // O Select (Estado) não é um <select> nativo, então seu valor não entra
    // no FormData sozinho — precisa ser injetado manualmente (mesmo padrão de
    // NovoEventoForm.tsx).
    formData.set("estado", estado);
    const result = await salvarAction(formData);
    if (result?.error) {
      setErro(result.error);
    } else {
      toastManager.add({ title: "Perfil salvo!", type: "success" });
    }
  }

  async function handleFotoSelecionada(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    setErroFoto(null);
    setEnviandoFoto(true);
    const formData = new FormData();
    formData.set("foto", arquivo);
    const result = await atualizarFotoAction(formData);
    setEnviandoFoto(false);
    if ("error" in result) setErroFoto(result.error);
    else setFotoAtual(result.fotoUrl);

    // Permite selecionar o mesmo arquivo de novo depois, se precisar reenviar
    e.target.value = "";
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 border rounded-xl p-6 bg-card">
        <button
          type="button"
          onClick={() => inputFotoRef.current?.click()}
          disabled={enviandoFoto}
          className="group relative h-24 w-24 rounded-full overflow-hidden bg-muted flex items-center justify-center disabled:cursor-not-allowed"
        >
          {fotoAtual ? (
            <Image src={fotoAtual} alt="Foto de perfil" width={96} height={96} className="h-full w-full object-cover" />
          ) : (
            <UserRound className="h-12 w-12 text-muted-foreground" />
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="h-6 w-6 text-white" />
          </span>
          {enviandoFoto && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs text-white">
              Enviando...
            </span>
          )}
        </button>
        <input
          ref={inputFotoRef}
          type="file"
          name="foto"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFotoSelecionada}
          className="hidden"
        />
        <p className="text-xs text-muted-foreground">Clique na foto para trocar</p>
        {erroFoto && <p className="text-sm text-destructive">{erroFoto}</p>}
      </div>

      <form action={handleSubmit} className="flex flex-col gap-5 border rounded-xl p-6 bg-card">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nome">Nome</Label>
          <Input id="nome" name="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sobrenome">Sobrenome</Label>
          <Input
            id="sobrenome"
            name="sobrenome"
            value={sobrenome}
            onChange={(e) => setSobrenome(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="data_nascimento">Data de nascimento</Label>
          <Input
            id="data_nascimento"
            name="data_nascimento"
            type="date"
            value={dataNascimento}
            onChange={(e) => setDataNascimento(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cidade">Cidade</Label>
            <Input id="cidade" name="cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Estado</Label>
            <Select value={estado} onValueChange={(v) => setEstado(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="UF" />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS_BR.map((uf) => (
                  <SelectItem key={uf} value={uf}>
                    {uf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {erro && <p className="text-sm text-destructive">{erro}</p>}

        <Button type="submit" className="w-full">
          Salvar
        </Button>
      </form>

      <form action={sairAction}>
        <Button type="submit" variant="outline" className="w-full">
          Sair
        </Button>
      </form>
    </div>
  );
}
