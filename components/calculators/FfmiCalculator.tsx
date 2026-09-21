"use client";

import { useMemo, useState } from "react";
import { calcularFfmi, categoriaFfmi, FFMI_CATEGORIAS, FFMI_DOMINIO_MAX } from "@/lib/calculators";
import { CHROME, useTheme } from "../theme";
import { Card } from "../ui";
import { RangeBar } from "./RangeBar";

export default function FfmiCalculator({
  pesoInicial,
  alturaInicial,
  gorduraInicial,
}: {
  pesoInicial: number | null;
  alturaInicial: number | null;
  gorduraInicial: number | null;
}) {
  const { mode } = useTheme();
  const chrome = CHROME[mode];
  const [peso, setPeso] = useState(pesoInicial?.toString() ?? "");
  const [altura, setAltura] = useState(alturaInicial?.toString() ?? "");
  const [gordura, setGordura] = useState(gorduraInicial?.toString() ?? "");

  const field = "touch w-full rounded-xl border px-3 text-base";
  const fieldStyle = {
    background: "var(--plane)",
    borderColor: "var(--border)",
    color: chrome.ink,
  };

  const resultado = useMemo(() => {
    const p = parseFloat(peso.replace(",", "."));
    const a = parseFloat(altura.replace(",", "."));
    const g = parseFloat(gordura.replace(",", "."));
    if (!p || !a || g === undefined || Number.isNaN(g) || p <= 0 || a <= 0 || g < 0 || g >= 100) {
      return null;
    }
    const ffmi = calcularFfmi(p, a, g);
    return { ffmi, categoria: categoriaFfmi(ffmi) };
  }, [peso, altura, gordura]);

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-5">
        <div className="grid gap-4 sm:grid-cols-3">
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
              Gordura (%)
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={gordura}
              onChange={(e) => setGordura(e.target.value)}
              placeholder="--"
              className={`${field} tabular`}
              style={fieldStyle}
            />
          </label>
        </div>
      </Card>

      <Card className="p-5">
        {resultado ? (
          <>
            <span className="tabular text-5xl leading-none font-semibold" style={{ color: chrome.ink }}>
              {resultado.ffmi.toFixed(1)}
            </span>
            <p className="mt-2 text-sm font-medium" style={{ color: resultado.categoria.cor }}>
              {resultado.categoria.label}
            </p>
            <RangeBar categorias={FFMI_CATEGORIAS} dominioMax={FFMI_DOMINIO_MAX} valor={resultado.ffmi} />
            <div className="flex justify-between text-xs" style={{ color: chrome.muted }}>
              <span>0</span>
              <span>{FFMI_DOMINIO_MAX}+</span>
            </div>
          </>
        ) : (
          <p className="text-sm" style={{ color: chrome.muted }}>
            Preenche peso, altura e gordura corporal para veres o FFMI.
          </p>
        )}
      </Card>

      <p className="px-1 text-sm leading-relaxed" style={{ color: chrome.muted }}>
        Mais alto não é “melhor”, só mais músculo do que a média -- por isso a
        barra usa a mesma cor em vários tons, nunca vermelho ou verde. O
        limite de 25 vem de um estudo só com homens; não há referência tão
        estabelecida para mulheres. Depende diretamente da tua percentagem de
        gordura, que a própria app não mede com precisão clínica.
      </p>
    </div>
  );
}
