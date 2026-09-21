import type { Metadata } from "next";
import LegalDoc, { Lista, Seccao } from "@/components/LegalDoc";
import {
  IDADE_MINIMA,
  RESPONSAVEL,
  VERSAO_TERMOS,
  identificacaoResponsavel,
} from "@/lib/legal";

export const metadata: Metadata = { title: "Termos de Serviço - Medidas" };

export default function TermosPage() {
  return (
    <LegalDoc titulo="Termos de Serviço" versao={VERSAO_TERMOS}>
      <Seccao numero={1} titulo="Quem fornece o serviço">
        <p>
          A aplicação Medidas é fornecida por {identificacaoResponsavel()}.
          Contacto: <strong>{RESPONSAVEL.email}</strong>.
        </p>
        <p>
          Ao aceitares estes termos celebras um contrato com essa entidade. Se
          não concordares com eles, não uses a aplicação.
        </p>
      </Seccao>

      <Seccao numero={2} titulo="O que a aplicação faz">
        <p>
          A aplicação serve para registares as tuas medidas corporais ao longo
          do tempo -- peso, perímetros, gordura corporal e massa muscular -- e
          para veres como evoluem por dias, semanas e meses.
        </p>
      </Seccao>

      <Seccao numero={3} titulo="O que a aplicação não é">
        <p>
          <strong>
            Esta aplicação não presta cuidados de saúde nem aconselhamento
            médico.
          </strong>{" "}
          Os números que registas e os gráficos que vês são um registo do que tu
          próprio mediste, e nada mais. Não são um diagnóstico, não são uma
          avaliação clínica e não substituem a opinião de um médico, de um
          nutricionista ou de outro profissional de saúde.
        </p>
        <p>
          Não tomes decisões sobre alimentação, medicação, treino ou tratamento
          com base apenas no que aqui vês. Se tens uma condição de saúde, ou se
          alguma coisa nos teus valores te preocupa, fala com um profissional.
        </p>
        <p>
          A aplicação não faz alertas clínicos: não te avisa se um valor for
          preocupante, porque não tem como saber o que é preocupante para ti.
        </p>
      </Seccao>

      <Seccao numero={4} titulo="A tua conta">
        <Lista
          itens={[
            "Esta aplicação é de acesso restrito. Não há registo público: as contas são criadas pelo responsável, a pedido ou por convite.",
            "A tua conta é pessoal e intransmissível. Não a partilhes nem deixes a tua palavra-passe acessível a outras pessoas.",
            "Quando a conta é criada, ou quando a palavra-passe é reposta, recebes uma palavra-passe temporária. Tens de a mudar na primeira entrada, e a aplicação não te deixa avançar sem isso.",
            "O responsável não consegue ver a tua palavra-passe, nem antes nem depois de a mudares. Se a perderes, a única via é pedir que seja reposta.",
            `Para teres conta tens de ter pelo menos ${IDADE_MINIMA} anos.`,
            "Avisa de imediato o responsável se suspeitares que alguém entrou na tua conta.",
          ]}
        />
      </Seccao>

      <Seccao numero={5} titulo="Uso aceitável">
        <p>Ao usar a aplicação, comprometes-te a não:</p>
        <Lista
          itens={[
            "tentar aceder a dados de outra pessoa, ou a partes da aplicação a que a tua conta não dá acesso;",
            "registar dados de outra pessoa sem o consentimento dela;",
            "tentar interromper, sobrecarregar ou contornar os mecanismos de segurança do serviço;",
            "usar a aplicação para fins ilegais.",
          ]}
        />
      </Seccao>

      <Seccao numero={6} titulo="Os dados que registas">
        <p>
          Os dados que introduzes são teus. O tratamento que lhes é dado está
          descrito na Política de Privacidade, que faz parte integrante destes
          termos.
        </p>
        <p>
          Podes exportar tudo o que registaste, a qualquer momento, em JSON ou
          em CSV, a partir do separador Histórico.
        </p>
      </Seccao>

      <Seccao numero={7} titulo="Disponibilidade">
        <p>
          O serviço é fornecido tal como está, sem garantia de funcionamento
          ininterrupto. Pode haver períodos de indisponibilidade por manutenção,
          avaria ou falha de fornecedores.
        </p>
        <p>
          Faz as tuas próprias cópias de segurança, exportando os dados de vez
          em quando. É a forma de não ficares dependente da disponibilidade
          deste serviço.
        </p>
      </Seccao>

      <Seccao numero={8} titulo="Responsabilidade">
        <p>
          Na medida máxima permitida pela lei aplicável, o responsável não
          responde por danos indiretos, perda de lucros ou perda de dados
          decorrentes do uso ou da impossibilidade de uso da aplicação.
        </p>
        <p>
          Nada nestes termos exclui ou limita a responsabilidade que a lei não
          permita excluir ou limitar, designadamente por dolo ou culpa grave,
          nem prejudica os direitos que a lei te confere enquanto consumidor.
        </p>
      </Seccao>

      <Seccao numero={9} titulo="Suspensão e fim do serviço">
        <p>
          Podes deixar de usar a aplicação quando quiseres e pedir o apagamento
          da conta pelo contacto indicado. O apagamento leva consigo o perfil e
          todas as medidas.
        </p>
        <p>
          O responsável pode suspender ou encerrar uma conta que viole estes
          termos, ou descontinuar o serviço, avisando com antecedência razoável
          e dando oportunidade de exportar os dados antes disso.
        </p>
      </Seccao>

      <Seccao numero={10} titulo="Alterações a estes termos">
        <p>
          Se estes termos mudarem de forma substantiva, a versão muda também e
          ser-te-á pedido que os aceites de novo na entrada seguinte. Se não
          aceitares, podes exportar os dados e pedir o apagamento da conta.
        </p>
      </Seccao>

      <Seccao numero={11} titulo="Lei aplicável">
        <p>
          Aplica-se a lei portuguesa. Enquanto consumidor, mantens o direito de
          recorrer aos tribunais do teu lugar de residência e às entidades de
          resolução alternativa de litígios de consumo.
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
