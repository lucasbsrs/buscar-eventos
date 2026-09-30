import { z } from "zod";

export const TIPOS_EVENTO = [
  "anime",
  "games",
  "hq",
  "cosplay",
  "tecnologia",
  "rpg",
  "cultura-pop",
  "outro",
] as const;

export type TipoEvento = (typeof TIPOS_EVENTO)[number];

export interface Seed {
  id: string;
  nome: string;
  tipo: "evento_unico" | "listagem";
  tipo_padrao: TipoEvento;
  homepage_url: string;
  pagina_evento_url?: string;
  listagem_url?: string;
  link_pattern?: string;
}

export interface Candidato {
  url: string;
  fonte_nome: string;
}

// Schema dos dados que discover→extract precisam produzir por evento.
// Validado antes de qualquer escrita no banco — nada que falhe aqui chega
// à tabela `eventos`.
export const EventoExtraidoSchema = z.object({
  nome: z.string().trim().min(1),
  descricao: z.string().trim().min(1),
  tipo: z.enum(TIPOS_EVENTO),
  data_inicio: z
    .string()
    .trim()
    .min(1)
    .refine((v) => !Number.isNaN(Date.parse(v)), "data_inicio não é uma data válida"),
  data_fim: z
    .string()
    .trim()
    .min(1)
    .refine((v) => !Number.isNaN(Date.parse(v)), "data_fim não é uma data válida"),
  cidade: z.string().trim().min(1),
  estado: z
    .string()
    .trim()
    .length(2)
    .transform((v) => v.toUpperCase()),
  local: z.string().trim().min(1),
  endereco: z.string().trim().min(1),
  imagem_url: z.string().url().nullable(),
  site_url: z.string().url().nullable(),
  preco_entrada: z.number().nonnegative().nullable(),
  gratuito: z.boolean(),
  confianca: z.number().min(0).max(1),
});

export type EventoExtraido = z.infer<typeof EventoExtraidoSchema>;
