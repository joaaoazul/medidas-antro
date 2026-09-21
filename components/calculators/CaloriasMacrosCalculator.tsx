"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  calcularBmr,
  calcularMacros,
  calcularTdee,
  NIVEIS_ATIVIDADE,
  OBJETIVOS_CALORIAS,
  type NivelAtividadeKey,
  type ObjetivoCaloriasKey,
  type Sexo,
} from "@/lib/calculators";
import { CHROME, useTheme } from "../theme";
import { Card } from "../ui";

const SEXOS: { key: Sexo; label: string }[] = [
  { key: "feminino", label: "Feminino" },
  { key: "masculino", label: "Masculino" },
  { key: "outro", label: "Outro" },
  { key: "nao_dizer", label: "Prefiro não dizer" },
];

export default function CaloriasMacrosCalculator({
  pesoInicial,
  alturaInicial,
  idadeInicial,
  sexoInicial,
}: {
  pesoInicial: number | null;
  alturaInicial: number | null;
  idadeInicial: number | null;
  sexoInicial: Sexo | null;
}) {
  const { mode } = useTheme();
  const chrome = CHROME[mode];
  const [peso, setPeso] = useState(pesoInicial?.toString() ?? "");
  const [altura, setAltura] = useState(alturaInicial?.toString() ?? "");
  const [idade, setIdade] = useState(idadeInicial?.toString() ?? "");
  const [sexo, setSexo] = useState<Sexo>(sexoInicial ?? "nao_dizer");
  const [nivel, setNivel] = useState<NivelAtividadeKey>("sedentario");
  const [objetivo, setObjetivo] = useState<ObjetivoCaloriasKey>("manter");

  const field = "touch w-full rounded-xl border px-3 text-base";
  const fieldStyle = {
    background: "var(--plane)",
    borderColor: "var(--border)",
    color: chrome.ink,
  };

  const resultado = useMemo(() => {
    const p = parseFloat(peso.replace(",", "."));
    const a = parseFloat(altura.replace(",", "."));
    const i = parseInt(idade, 10);
    if (!p || !a || !i || p <= 0 || a <= 0 || i <= 0) return null;

    const bmr = calcularBmr(p, a, i, sexo);
    const tdee = calcularTdee(bmr, nivel);
    const ajuste = OBJETIVOS_CALORIAS.find((o) => o.key === objetivo)!.ajuste;
    const alvo = Math.max(tdee + ajuste, bmr);
    const macros = calcularMacros(
      alvo,
      p,
      objetivo === "perder" ? "defice" : "treino",
    );
    return { bmr, tdee, macros };
  }, [peso, altura, idade, sexo, nivel, objetivo]);

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: chrome.inkSecondary }}>
              Peso (kg)
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              placeholder="--"
              className={`${field} tabular`}
              style={fieldStyle}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: chrome.inkSecondary }}>
              Altura (cm)
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={altura}
              onChange={(e) => setAltura(e.target.value)}
              placeholder="--"
              className={`${field} tabular`}
              style={fieldStyle}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: chrome.inkSecondary }}>
              Idade
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={idade}
              onChange={(e) => setIdade(e.target.value)}
              placeholder="--"
              className={`${field} tabular`}
              style={fieldStyle}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: chrome.inkSecondary }}>
              Sexo
            </span>
            <select
              value={sexo}
              onChange={(e) => setSexo(e.target.value as Sexo)}
              className={field}
              style={fieldStyle}
            >
              {SEXOS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: chrome.inkSecondary }}>
              Nível de atividade
            </span>
            <select
              value={nivel}
              onChange={(e) => setNivel(e.target.value as NivelAtividadeKey)}
              className={field}
              style={fieldStyle}
            >
              {NIVEIS_ATIVIDADE.map((n) => (
                <option key={n.key} value={n.key}>
                  {n.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: chrome.inkSecondary }}>
              Objetivo
            </span>
            <select
              value={objetivo}
              onChange={(e) => setObjetivo(e.target.value as ObjetivoCaloriasKey)}
              className={field}
              style={fieldStyle}
            >
              {OBJETIVOS_CALORIAS.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      <Card className="p-5">
        {resultado ? (
          <>
            <span className="tabular text-5xl leading-none font-semibold" style={{ color: chrome.ink }}>
              {resultado.macros.calorias}
            </span>{" "}
            <span className="text-lg" style={{ color: chrome.inkSecondary }}>
              kcal / dia
            </span>
            <p className="mt-1 text-xs" style={{ color: chrome.muted }}>
              Gasto em repouso estimado: {Math.round(resultado.bmr)} kcal &middot;
              gasto total estimado: {Math.round(resultado.tdee)} kcal
            </p>

            <div className="mt-4 grid grid-cols-3 gap-3 border-t pt-4" style={{ borderColor: "var(--border)" }}>
              <div>
                <p className="tabular text-xl font-semibold" style={{ color: chrome.ink }}>
                  {resultado.macros.proteinaG}g
                </p>
                <p className="text-xs" style={{ color: chrome.muted }}>Proteína</p>
              </div>
              <div>
                <p className="tabular text-xl font-semibold" style={{ color: chrome.ink }}>
                  {resultado.macros.carboidratosG}g
                </p>
                <p className="text-xs" style={{ color: chrome.muted }}>Hidratos</p>
              </div>
              <div>
                <p className="tabular text-xl font-semibold" style={{ color: chrome.ink }}>
                  {resultado.macros.gorduraG}g
                </p>
                <p className="text-xs" style={{ color: chrome.muted }}>Gordura</p>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm" style={{ color: chrome.muted }}>
            Preenche peso, altura e idade para veres a estimativa.
          </p>
        )}
      </Card>

      <p className="px-1 text-sm leading-relaxed" style={{ color: chrome.muted }}>
        Estimativa pela equação de Mifflin-St Jeor -- perde precisão em
        obesidade e em idade avançada. É um ponto de partida, não uma
        prescrição.{" "}
        <Link href="/artigos/perda-de-peso-nao-e-linear" style={{ color: chrome.inkSecondary }}>
          O ritmo real raramente é constante
        </Link>
        .
      </p>
    </div>
  );
}
