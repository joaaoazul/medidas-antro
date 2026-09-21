/**
 * Aviso repetido em /artigos: aparece no topo do indice e de cada artigo, nao
 * so no fim do texto corrido, para ninguem o ler so depois de ja ter lido o
 * resto como se fosse orientacao pessoal.
 */
export default function ArticleDisclaimer() {
  return (
    <div
      className="rounded-xl border px-4 py-3 text-sm"
      style={{
        borderColor: "var(--border)",
        background: "var(--plane)",
        color: "var(--text-secondary)",
      }}
    >
      <strong style={{ color: "var(--text-primary)" }}>
        Isto é informação geral, não é aconselhamento médico.
      </strong>{" "}
      Fala com um profissional de saúde para orientação sobre o teu caso.
    </div>
  );
}
