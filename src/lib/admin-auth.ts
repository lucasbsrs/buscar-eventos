import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_revisao_sessao";

function assinar(senha: string): string {
  return createHmac("sha256", senha).update("admin-revisao").digest("hex");
}

// Stopgap enquanto o sistema de auth do app está desativado: uma única
// senha compartilhada via env, nunca exposta ao cliente. O cookie guarda
// um HMAC derivado da senha, não a senha em si.
export async function senhaConfere(tentativa: string): Promise<boolean> {
  const senha = process.env.ADMIN_REVIEW_PASSWORD;
  if (!senha) return false;
  return tentativa === senha;
}

export async function criarSessao(): Promise<void> {
  const senha = process.env.ADMIN_REVIEW_PASSWORD;
  if (!senha) throw new Error("ADMIN_REVIEW_PASSWORD não configurada.");

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, assinar(senha), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin/revisao",
    maxAge: 60 * 60 * 8,
  });
}

export async function encerrarSessao(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function estaAutenticado(): Promise<boolean> {
  const senha = process.env.ADMIN_REVIEW_PASSWORD;
  if (!senha) return false;

  const cookieStore = await cookies();
  const valor = cookieStore.get(COOKIE_NAME)?.value;
  if (!valor) return false;

  const esperado = Buffer.from(assinar(senha));
  const recebido = Buffer.from(valor);
  if (esperado.length !== recebido.length) return false;
  return timingSafeEqual(esperado, recebido);
}
