import type { Metadata } from "next";
import LegalDoc, { Lista, Seccao } from "@/components/LegalDoc";
import {
  IDADE_MINIMA,
  RESPONSAVEL,
  VERSAO_PRIVACIDADE,
  identificacaoResponsavel,
} from "@/lib/legal";

export const metadata: Metadata = {
  title: "Política de Privacidade - Medidas",
};

export default function PrivacidadePage() {
  return (
    <LegalDoc titulo="Política de Privacidade" versao={VERSAO_PRIVACIDADE}>
      <Seccao numero={1} titulo="Quem trata os teus dados">
        <p>
          O responsável pelo tratamento é {identificacaoResponsavel()}. Para
          qualquer assunto relacionado com os teus dados, escreve para{" "}
          <strong>{RESPONSAVEL.email}</strong>.
        </p>
      </Seccao>

      <Seccao numero={2} titulo="Que dados são recolhidos">
        <p>Apenas estes, e nenhuns outros:</p>
        <Lista
          itens={[
            <>
              <strong>Conta:</strong> o teu endereço de email e a tua
              palavra-passe. A palavra-passe é guardada cifrada e nunca fica
              legível, nem para o responsável.
            </>,
            <>
              <strong>Perfil:</strong> nome, data de nascimento, sexo
              (opcional), altura, objetivo, peso pretendido, treinos por semana
              e as notas que escreveres.
            </>,
            <>
              <strong>Medidas:</strong> peso, perímetro abdominal, percentagem
              de gordura corporal, massa muscular e perímetros do peito, anca,
              braço e coxa, cada um com a data a que dizem respeito, e a nota
              que associares a esse dia.
            </>,
            <>
              <strong>Consentimento:</strong> que documento aceitaste, em que
              versão e em que momento.
            </>,
            <>
              <strong>Técnicos:</strong> um cookie que te mantém com sessão
              iniciada. Não há analítica, não há rastreio, não há publicidade,
              não há gravação de sessão e não há cookies de terceiros. O tipo de
              letra é servido a partir deste mesmo servidor, por isso o teu
              browser não contacta a Google ao abrir a aplicação.
            </>,
          ]}
        />
      </Seccao>

      <Seccao numero={3} titulo="Estes são dados de saúde">
        <p>
          O peso, a gordura corporal e os perímetros dizem respeito à tua saúde
          física. O Regulamento Geral sobre a Proteção de Dados trata-os como
          categoria especial, no Artigo 9.º, com proteção reforçada face a dados
          comuns.
        </p>
        <p>
          O fundamento para os tratar é o{" "}
          <strong>teu consentimento explícito</strong>, ao abrigo do Artigo 9.º,
          n.º 2, alínea a). Para a existência da conta em si, o fundamento é a
          execução do contrato entre ti e o responsável, ao abrigo do Artigo
          6.º, n.º 1, alínea b).
        </p>
        <p>
          Podes retirar o consentimento a qualquer momento (ponto 8). Retirar o
          consentimento não torna ilegítimo o tratamento feito antes disso, mas
          faz cessar o tratamento a partir desse momento.
        </p>
      </Seccao>

      <Seccao numero={4} titulo="Para que servem">
        <p>
          Unicamente para te mostrar a ti a tua própria evolução ao longo do
          tempo, e para manter a tua conta a funcionar.
        </p>
        <p>
          Não são vendidos. Não são cedidos a terceiros para marketing. Não
          alimentam perfis publicitários. Não são usados para treinar modelos de
          inteligência artificial. Não há decisões automatizadas nem definição
          de perfis com efeitos jurídicos sobre ti.
        </p>
      </Seccao>

      <Seccao numero={5} titulo="Quem lhes chega">
        <Lista
          itens={[
            <>
              <strong>Tu.</strong> Com a tua sessão iniciada, e mais ninguém.
            </>,
            <>
              <strong>{RESPONSAVEL.nome}</strong>, como responsável, para gerir
              contas: criar, repor palavras-passe e remover. A gestão de contas
              não dá acesso às medidas nem ao perfil de ninguém -- a base de
              dados recusa esse acesso, e não é uma questão de confiança nem de
              política interna.
            </>,
            <>
              <strong>Supabase</strong>, como subcontratante, que aloja a base
              de dados e o serviço de autenticação. Os servidores deste projeto
              estão em Paris, na União Europeia.
            </>,
          ]}
        />
        <p>
          Os dados só são entregues a autoridades se existir uma obrigação legal
          para isso.
        </p>
      </Seccao>

      <Seccao numero={6} titulo="Onde ficam guardados">
        <p>
          Numa base de dados alojada pela Supabase, na região de Paris, dentro
          da União Europeia. A Supabase é uma entidade com sede fora do Espaço
          Económico Europeu; o tratamento está abrangido pelo acordo de
          subcontratação celebrado com o responsável e pelas cláusulas
          contratuais-tipo da Comissão Europeia, para o caso de algum acesso de
          suporte ocorrer a partir de fora do EEE.
        </p>
        <p>
          O acesso à aplicação faz-se sempre por ligação cifrada. Cada conta só
          consegue ler e escrever as suas próprias linhas, por regras aplicadas
          dentro da própria base de dados.
        </p>
      </Seccao>

      <Seccao numero={7} titulo="Durante quanto tempo">
        <p>
          Enquanto a tua conta existir. Quando a conta é apagada, o perfil e
          todas as medidas são apagados com ela, de imediato e sem cópia
          separada.
        </p>
        <p>
          Os registos de consentimento são conservados enquanto forem
          necessários para demonstrar o cumprimento do RGPD, e no máximo cinco
          anos após o fim da conta.
        </p>
      </Seccao>

      <Seccao numero={8} titulo="Os teus direitos">
        <p>Tens direito a:</p>
        <Lista
          itens={[
            <>
              <strong>Aceder</strong> aos teus dados. A aplicação já to permite
              a qualquer momento, no separador Histórico.
            </>,
            <>
              <strong>Corrigir</strong> o que estiver errado. Podes editar
              qualquer registo diretamente na aplicação.
            </>,
            <>
              <strong>Apagar</strong> registos ou a conta inteira. Pede o
              apagamento da conta pelo contacto abaixo.
            </>,
            <>
              <strong>Portabilidade:</strong> levar os dados contigo. A
              aplicação exporta tudo em JSON e em CSV, formatos abertos, com um
              toque.
            </>,
            <>
              <strong>Retirar o consentimento</strong> e opor-te ao tratamento.
            </>,
            <>
              <strong>Limitar</strong> o tratamento enquanto uma contestação tua
              estiver a ser analisada.
            </>,
          ]}
        />
        <p>
          Para exercer qualquer um destes direitos, escreve para{" "}
          <strong>{RESPONSAVEL.email}</strong>. A resposta chega no prazo máximo
          de um mês.
        </p>
        <p>
          Se achares que os teus dados não estão a ser tratados como devem,
          podes apresentar reclamação à Comissão Nacional de Proteção de Dados,
          em www.cnpd.pt.
        </p>
      </Seccao>

      <Seccao numero={9} titulo="Segurança">
        <Lista
          itens={[
            "As palavras-passe são guardadas cifradas, com função própria para o efeito. Ninguém as consegue ler.",
            "Toda a comunicação com a aplicação é cifrada em trânsito.",
            "O isolamento entre contas é imposto pela base de dados, linha a linha, e não pelo código da aplicação. Um erro de programação não chega para expor os dados de outra pessoa.",
            "Não existem contas públicas: só o responsável cria contas.",
          ]}
        />
        <p>
          Nenhum sistema é inviolável. Se houver uma violação de dados com risco
          para ti, serão cumpridos os prazos de notificação previstos nos
          Artigos 33.º e 34.º do RGPD.
        </p>
      </Seccao>

      <Seccao numero={10} titulo="Menores">
        <p>
          Esta aplicação não se destina a menores de {IDADE_MINIMA} anos. Não é
          pedida nem tratada qualquer informação de menores dessa idade sem o
          consentimento de quem exerce as responsabilidades parentais.
        </p>
      </Seccao>

      <Seccao numero={11} titulo="Alterações a esta política">
        <p>
          Se esta política mudar de forma substantiva, a versão muda também e
          ser-te-á pedido que a aceites de novo na entrada seguinte. As versões
          que aceitaste ficam registadas.
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
