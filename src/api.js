const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
export const configured = !!base;
export const photoUrl = (id) =>
  base + "/index.php?route=photo&id=" + encodeURIComponent(id);
export async function api(path, body) {
  if (!base)
    throw new Error(
      "O ranking global estará disponível após a configuração do servidor.",
    );
  if (!base.startsWith("https://"))
    throw new Error("A API precisa usar HTTPS.");
  const r = await fetch(base + path, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(10000),
    credentials: "omit",
  });
  if (!r.ok) {
    const e = new Error(
      r.status === 429
        ? "Muitas tentativas. Tente novamente mais tarde."
        : "Não foi possível acessar o ranking.",
    );
    e.status = r.status;
    throw e;
  }
  return r.json();
}
