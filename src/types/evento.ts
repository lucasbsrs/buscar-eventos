export type TipoEvento =
  | "anime"
  | "games"
  | "hq"
  | "cosplay"
  | "tecnologia"
  | "rpg"
  | "cultura-pop"
  | "outro";

export interface Evento {
  id: string;
  nome: string;
  descricao: string;
  tipo: TipoEvento;
  data_inicio: string;
  data_fim: string;
  cidade: string;
  estado: string;
  local: string;
  endereco: string;
  imagem_url: string | null;
  site_url: string | null;
  preco_entrada: number | null;
  gratuito: boolean;
  created_at: string;
}

export interface FiltrosEvento {
  localizacao?: string;
  tipo?: TipoEvento | "";
  nome?: string;
  data_inicio?: string;
  data_fim?: string;
}

export const TIPOS_EVENTO: Record<TipoEvento, string> = {
  anime: "Anime",
  games: "Games",
  hq: "HQ / Mangá",
  cosplay: "Cosplay",
  tecnologia: "Tecnologia",
  rpg: "RPG",
  "cultura-pop": "Cultura Pop",
  outro: "Outro",
};

export const ESTADOS_BR = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
  "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
  "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

export const ESTADOS_NOMES: Record<string, string> = {
  AC: "Acre",
  AL: "Alagoas",
  AP: "Amapá",
  AM: "Amazonas",
  BA: "Bahia",
  CE: "Ceará",
  DF: "Distrito Federal",
  ES: "Espírito Santo",
  GO: "Goiás",
  MA: "Maranhão",
  MT: "Mato Grosso",
  MS: "Mato Grosso do Sul",
  MG: "Minas Gerais",
  PA: "Pará",
  PB: "Paraíba",
  PR: "Paraná",
  PE: "Pernambuco",
  PI: "Piauí",
  RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul",
  RO: "Rondônia",
  RR: "Roraima",
  SC: "Santa Catarina",
  SP: "São Paulo",
  SE: "Sergipe",
  TO: "Tocantins",
};
