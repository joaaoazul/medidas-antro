/**
 * Conteudo informativo geral sobre medidas e o corpo, mostrado em /artigos.
 *
 * E texto estatico, escrito uma vez e servido a todos -- nao e o registo de
 * ninguem, por isso nao passa pelas politicas de RLS nem pela fronteira de
 * lib/repo.ts. Nao e aconselhamento medico: cada artigo repete isso, e o
 * aviso tambem vive na pagina em si, nao so aqui.
 */
export type Article = {
  slug: string;
  titulo: string;
  resumo: string;
  corpo: string[];
};

export const ARTICLES: Article[] = [
  {
    slug: "porque-o-peso-varia",
    titulo: "Porque o peso varia de um dia para o outro",
    resumo:
      "Um quilo a mais ou a menos de um dia para o outro raramente é gordura -- é água, sal, digestão e sono.",
    corpo: [
      "O peso na balança não é só gordura: inclui água, o conteúdo do intestino e da bexiga, e o glicogénio nos músculos, que retém água consigo. Comer mais sal ou hidratos num dia, dormir pior, ou uma fase do ciclo hormonal podem mover a balança um a dois quilos sem que a massa gorda tenha mudado nada.",
      "Por isso uma única pesagem conta pouco. O que importa é a tendência ao longo de semanas: é para isso que serve o separador Evolução, a agrupar por semana ou mês em vez de olhar para um dia isolado.",
      "Isto é informação geral, não é aconselhamento médico. Se uma variação de peso te preocupar, ou for maior e mais rápida do que o habitual, fala com um profissional de saúde.",
    ],
  },
  {
    slug: "peso-nao-e-gordura",
    titulo: "Peso não é gordura",
    resumo:
      "Duas pessoas com o mesmo peso podem ter composições corporais muito diferentes -- é por isso que a app segue mais do que um número.",
    corpo: [
      "A balança mede a força da gravidade sobre ti, não do que és feito. Músculo é mais denso do que gordura -- ocupa menos espaço para o mesmo peso -- por isso duas pessoas com o mesmo peso e altura podem ter aspetos muito diferentes, consoante a proporção de massa muscular e gordura corporal.",
      "É por isso que a app regista a percentagem de gordura corporal e os perímetros a par do peso: uma pessoa pode manter o peso e ver o abdómen a encolher e o braço a crescer, o que a balança sozinha nunca mostraria.",
      "Isto é informação geral, não é aconselhamento médico. A forma mais fiável de medir a composição corporal (bioimpedância, DEXA, dobras cutâneas) exige equipamento que esta app não usa -- os valores que aqui registas são o que tu próprio mediste, com a fiabilidade do método que usaste.",
    ],
  },
  {
    slug: "medir-o-perimetro-abdominal",
    titulo: "Como medir o perímetro abdominal com consistência",
    resumo:
      "A fita métrica engana facilmente. Um método sempre igual importa mais do que um método perfeito.",
    corpo: [
      "O erro mais comum é medir num sítio diferente de cada vez. Usa sempre o mesmo ponto de referência -- geralmente ao nível do umbigo -- e mede por cima da pele, não da roupa.",
      "Respira normalmente e mede no fim de expirar, sem encolher a barriga nem prender a respiração: os dois mudam a leitura vários centímetros para o mesmo corpo. A fita deve tocar a pele sem apertar.",
      "O que faz um número comparável ao seguinte não é a precisão absoluta -- é repetir sempre o mesmo gesto, à mesma hora do dia, se conseguires.",
      "Isto é informação geral, não é aconselhamento médico.",
    ],
  },
  {
    slug: "sempre-a-mesma-hora",
    titulo: "Porque medir sempre à mesma hora",
    resumo:
      "Comer, beber e o que vestes mudam a balança em pouco tempo. Medir na mesma janela do dia tira esse ruído do meio.",
    corpo: [
      "Entre acordar em jejum e o fim do dia depois de comer e beber, o peso de uma pessoa pode variar um a dois quilos -- sem que nada tenha realmente mudado no corpo. Se um dia te pesas de manhã e no outro à noite, estás a comparar duas coisas diferentes e a chamar-lhe tendência.",
      "A manhã, depois de acordar e antes de comer ou beber, tende a ser a janela mais estável para a maioria das pessoas -- é por isso que o formulário da app vem com a hora atual preenchida, mas deixa-a livre para ajustares.",
      "Isto é informação geral, não é aconselhamento médico.",
    ],
  },
  {
    slug: "tendencia-importa-mais",
    titulo: "A tendência importa mais do que um único número",
    resumo:
      "Uma medição isolada é um ponto. Só uma sequência de pontos conta alguma coisa sobre a direção que levas.",
    corpo: [
      "Qualquer valor isolado -- um peso, um perímetro -- está sujeito ao ruído do dia: o que comeste, como dormiste, a hora a que mediste. Olhar só para esse número é como julgar o tempo por um único instante em vez de olhar a previsão da semana.",
      "O separador Evolução existe por isto: agrupar por semana ou por mês reduz o ruído e deixa ver a direção real. Uma subida de um dia para o outro diz muito pouco; uma subida sustida ao longo de várias semanas diz muito mais.",
      "Isto é informação geral, não é aconselhamento médico. Se tens uma condição de saúde ou dúvidas sobre os teus valores, fala com um profissional de saúde -- esta app regista o que lhe dizes, não interpreta o que isso significa para ti.",
    ],
  },
  {
    slug: "sono-e-o-peso",
    titulo: "Sono e o peso",
    resumo:
      "Uma noite maldormida muda a balança no dia seguinte -- mas raramente é gordura a mais.",
    corpo: [
      "Depois de uma noite maldormida, é fácil pesar-te a mais e pensar que engordaste de um dia para o outro. Não é isso que está a acontecer: dormir pouco muda os níveis de duas hormonas que regulam o apetite -- a grelina, que estimula a fome, sobe; a leptina, que sinaliza saciedade, desce. O efeito mais comum é comer mais nesse dia, não ganhar gordura durante a noite.",
      "A privação de sono também mexe no equilíbrio de eletrólitos e fluidos do corpo, o que pode explicar parte da variação que vês na balança na manhã seguinte. A relação com o cortisol, a hormona associada ao stress, é menos consistente na investigação -- alguns estudos encontram-no elevado depois de uma noite maldormida, outros não veem diferença.",
      "Isto é informação geral, não é aconselhamento médico. Dificuldade em dormir com regularidade é algo a levar a um profissional de saúde, para além do que a balança mostra.",
    ],
  },
  {
    slug: "fiabilidade-das-balancas-de-gordura",
    titulo: "Porque as balanças de gordura corporal variam tanto",
    resumo:
      "A percentagem de gordura que a balança mostra depende de quanta água tens no corpo nesse momento -- não só da gordura em si.",
    corpo: [
      "As balanças de gordura corporal, e a maioria dos medidores de bioimpedância, não medem gordura diretamente: passam uma corrente elétrica fraca pelo corpo e usam a resistência que encontram para estimar quanta água tens, e a partir daí calculam a percentagem de gordura. Isso significa que o resultado depende do teu nível de hidratação nesse instante -- depois de exercício, de álcool, ou logo ao acordar, a leitura pode variar vários pontos percentuais sem a tua composição corporal ter mudado nada.",
      "Estudos que comparam estas balanças com métodos de referência, como a absorciometria de raios-X, encontram margens de erro largas -- a diferença pode chegar a 15 ou 20 pontos percentuais em casos individuais, mesmo quando a média de um grupo parece razoável. Por isso um valor isolado vale menos do que a direção que toma ao longo de semanas, medido sempre nas mesmas condições.",
      "Isto é informação geral, não é aconselhamento médico.",
    ],
  },
  {
    slug: "ciclo-menstrual-e-peso",
    titulo: "Ciclo menstrual e flutuações de peso",
    resumo:
      "Para quem menstrua, o peso pode variar de forma previsível ao longo do ciclo -- e não tem que ver com gordura.",
    corpo: [
      "Para quem tem ciclo menstrual, o peso costuma ser mais alto durante a menstruação e mais baixo logo a seguir -- em média cerca de meio quilo de diferença, embora varie de pessoa para pessoa. A causa não é gordura: é retenção de líquidos. A progesterona, que sobe na segunda metade do ciclo, eleva outras hormonas que levam o corpo a reter mais água, um efeito que costuma atingir o pico à volta do início da menstruação.",
      "Reconhecer este padrão ajuda a não interpretar mal uma subida de peso que é cíclica e previsível. Ver a Evolução num intervalo de 30 dias, em vez de dia a dia, costuma deixar o padrão mais visível do que qualquer medição isolada.",
      "Isto é informação geral, não é aconselhamento médico. Variações fora do padrão habitual, ou acompanhadas de outros sintomas, são conversa para um profissional de saúde.",
    ],
  },
  {
    slug: "recomposicao-corporal",
    titulo: "Podes manter o peso e mudar de forma",
    resumo:
      "Ganhar músculo e perder gordura ao mesmo tempo é possível -- e nesse caso a balança pode não se mexer nada.",
    corpo: [
      "É possível ganhar massa muscular e perder gordura ao mesmo tempo -- chama-se recomposição corporal, e acontece sobretudo com treino de força regular e uma ingestão de proteína adequada. Como o músculo é mais denso do que a gordura, os dois efeitos podem quase anular-se na balança: o peso total mal se mexe, mesmo que o corpo esteja visivelmente diferente.",
      "É por isto que olhar só para o peso pode enganar durante uma fase destas. A gordura corporal e os perímetros costumam mostrar a mudança que a balança sozinha esconde -- é a razão de esta app pedir mais do que um número.",
      "Isto é informação geral, não é aconselhamento médico.",
    ],
  },
  {
    slug: "limitacoes-do-imc",
    titulo: "As limitações do IMC",
    resumo:
      "O Índice de Massa Corporal não distingue músculo de gordura, nem diz onde no corpo ela está -- e isso importa.",
    corpo: [
      "O Índice de Massa Corporal (IMC) é só o peso a dividir pela altura ao quadrado. É fácil de calcular, mas não distingue massa muscular de gordura, e não diz nada sobre onde no corpo a gordura está -- e isso importa mais do que o número sozinho sugere. A gordura à volta dos órgãos, mais comum na zona abdominal, está mais associada a risco metabólico do que o tamanho geral do corpo.",
      "É por isso que o perímetro abdominal é uma medida útil a par do peso: duas pessoas com o mesmo IMC podem ter riscos muito diferentes, consoante onde a gordura se concentra. Esta app não calcula um IMC de propósito -- prefere mostrar-te os números que realmente registas.",
      "Isto é informação geral, não é aconselhamento médico.",
    ],
  },
  {
    slug: "quanto-pesa-a-agua",
    titulo: "Quanto pesa a água que bebes",
    resumo:
      "Um litro de água pesa cerca de um quilo, e o corpo demora horas a distribuí-lo. Bebeste antes de te pesar? É isso que estás a ver.",
    corpo: [
      "A água é simples de explicar: um litro pesa cerca de um quilo, por isso beber meio litro antes de subir para a balança soma meio quilo à leitura, sem exceção nenhuma. O corpo demora várias horas a absorver e a distribuir esse líquido pelos tecidos, por isso o efeito não desaparece de imediato.",
      "O mesmo vale ao contrário: depois de suar bastante -- exercício, calor, um dia de praia -- a balança mostra menos peso, mas é água perdida, não gordura. Volta assim que bebes o suficiente para repor.",
      "É mais uma razão para medir sempre nas mesmas condições, e para não ler uma pesagem isolada como se fosse gordura a mais ou a menos. Isto é informação geral, não é aconselhamento médico.",
    ],
  },
  {
    slug: "perda-de-peso-nao-e-linear",
    titulo: "Porque a perda de peso não é uma linha reta",
    resumo:
      "As primeiras semanas descem depressa, depois o ritmo abranda -- e não é falta de força de vontade.",
    corpo: [
      "Nas primeiras semanas de um défice calórico, o peso desce depressa -- mas boa parte dessa perda inicial é água e glicogénio, a reserva de energia rápida dos músculos, que retém água consigo. A gordura desce muito mais devagar desde o início, por isso a diferença de ritmo entre a primeira e a quinta semana é normal, não um sinal de que algo parou de funcionar.",
      "Com o tempo, o corpo também se ajusta a comer menos: o gasto energético em repouso desce, o que abranda ainda mais a perda. A investigação aponta também para outro fator, talvez maior -- pequenos desvios ao plano que se acumulam sem dar por isso ao longo de semanas.",
      "Isto é informação geral, não é aconselhamento médico. Lidar com um plateau prolongado é conversa para um nutricionista ou outro profissional de saúde, não para esta app.",
    ],
  },
  {
    slug: "sal-e-retencao-de-agua",
    titulo: "Sal e retenção de água a curto prazo",
    resumo:
      "Uma refeição mais salgada pode aparecer na balança já no dia seguinte -- é água, não gordura.",
    corpo: [
      "Comer mais sal do que o habitual leva o corpo a reter mais água para manter o equilíbrio de sódio no sangue -- o efeito nota-se em poucos dias. Ao contrário, reduzir o sal de forma acentuada pode mostrar uma queda de peso rápida logo na primeira semana, também por água, não por perda de gordura.",
      "Isto explica porque uma refeição fora de casa, tipicamente mais salgada do que a comida feita em casa, pode aparecer na balança no dia seguinte sem teres comido a mais em calorias. Faz parte do mesmo ruído normal que explica a variação diária do peso -- não é preciso reagir a cada subida destas.",
      "Isto é informação geral, não é aconselhamento médico. Restrição de sal por razões médicas, como tensão arterial ou doença renal, deve ser orientada por um profissional de saúde.",
    ],
  },
  {
    slug: "sarcopenia-e-massa-muscular",
    titulo: "Porque a massa muscular importa mais com a idade",
    resumo:
      "Perde-se cerca de 30% da massa muscular entre os 50 e os 80 anos, se nada for feito para o travar.",
    corpo: [
      "A partir da meia-idade, o corpo tende a perder massa muscular de forma gradual -- estima-se que cerca de 30% desaparece entre os 50 e os 80 anos, um processo chamado sarcopenia. Não é só uma questão de aspeto: menos músculo significa menos força, mais risco de quedas e fraturas, e mais dificuldade em manter a independência com a idade.",
      "A boa notícia é que está entre os fatores de saúde mais modificáveis que há: o treino de força regular está entre as intervenções mais eficazes para travar ou inverter a perda de músculo, a qualquer idade em que se comece.",
      "É por isso que acompanhar a percentagem de gordura e os perímetros ao longo dos anos conta uma história que o peso sozinho não conta -- se o peso se mantém mas a massa muscular está a cair, o peso que fica é outra coisa.",
      "Isto é informação geral, não é aconselhamento médico. Um programa de treino de força adaptado à tua situação deve ser orientado por um profissional qualificado.",
    ],
  },
  {
    slug: "racio-cintura-altura",
    titulo: "O rácio cintura-altura: uma pista melhor do que o IMC",
    resumo:
      "A cintura deve medir menos de metade da altura -- uma regra simples que prevê risco cardiometabólico melhor do que o IMC.",
    corpo: [
      "Estudos com centenas de milhares de pessoas mostram que o rácio entre o perímetro da cintura e a altura prevê o risco cardiometabólico melhor do que o IMC, ou até do que o perímetro da cintura sozinho. A ideia é simples: divide o perímetro abdominal pela altura, ambos na mesma unidade -- um valor abaixo de 0,5 (a cintura com menos de metade da altura) é geralmente aceite como referência saudável para a generalidade dos adultos.",
      "Como esta app já regista a altura e o perímetro abdominal, tens os dois números de que precisas para calcular isto sempre que quiseres, sem nenhuma medida extra.",
      "Isto é informação geral, não é aconselhamento médico. É uma referência de rastreio populacional, não um diagnóstico individual -- fala com um profissional de saúde para interpretar o que os teus números significam para ti.",
    ],
  },
  {
    slug: "sobrecarga-progressiva",
    titulo: "Sobrecarga progressiva: o princípio por trás de qualquer ganho",
    resumo:
      "Sem aumentar gradualmente a exigência do treino, o corpo não tem razão nenhuma para continuar a adaptar-se.",
    corpo: [
      "O corpo só continua a ganhar força ou músculo se o treino continuar a exigir mais do que já consegue fazer confortavelmente -- é a isto que se chama sobrecarga progressiva. Sem isso, adapta-se ao estímulo atual e estaciona, por mais consistente que seja a frequência com que treinas.",
      "Aumentar o peso levantado é a forma mais óbvia, mas não é a única: fazer mais repetições com o mesmo peso, mais séries, ou simplesmente melhorar a execução também contam como sobrecarga. Nenhuma progressão precisa de ser grande -- pequenos aumentos sustidos ao longo de semanas são o que compõe resultado.",
      "Isto é informação geral, não é aconselhamento médico. Um plano de progressão ajustado à tua situação é trabalho de um profissional de exercício, não desta app.",
    ],
  },
  {
    slug: "proteina-e-musculo",
    titulo: "Quanta proteína precisas para ganhar músculo",
    resumo:
      "Entre 1,4 e 2,0 gramas de proteína por quilo de peso corporal, por dia, cobre a generalidade de quem treina.",
    corpo: [
      "Para a maioria de quem treina com regularidade, uma ingestão diária de proteína entre 1,4 e 2,0 gramas por quilo de peso corporal é suficiente para apoiar o crescimento muscular -- acima disso, os ganhos adicionais tendem a ser pequenos. Para uma pessoa de 70 kg, isso são entre 98 e 140 gramas de proteína por dia.",
      "A situação muda em défice calórico: para preservar músculo enquanto se perde gordura, a investigação sugere valores mais altos, entre 2,3 e 3,1 g/kg, sobretudo em quem já treina com alguma experiência. Distribuir a proteína ao longo do dia, em vez de a concentrar numa só refeição, também parece ajudar.",
      "Isto é informação geral, não é aconselhamento médico. Necessidades individuais variam com idade, função renal e outros fatores -- um nutricionista é quem pode ajustar isto ao teu caso.",
    ],
  },
  {
    slug: "frequencia-de-treino",
    titulo: "Quantas vezes por semana treinar cada grupo muscular",
    resumo:
      "O volume total de treino importa mais do que a frequência -- mas dividi-lo por duas sessões em vez de uma parece ajudar.",
    corpo: [
      "A investigação mais recente aponta para 10 a 20 séries por grupo muscular por semana como referência para maximizar o crescimento muscular, e mostra que treinar um grupo muscular duas vezes por semana tende a dar resultados ligeiramente melhores do que uma vez só -- mas sobretudo porque distribui melhor esse volume total, não por alguma vantagem própria do número dois.",
      "Isto quer dizer que não há uma frequência universalmente certa: alguém que treina o corpo todo três vezes por semana pode ter resultados equivalentes a quem divide os mesmos grupos musculares por seis sessões, desde que o volume total seja parecido e a recuperação entre sessões seja suficiente.",
      "Isto é informação geral, não é aconselhamento médico.",
    ],
  },
  {
    slug: "recuperacao-e-sono",
    titulo: "Os músculos crescem fora do ginásio",
    resumo:
      "O treino é o estímulo. A adaptação -- o músculo a ficar maior e mais forte -- acontece principalmente durante o descanso, sobretudo a dormir.",
    corpo: [
      "O treino de força não faz crescer músculo diretamente -- cria o estímulo que leva o corpo a reconstruir esse tecido mais forte do que estava, um processo que continua muito depois de saíres do ginásio. Cerca de 90% da hormona do crescimento do corpo é libertada durante o sono profundo, precisamente quando parte importante dessa reconstrução acontece.",
      "Para isso acontecer bem, o corpo precisa de aminoácidos disponíveis -- daí a proteína antes de dormir ter mostrado, em vários estudos, melhorar a resposta muscular sem alterar o resto da alimentação do dia.",
      "Isto é informação geral, não é aconselhamento médico. Se o sono é o teu maior obstáculo a resultados, vale mais a pena resolver isso primeiro do que ajustar mais uma variável do treino.",
    ],
  },
  {
    slug: "dores-musculares-doms",
    titulo: "As dores musculares não medem se o treino resultou",
    resumo:
      "Ficar rígido dois dias depois de treinar não significa que o treino foi melhor -- e não sentir nada também não significa que foi pior.",
    corpo: [
      "É tentador usar as dores musculares dos dias seguintes a um treino como prova de que ele \"resultou\". A investigação não apoia essa ideia: o grau de dor sentida não reflete de forma fiável o dano muscular real, nem prevê o ganho de força ou músculo que se segue. Duas pessoas podem fazer o mesmo treino e sentir níveis de dor completamente diferentes, sem isso dizer nada sobre quem vai progredir mais.",
      "Estas dores aparecem tipicamente 12 a 48 horas depois de um esforço pouco habitual, especialmente em movimentos que alongam o músculo sob carga, e tendem a ser mais um sinal do processo de regeneração do tecido do que de dano propriamente dito.",
      "Isto é informação geral, não é aconselhamento médico. Dor que não segue este padrão -- muito intensa, numa articulação, ou que não passa em poucos dias -- é motivo para falar com um profissional de saúde.",
    ],
  },
];

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}
