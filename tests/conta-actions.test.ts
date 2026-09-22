import { describe, expect, it, vi } from "vitest";

/*
 * A accao de gravar o perfil, com a sessao e a base de dados simuladas.
 *
 * Esta aqui pelo rollout dos objetivos por medida: o codigo pode chegar a
 * producao antes da migracao 0004, e gravar o perfil tem de continuar a
 * funcionar ate ela ser aplicada. Estes testes prendem isso.
 */
const saveProfile = vi.fn(async () => {});
const saveObjetivos = vi.fn(async () => {});
vi.mock("@/lib/session", () => ({
  requireReadyViewer: async () => ({ id: "u1" }),
}));
vi.mock("@/lib/profile-repo", () => ({
  saveProfile: (...a: unknown[]) => saveProfile(...(a as [])),
  saveObjetivos: (...a: unknown[]) => saveObjetivos(...(a as [])),
}));
vi.mock("@/lib/repo", () => ({ deleteAllEntries: async () => 0 }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

const { updateProfile } = await import("@/app/conta/actions");
const { IDLE } = await import("@/lib/form-state");

function formulario(extra: Record<string, string> = {}) {
  const f = new FormData();
  f.set("nome", "Ana");
  f.set("dataNascimento", "1990-05-01");
  for (const [k, v] of Object.entries(extra)) f.set(k, v);
  return f;
}

const chamadas = (fn: { mock: { calls: unknown[][] } }) => fn.mock.calls.length;

describe("updateProfile", () => {
  it("SEM a marca dos objetivos (migracao por aplicar): grava o perfil e nao toca na coluna nova", async () => {
    const antes = chamadas(saveObjetivos);
    const r = await updateProfile(IDLE, formulario({ objetivo_abdomen: "85" }));
    expect(r.status).toBe("ok");
    expect(chamadas(saveObjetivos)).toBe(antes);
  });

  it("COM a marca: grava os objetivos lidos", async () => {
    const r = await updateProfile(
      IDLE,
      formulario({ objetivos_por_medida: "1", objetivo_abdomen: "85,5", objetivo_gordura: "" }),
    );
    expect(r.status).toBe("ok");
    expect(saveObjetivos.mock.calls.at(-1)).toEqual(["u1", { abdomen: 85.5 }]);
  });

  it("um objetivo invalido nao grava nada, nem o resto do perfil", async () => {
    const [p, o] = [chamadas(saveProfile), chamadas(saveObjetivos)];
    const r = await updateProfile(
      IDLE,
      formulario({ objetivos_por_medida: "1", objetivo_musculo: "500" }),
    );
    expect(r).toEqual({
      status: "erro",
      message: "O objetivo para a massa muscular tem de estar entre 5 e 200 kg.",
    });
    expect([chamadas(saveProfile), chamadas(saveObjetivos)]).toEqual([p, o]);
  });

  it("se a base de dados recusar, e uma mensagem -- nao o ecra de erro", async () => {
    saveObjetivos.mockImplementationOnce(async () => {
      throw new Error("Os objetivos por medida ainda não estão disponíveis.");
    });
    const r = await updateProfile(
      IDLE,
      formulario({ objetivos_por_medida: "1", objetivo_abdomen: "85" }),
    );
    expect(r).toEqual({
      status: "erro",
      message: "Os objetivos por medida ainda não estão disponíveis.",
    });
  });
});
