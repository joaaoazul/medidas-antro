import { describe, expect, it } from "vitest";
import {
  addDaysISO,
  daysBetween,
  longLabel,
  monthKey,
  shortLabel,
  todayISO,
  weekStartISO,
} from "@/lib/dates";
import { idadeEm } from "@/lib/profile";

describe("weekStartISO", () => {
  it("devolve a segunda-feira da semana", () => {
    // 2026-09-16 e uma quarta-feira.
    expect(weekStartISO("2026-09-16")).toBe("2026-09-14");
    expect(weekStartISO("2026-09-14")).toBe("2026-09-14");
  });

  it("poe o domingo na semana que acaba, nao na que comeca", () => {
    // O caso que o -6 no codigo existe para resolver: sem ele, domingo saltava
    // para a semana seguinte e as medias semanais ficavam trocadas.
    expect(weekStartISO("2026-09-20")).toBe("2026-09-14");
  });
});

describe("addDaysISO e daysBetween", () => {
  it("atravessa meses e anos", () => {
    expect(addDaysISO("2026-02-27", 2)).toBe("2026-03-01");
    expect(addDaysISO("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysISO("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("conta dias bissextos", () => {
    // 2028 e bissexto: fevereiro tem 29.
    expect(addDaysISO("2028-02-28", 1)).toBe("2028-02-29");
    expect(daysBetween("2028-02-01", "2028-03-01")).toBe(29);
  });

  it("e simetrico", () => {
    expect(daysBetween("2026-01-01", "2026-03-15")).toBe(73);
    expect(daysBetween("2026-03-15", "2026-01-01")).toBe(-73);
  });
});

describe("rotulos", () => {
  it("distingue um dia de um mes pelo comprimento da chave", () => {
    expect(shortLabel("2026-09-16")).toBe("16 set");
    expect(shortLabel("2026-09")).toBe("set 26");
    expect(longLabel("2026-09-16")).toBe("16 set 2026");
    expect(longLabel("2026-09")).toBe("set 2026");
  });

  it("monthKey corta o dia", () => {
    expect(monthKey("2026-09-16")).toBe("2026-09");
  });
});

describe("idadeEm", () => {
  const hoje = todayISO();
  const [ano, mesDia] = [hoje.slice(0, 4), hoje.slice(5)];

  it("conta o ano de quem ja fez anos hoje", () => {
    expect(idadeEm(`${Number(ano) - 30}-${mesDia}`)).toBe(30);
  });

  it("nao conta o ano de quem ainda nao fez anos", () => {
    // Nasceu amanha, ha 30 anos: ainda tem 29.
    const amanha = addDaysISO(hoje, 1);
    // Salta o caso em que amanha ja e outro ano -- ai a conta do ano muda e o
    // teste deixava de dizer o que quer dizer.
    if (amanha.slice(0, 4) !== ano) return;
    expect(idadeEm(`${Number(ano) - 30}-${amanha.slice(5)}`)).toBe(29);
  });
});
