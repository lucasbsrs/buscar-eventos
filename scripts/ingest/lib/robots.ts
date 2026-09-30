const regrasPorOrigin = new Map<string, string[]>();

function parseDisallow(texto: string): string[] {
  const linhas = texto.split("\n").map((l) => l.trim());
  const regras: string[] = [];
  let dentroDeStar = false;

  for (const linha of linhas) {
    if (/^user-agent:\s*\*/i.test(linha)) {
      dentroDeStar = true;
      continue;
    }
    if (/^user-agent:/i.test(linha)) {
      dentroDeStar = false;
      continue;
    }
    if (dentroDeStar) {
      const m = linha.match(/^disallow:\s*(.*)$/i);
      if (m && m[1]) regras.push(m[1].trim());
    }
  }

  return regras;
}

async function obterRegras(origin: string): Promise<string[]> {
  if (regrasPorOrigin.has(origin)) return regrasPorOrigin.get(origin)!;

  let regras: string[] = [];
  try {
    const resp = await fetch(`${origin}/robots.txt`);
    if (resp.ok) regras = parseDisallow(await resp.text());
  } catch {
    // robots.txt inacessível — segue sem restrição adicional
  }

  regrasPorOrigin.set(origin, regras);
  return regras;
}

export async function podeAcessar(url: string): Promise<boolean> {
  const alvo = new URL(url);
  const regras = await obterRegras(alvo.origin);
  return !regras.some((regra) => regra !== "" && alvo.pathname.startsWith(regra));
}

const ultimoAcessoPorOrigin = new Map<string, number>();
const INTERVALO_MINIMO_MS = 1500;

// Espaça requisições ao mesmo domínio — não sobrecarrega o site de origem.
export async function respeitarIntervalo(url: string): Promise<void> {
  const origin = new URL(url).origin;
  const ultimo = ultimoAcessoPorOrigin.get(origin) ?? 0;
  const espera = ultimo + INTERVALO_MINIMO_MS - Date.now();
  if (espera > 0) await new Promise((resolve) => setTimeout(resolve, espera));
  ultimoAcessoPorOrigin.set(origin, Date.now());
}
