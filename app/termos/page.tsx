import type { Metadata } from "next";
import LegalDoc, { Lista, Seccao } from "@/components/LegalDoc";
import { IDADE_MINIMA, RESPONSAVEL, VERSAO_TERMOS } from "@/lib/legal";

export const metadata: Metadata = { title: "Termos de Servico - Medidas" };

export default function TermosPage() {
  return (
    <LegalDoc titulo="Termos de Servico" versao={VERSAO_TERMOS}>
      <Seccao numero={1} titulo="Quem fornece o servico">
        <p>
          A aplicacao Medidas e fornecida por {RESPONSAVEL.nome}, com morada em{" "}
          {RESPONSAVEL.morada}, contribuinte n.o {RESPONSAVEL.nif}, em{" "}
          {RESPONSAVEL.pais}. Contacto: <strong>{RESPONSAVEL.email}</strong>.
        </p>
        <p>
          Ao aceitares estes termos celebras um contrato com essa entidade. Se
          nao concordares com eles, nao uses a aplicacao.
        </p>
      </Seccao>

      <Seccao numero={2} titulo="O que a aplicacao faz">
        <p>
          A aplicacao serve para registares as tuas medidas corporais ao longo do
          tempo -- peso, perimetros, gordura corporal e massa muscular -- e para
          veres como evoluem por dias, semanas e meses.
        </p>
      </Seccao>

      <Seccao numero={3} titulo="O que a aplicacao nao e">
        <p>
          <strong>
            Esta aplicacao nao presta cuidados de saude nem aconselhamento
            medico.
          </strong>{" "}
          Os numeros que registas e os graficos que vES sao um registo do que tu
          proprio mediste, e nada mais. Nao sao um diagnostico, nao sao uma
          avaliacao clinica e nao substituem a opiniao de um medico, de um
          nutricionista ou de outro profissional de saude.
        </p>
        <p>
          Nao tomes decisoes sobre alimentacao, medicacao, treino ou tratamento
          com base apenas no que aqui vES. Se tens uma condicao de saude, ou se
          alguma coisa nos teus valores te preocupa, fala com um profissional.
        </p>
        <p>
          A aplicacao nao faz alertas clinicos: nao te avisa se um valor for
          preocupante, porque nao tem como saber o que e preocupante para ti.
        </p>
      </Seccao>

      <Seccao numero={4} titulo="A tua conta">
        <Lista
          itens={[
            "Esta aplicacao e de acesso restrito. Nao ha registo publico: as contas sao criadas pelo responsavel, a pedido ou por convite.",
            "A tua conta e pessoal e intransmissivel. Nao a partilhes nem deixes a tua palavra-passe acessivel a outras pessoas.",
            "Quando a conta e criada, ou quando a palavra-passe e reposta, recebes uma palavra-passe temporaria. Tens de a mudar na primeira entrada, e a aplicacao nao te deixa avancar sem isso.",
            "O responsavel nao consegue ver a tua palavra-passe, nem antes nem depois de a mudares. Se a perderes, a unica via e pedir que seja reposta.",
            `Para teres conta tens de ter pelo menos ${IDADE_MINIMA} anos.`,
            "Avisa de imediato o responsavel se suspeitares que alguem entrou na tua conta.",
          ]}
        />
      </Seccao>

      <Seccao numero={5} titulo="Uso aceitavel">
        <p>Ao usar a aplicacao, comprometes-te a nao:</p>
        <Lista
          itens={[
            "tentar aceder a dados de outra pessoa, ou a partes da aplicacao a que a tua conta nao da acesso;",
            "registar dados de outra pessoa sem o consentimento dela;",
            "tentar interromper, sobrecarregar ou contornar os mecanismos de seguranca do servico;",
            "usar a aplicacao para fins ilegais.",
          ]}
        />
      </Seccao>

      <Seccao numero={6} titulo="Os dados que registas">
        <p>
          Os dados que introduzes sao teus. O tratamento que lhes e dado esta
          descrito na Politica de Privacidade, que faz parte integrante destes
          termos.
        </p>
        <p>
          Podes exportar tudo o que registaste, a qualquer momento, em JSON ou em
          CSV, a partir do separador Historico.
        </p>
      </Seccao>

      <Seccao numero={7} titulo="Disponibilidade">
        <p>
          O servico e fornecido tal como esta, sem garantia de funcionamento
          ininterrupto. Pode haver periodos de indisponibilidade por manutencao,
          avaria ou falha de fornecedores.
        </p>
        <p>
          Faz as tuas proprias copias de seguranca, exportando os dados de vez em
          quando. E a forma de nao ficares dependente da disponibilidade deste
          servico.
        </p>
      </Seccao>

      <Seccao numero={8} titulo="Responsabilidade">
        <p>
          Na medida maxima permitida pela lei aplicavel, o responsavel nao
          responde por danos indiretos, perda de lucros ou perda de dados
          decorrentes do uso ou da impossibilidade de uso da aplicacao.
        </p>
        <p>
          Nada nestes termos exclui ou limita a responsabilidade que a lei nao
          permita excluir ou limitar, designadamente por dolo ou culpa grave, nem
          prejudica os direitos que a lei te confere enquanto consumidor.
        </p>
      </Seccao>

      <Seccao numero={9} titulo="Suspensao e fim do servico">
        <p>
          Podes deixar de usar a aplicacao quando quiseres e pedir o apagamento
          da conta pelo contacto indicado. O apagamento leva consigo o perfil e
          todas as medidas.
        </p>
        <p>
          O responsavel pode suspender ou encerrar uma conta que viole estes
          termos, ou descontinuar o servico, avisando com antecedencia razoavel e
          dando oportunidade de exportar os dados antes disso.
        </p>
      </Seccao>

      <Seccao numero={10} titulo="Alteracoes a estes termos">
        <p>
          Se estes termos mudarem de forma substantiva, a versao muda tambem e
          ser-te-a pedido que os aceites de novo na entrada seguinte. Se nao
          aceitares, podes exportar os dados e pedir o apagamento da conta.
        </p>
      </Seccao>

      <Seccao numero={11} titulo="Lei aplicavel">
        <p>
          Aplica-se a lei portuguesa. Enquanto consumidor, mantens o direito de
          recorrer aos tribunais do teu lugar de residencia e as entidades de
          resolucao alternativa de litigios de consumo.
        </p>
      </Seccao>

      <Seccao numero={12} titulo="Contacto">
        <p>
          {RESPONSAVEL.nome} &middot; {RESPONSAVEL.email}
        </p>
      </Seccao>
    </LegalDoc>
  );
}
