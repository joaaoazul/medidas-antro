import type { Metadata } from "next";
import LegalDoc, { Lista, Seccao } from "@/components/LegalDoc";
import { IDADE_MINIMA, RESPONSAVEL, VERSAO_PRIVACIDADE } from "@/lib/legal";

export const metadata: Metadata = { title: "Politica de Privacidade - Medidas" };

export default function PrivacidadePage() {
  return (
    <LegalDoc titulo="Politica de Privacidade" versao={VERSAO_PRIVACIDADE}>
      <Seccao numero={1} titulo="Quem trata os teus dados">
        <p>
          O responsavel pelo tratamento e {RESPONSAVEL.nome}, com morada em{" "}
          {RESPONSAVEL.morada}, contribuinte n.o {RESPONSAVEL.nif}, em{" "}
          {RESPONSAVEL.pais}. Para qualquer assunto relacionado com os teus
          dados, escreve para <strong>{RESPONSAVEL.email}</strong>.
        </p>
      </Seccao>

      <Seccao numero={2} titulo="Que dados sao recolhidos">
        <p>Apenas estes, e nenhuns outros:</p>
        <Lista
          itens={[
            <>
              <strong>Conta:</strong> o teu endereco de email e a tua
              palavra-passe. A palavra-passe e guardada cifrada e nunca fica
              legivel, nem para o responsavel.
            </>,
            <>
              <strong>Perfil:</strong> nome, data de nascimento, sexo (opcional),
              altura, objetivo, peso pretendido, treinos por semana e as notas
              que escreveres.
            </>,
            <>
              <strong>Medidas:</strong> peso, perimetro abdominal, percentagem de
              gordura corporal, massa muscular e perimetros do peito, anca, braco
              e coxa, cada um com a data a que dizem respeito, e a nota que
              associares a esse dia.
            </>,
            <>
              <strong>Consentimento:</strong> que documento aceitaste, em que
              versao e em que momento.
            </>,
            <>
              <strong>Tecnicos:</strong> um cookie que te mantem com sessao
              iniciada. Nao ha analitica, nao ha rastreio, nao ha publicidade,
              nao ha gravacao de sessao e nao ha cookies de terceiros. O tipo de
              letra e servido a partir deste mesmo servidor, por isso o teu
              browser nao contacta a Google ao abrir a aplicacao.
            </>,
          ]}
        />
      </Seccao>

      <Seccao numero={3} titulo="Estes sao dados de saude">
        <p>
          O peso, a gordura corporal e os perimetros dizem respeito a tua saude
          fisica. O Regulamento Geral sobre a Protecao de Dados trata-os como
          categoria especial, no Artigo 9.o, com protecao reforcada face a dados
          comuns.
        </p>
        <p>
          O fundamento para os tratar e o{" "}
          <strong>teu consentimento explicito</strong>, ao abrigo do Artigo 9.o,
          n.o 2, alinea a). Para a existencia da conta em si, o fundamento e a
          execucao do contrato entre ti e o responsavel, ao abrigo do Artigo 6.o,
          n.o 1, alinea b).
        </p>
        <p>
          Podes retirar o consentimento a qualquer momento (ponto 8). Retirar o
          consentimento nao torna ilegitimo o tratamento feito antes disso, mas
          faz cessar o tratamento a partir desse momento.
        </p>
      </Seccao>

      <Seccao numero={4} titulo="Para que servem">
        <p>
          Unicamente para te mostrar a ti a tua propria evolucao ao longo do
          tempo, e para manter a tua conta a funcionar.
        </p>
        <p>
          Nao sao vendidos. Nao sao cedidos a terceiros para marketing. Nao
          alimentam perfis publicitarios. Nao sao usados para treinar modelos de
          inteligencia artificial. Nao ha decisoes automatizadas nem definicao de
          perfis com efeitos juridicos sobre ti.
        </p>
      </Seccao>

      <Seccao numero={5} titulo="Quem lhes chega">
        <Lista
          itens={[
            <>
              <strong>Tu.</strong> Com a tua sessao iniciada, e mais ninguem.
            </>,
            <>
              <strong>{RESPONSAVEL.nome}</strong>, como responsavel, para gerir
              contas: criar, repor palavras-passe e remover. A gestao de contas
              nao da acesso as medidas nem ao perfil de ninguem -- a base de
              dados recusa esse acesso, e nao e uma questao de confianca nem de
              politica interna.
            </>,
            <>
              <strong>Supabase</strong>, como subcontratante, que aloja a base de
              dados e o servico de autenticacao. Os servidores deste projeto
              estao em Paris, na Uniao Europeia.
            </>,
          ]}
        />
        <p>
          Os dados so sao entregues a autoridades se existir uma obrigacao legal
          para isso.
        </p>
      </Seccao>

      <Seccao numero={6} titulo="Onde ficam guardados">
        <p>
          Numa base de dados alojada pela Supabase, na regiao de Paris, dentro da
          Uniao Europeia. A Supabase e uma entidade com sede fora do Espaco
          Economico Europeu; o tratamento esta abrangido pelo acordo de
          subcontratacao celebrado com o responsavel e pelas clausulas
          contratuais-tipo da Comissao Europeia, para o caso de algum acesso de
          suporte ocorrer a partir de fora do EEE.
        </p>
        <p>
          O acesso a aplicacao faz-se sempre por ligacao cifrada. Cada conta so
          consegue ler e escrever as suas proprias linhas, por regras aplicadas
          dentro da propria base de dados.
        </p>
      </Seccao>

      <Seccao numero={7} titulo="Durante quanto tempo">
        <p>
          Enquanto a tua conta existir. Quando a conta e apagada, o perfil e
          todas as medidas sao apagados com ela, de imediato e sem copia
          separada.
        </p>
        <p>
          Os registos de consentimento sao conservados enquanto forem necessarios
          para demonstrar o cumprimento do RGPD, e no maximo cinco anos apos o
          fim da conta.
        </p>
      </Seccao>

      <Seccao numero={8} titulo="Os teus direitos">
        <p>Tens direito a:</p>
        <Lista
          itens={[
            <>
              <strong>Aceder</strong> aos teus dados. A aplicacao ja to permite a
              qualquer momento, no separador Historico.
            </>,
            <>
              <strong>Corrigir</strong> o que estiver errado. Podes editar
              qualquer registo diretamente na aplicacao.
            </>,
            <>
              <strong>Apagar</strong> registos ou a conta inteira. Pede o
              apagamento da conta pelo contacto abaixo.
            </>,
            <>
              <strong>Portabilidade:</strong> levar os dados contigo. A aplicacao
              exporta tudo em JSON e em CSV, formatos abertos, com um toque.
            </>,
            <>
              <strong>Retirar o consentimento</strong> e opor-te ao tratamento.
            </>,
            <>
              <strong>Limitar</strong> o tratamento enquanto uma contestacao tua
              estiver a ser analisada.
            </>,
          ]}
        />
        <p>
          Para exercer qualquer um destes direitos, escreve para{" "}
          <strong>{RESPONSAVEL.email}</strong>. A resposta chega no prazo maximo
          de um mes.
        </p>
        <p>
          Se achares que os teus dados nao estao a ser tratados como devem, podes
          apresentar reclamacao a Comissao Nacional de Protecao de Dados, em
          www.cnpd.pt.
        </p>
      </Seccao>

      <Seccao numero={9} titulo="Seguranca">
        <Lista
          itens={[
            "As palavras-passe sao guardadas cifradas, com funcao propria para o efeito. Ninguem as consegue ler.",
            "Toda a comunicacao com a aplicacao e cifrada em transito.",
            "O isolamento entre contas e imposto pela base de dados, linha a linha, e nao pelo codigo da aplicacao. Um erro de programacao nao chega para expor os dados de outra pessoa.",
            "Nao existem contas publicas: so o responsavel cria contas.",
          ]}
        />
        <p>
          Nenhum sistema e inviolavel. Se houver uma violacao de dados com risco
          para ti, serao cumpridos os prazos de notificacao previstos nos Artigos
          33.o e 34.o do RGPD.
        </p>
      </Seccao>

      <Seccao numero={10} titulo="Menores">
        <p>
          Esta aplicacao nao se destina a menores de {IDADE_MINIMA} anos. Nao e
          pedida nem tratada qualquer informacao de menores dessa idade sem o
          consentimento de quem exerce as responsabilidades parentais.
        </p>
      </Seccao>

      <Seccao numero={11} titulo="Alteracoes a esta politica">
        <p>
          Se esta politica mudar de forma substantiva, a versao muda tambem e
          ser-te-a pedido que a aceites de novo na entrada seguinte. As versoes
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
