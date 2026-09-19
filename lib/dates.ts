/**
 * Datas sao tratadas como dias de calendario locais em formato AAAA-MM-DD.
 * Nada aqui usa fusos horarios: um registo de "12 de marco" e o dia 12, seja
 * qual for a hora a que foi introduzido.
 */

/**
 * Hora local atual em "HH:MM".
 *
 * So e chamada no browser, dentro do efeito que preenche o formulario. Chamada
 * durante o render, o servidor e o cliente podiam produzir minutos diferentes --
 * ou fusos diferentes -- e a hidratacao acusava a divergencia.
 */
export function horaAgora(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function todayISO(): string {
  const now = new Date();
  return toISO(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

function toISO(y: number, m: number, d: number): string {
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Converte AAAA-MM-DD em ms UTC a meia-noite, para usar como eixo X numerico. */
export function isoToMs(iso: string): number {
  return Date.parse(`${iso}T00:00:00Z`);
}

export function msToISO(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDaysISO(iso: string, days: number): string {
  return msToISO(isoToMs(iso) + days * 86_400_000);
}

export function daysBetween(fromISO: string, toISODate: string): number {
  return Math.round((isoToMs(toISODate) - isoToMs(fromISO)) / 86_400_000);
}

/** Segunda-feira da semana ISO a que a data pertence. */
export function weekStartISO(iso: string): string {
  const date = new Date(isoToMs(iso));
  const weekday = date.getUTCDay(); // 0 = domingo
  const shift = weekday === 0 ? -6 : 1 - weekday;
  return addDaysISO(iso, shift);
}

/** Rotulo AAAA-MM do mes a que a data pertence. */
export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

const MESES = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

/** Rotulo curto para eixos e tabelas: "12 mar" ou "mar 25". */
export function shortLabel(bucket: string): string {
  if (bucket.length === 7) {
    const [y, m] = bucket.split("-");
    return `${MESES[Number(m) - 1]} ${y.slice(2)}`;
  }
  const [, m, d] = bucket.split("-");
  return `${Number(d)} ${MESES[Number(m) - 1]}`;
}

/** Rotulo completo para tooltips: "12 mar 2025". */
export function longLabel(bucket: string): string {
  if (bucket.length === 7) {
    const [y, m] = bucket.split("-");
    return `${MESES[Number(m) - 1]} ${y}`;
  }
  const [y, m, d] = bucket.split("-");
  return `${Number(d)} ${MESES[Number(m) - 1]} ${y}`;
}
