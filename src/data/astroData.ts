export const HOUSE_INFO: Record<number, {
  name: string;
  emoji: string;
  theme: string;
  description: string;
  keywords: string[];
}> = {
  1: {
    name: 'Casa 1',
    emoji: '👤',
    theme: 'Identidade & Aparência',
    description: 'A Casa 1 representa quem você é no mundo — sua aparência, personalidade e primeiras impressões. O signo no Ascendente (cúspide da Casa 1) coloreia profundamente sua expressão exterior.',
    keywords: ['Identidade', 'Aparência', 'Começos', 'Personalidade'],
  },
  2: {
    name: 'Casa 2',
    emoji: '💰',
    theme: 'Valores & Recursos',
    description: 'A Casa 2 rege seus recursos materiais, valores pessoais e relação com o dinheiro. Revela como você ganha, gasta e o que você considera precioso.',
    keywords: ['Dinheiro', 'Valores', 'Posses', 'Autoestima'],
  },
  3: {
    name: 'Casa 3',
    emoji: '💬',
    theme: 'Comunicação & Mente',
    description: 'A Casa 3 governa comunicação, aprendizado, irmãos e viagens curtas. Revela como você pensa, fala e processa informações.',
    keywords: ['Comunicação', 'Irmãos', 'Aprendizado', 'Transporte'],
  },
  4: {
    name: 'Casa 4',
    emoji: '🏠',
    theme: 'Lar & Raízes',
    description: 'A Casa 4 representa seu lar, família de origem, raízes e fundamentos emocionais. É o alicerce sobre o qual você constrói sua vida.',
    keywords: ['Família', 'Lar', 'Raízes', 'Emocional'],
  },
  5: {
    name: 'Casa 5',
    emoji: '🎭',
    theme: 'Criatividade & Prazer',
    description: 'A Casa 5 rege criatividade, amor romântico, filhos e prazer. Representa onde você busca alegria, expressão autêntica e jogo.',
    keywords: ['Criatividade', 'Romance', 'Filhos', 'Diversão'],
  },
  6: {
    name: 'Casa 6',
    emoji: '⚕️',
    theme: 'Saúde & Trabalho',
    description: 'A Casa 6 governa saúde, rotinas diárias, serviço e trabalho. Revela como você cuida do seu corpo e como se dedica às suas responsabilidades.',
    keywords: ['Saúde', 'Rotina', 'Serviço', 'Trabalho'],
  },
  7: {
    name: 'Casa 7',
    emoji: '❤️',
    theme: 'Relacionamentos & Parcerias',
    description: 'A Casa 7 representa parcerias — românticas, de negócios e até adversários. Revela o que você busca nos outros e como se relaciona com eles.',
    keywords: ['Casamento', 'Parcerias', 'Contratos', 'Outros'],
  },
  8: {
    name: 'Casa 8',
    emoji: '🔮',
    theme: 'Transformação & Mistério',
    description: 'A Casa 8 governa transformação, morte e renascimento, heranças, sexualidade e o oculto. É onde você encontra poder através da vulnerabilidade.',
    keywords: ['Transformação', 'Heranças', 'Sexo', 'Oculto'],
  },
  9: {
    name: 'Casa 9',
    emoji: '🌍',
    theme: 'Filosofia & Expansão',
    description: 'A Casa 9 representa filosofia, viagens longas, espiritualidade e ensino superior. É onde você expande horizontes e busca significado maior.',
    keywords: ['Viagens', 'Filosofia', 'Religião', 'Ensino Superior'],
  },
  10: {
    name: 'Casa 10',
    emoji: '🏆',
    theme: 'Carreira & Reputação',
    description: 'A Casa 10 governa carreira, reputação pública e autoridade. Representa suas ambições e o legado que você deseja deixar no mundo.',
    keywords: ['Carreira', 'Reputação', 'Autoridade', 'Legado'],
  },
  11: {
    name: 'Casa 11',
    emoji: '🤝',
    theme: 'Amizades & Coletivo',
    description: 'A Casa 11 representa amizades, grupos sociais, esperanças e sonhos coletivos. É onde você contribui para algo maior que você mesmo.',
    keywords: ['Amigos', 'Grupos', 'Sonhos', 'Humanitarismo'],
  },
  12: {
    name: 'Casa 12',
    emoji: '✨',
    theme: 'Espiritualidade & Inconsciente',
    description: 'A Casa 12 governa o inconsciente, espiritualidade, isolamento e os aspectos ocultos de nós mesmos. É onde encontramos a conexão com o todo.',
    keywords: ['Inconsciente', 'Espiritualidade', 'Isolamento', 'Karma'],
  },
};

export const SIGN_DESCRIPTIONS: Record<string, {
  element: string;
  modality: string;
  ruler: string;
  emoji: string;
  symbol: string;
  color: string;
  description: string;
  traits: string[];
}> = {
  'Áries': {
    element: 'Fogo', modality: 'Cardinal', ruler: 'Marte',
    emoji: '🐏', symbol: '♈', color: '#FF4136',
    description: 'Corajoso, pioneiro e cheio de energia vital. Áries é o primeiro signo do zodíaco e carrega a energia do novo começo.',
    traits: ['Corajoso', 'Pioneiro', 'Impulsivo', 'Competitivo', 'Entusiasmado'],
  },
  'Touro': {
    element: 'Terra', modality: 'Fixo', ruler: 'Vênus',
    emoji: '🐂', symbol: '♉', color: '#2ECC40',
    description: 'Estável, sensual e determinado. Touro aprecia beleza, conforto e a construção lenta e segura de uma vida próspera.',
    traits: ['Persistente', 'Sensual', 'Confiável', 'Teimoso', 'Paciente'],
  },
  'Gêmeos': {
    element: 'Ar', modality: 'Mutável', ruler: 'Mercúrio',
    emoji: '👯', symbol: '♊', color: '#FFDC00',
    description: 'Curioso, comunicativo e adaptável. Gêmeos vive para aprender e compartilhar conhecimento, sempre em movimento.',
    traits: ['Curioso', 'Comunicativo', 'Adaptável', 'Inconstante', 'Inteligente'],
  },
  'Câncer': {
    element: 'Água', modality: 'Cardinal', ruler: 'Lua',
    emoji: '🦀', symbol: '♋', color: '#7FDBFF',
    description: 'Sensível, intuitivo e protetor. Câncer é profundamente conectado às emoções e ao poder do lar e da família.',
    traits: ['Sensível', 'Intuitivo', 'Protetor', 'Nostálgico', 'Empático'],
  },
  'Leão': {
    element: 'Fogo', modality: 'Fixo', ruler: 'Sol',
    emoji: '🦁', symbol: '♌', color: '#FF851B',
    description: 'Criativo, generoso e majestoso. Leão brilha quando pode expressar sua autenticidade e compartilhar seu calor com o mundo.',
    traits: ['Criativo', 'Generoso', 'Dramático', 'Orgulhoso', 'Leal'],
  },
  'Virgem': {
    element: 'Terra', modality: 'Mutável', ruler: 'Mercúrio',
    emoji: '👧', symbol: '♍', color: '#B10DC9',
    description: 'Analítico, prestativo e perfeccionista. Virgem tem um dom para ver os detalhes e melhorar tudo ao seu redor.',
    traits: ['Analítico', 'Prestativo', 'Perfeccionista', 'Prático', 'Modesto'],
  },
  'Libra': {
    element: 'Ar', modality: 'Cardinal', ruler: 'Vênus',
    emoji: '⚖️', symbol: '♎', color: '#39CCCC',
    description: 'Diplomático, charmoso e comprometido com a harmonia. Libra busca equilíbrio em todas as áreas da vida.',
    traits: ['Diplomático', 'Charmoso', 'Justo', 'Indeciso', 'Sociável'],
  },
  'Escorpião': {
    element: 'Água', modality: 'Fixo', ruler: 'Plutão',
    emoji: '🦂', symbol: '♏', color: '#85144b',
    description: 'Intenso, transformador e magnético. Escorpião mergulha nas profundezas e não teme o que outros evitam.',
    traits: ['Intenso', 'Perspicaz', 'Apaixonado', 'Reservado', 'Poderoso'],
  },
  'Sagitário': {
    element: 'Fogo', modality: 'Mutável', ruler: 'Júpiter',
    emoji: '🏹', symbol: '♐', color: '#01FF70',
    description: 'Aventureiro, otimista e filosófico. Sagitário busca expandir horizontes e encontrar o significado maior da vida.',
    traits: ['Aventureiro', 'Otimista', 'Filosófico', 'Honesto', 'Inquieto'],
  },
  'Capricórnio': {
    element: 'Terra', modality: 'Cardinal', ruler: 'Saturno',
    emoji: '🐐', symbol: '♑', color: '#001f3f',
    description: 'Ambicioso, disciplinado e responsável. Capricórnio sabe que a conquista vem com tempo, esforço e dedicação.',
    traits: ['Ambicioso', 'Disciplinado', 'Responsável', 'Reservado', 'Persistente'],
  },
  'Aquário': {
    element: 'Ar', modality: 'Fixo', ruler: 'Urano',
    emoji: '🏺', symbol: '♒', color: '#0074D9',
    description: 'Inovador, humanitário e original. Aquário está sempre um passo à frente, pensando no bem coletivo.',
    traits: ['Inovador', 'Independente', 'Humanitário', 'Excêntrico', 'Visionário'],
  },
  'Peixes': {
    element: 'Água', modality: 'Mutável', ruler: 'Netuno',
    emoji: '🐟', symbol: '♓', color: '#B0C4DE',
    description: 'Compassivo, intuitivo e espiritual. Peixes dissolve fronteiras e conecta o humano com o divino através da imaginação e empatia.',
    traits: ['Compassivo', 'Intuitivo', 'Espiritual', 'Sonhador', 'Sensível'],
  },
};

export const VENUS_STYLE: Record<string, {
  style: string;
  colors: string[];
  aesthetic: string;
  accessories: string[];
  description: string;
}> = {
  'Áries': {
    style: 'Ousado e esportivo com toques de poder',
    colors: ['Vermelho', 'Laranja', 'Preto', 'Branco'],
    aesthetic: 'Athleisure chique, estruturado e dinâmico',
    accessories: ['Relógios esportivos', 'Botas de combate', 'Cintos marcantes'],
    description: 'Sua Vênus em Áries adora peças que transmitem movimento e força. Você brilha em looks ousados que chamam atenção sem esforço.',
  },
  'Touro': {
    style: 'Luxuoso, sensual e clássico',
    colors: ['Verde esmeralda', 'Terracota', 'Nude', 'Bordeaux'],
    aesthetic: 'Quiet luxury, tecidos naturais e texturas ricas',
    accessories: ['Joias de ouro', 'Bolsas de couro', 'Scarves de seda'],
    description: 'Sua Vênus em Touro aprecia qualidade acima de quantidade. Você tem um olho inato para o que é realmente luxuoso e atemporal.',
  },
  'Gêmeos': {
    style: 'Eclético, jovial e cheio de camadas',
    colors: ['Amarelo vibrante', 'Azul céu', 'Listras', 'Estampas mistas'],
    aesthetic: 'Maximalism divertido, layering criativo',
    accessories: ['Brincos longos', 'Anel em cada dedo', 'Bolsas mini'],
    description: 'Sua Vênus em Gêmeos ama experimentar! Você se diverte com a moda e não tem medo de misturar estilos e épocas de forma criativa.',
  },
  'Câncer': {
    style: 'Romântico, delicado e nostálgico',
    colors: ['Branco pérola', 'Azul bebê', 'Rosa antigo', 'Prata'],
    aesthetic: 'Cottagecore, vintage romântico, peças herdadas',
    accessories: ['Pérolas', 'Broches antigos', 'Tiaras delicadas'],
    description: 'Sua Vênus em Câncer ama peças com história e sentimento. Você cria looks que evocam aconchego, nostalgia e feminilidade atemporal.',
  },
  'Leão': {
    style: 'Glamouroso, majestoso e dramático',
    colors: ['Dourado', 'Laranja', 'Roxo real', 'Animal print'],
    aesthetic: 'Old Hollywood glamour, maximalismo luxuoso',
    accessories: ['Joias volumosas', 'Óculos statement', 'Bolsas douradas'],
    description: 'Sua Vênus em Leão foi feita para ser vista! Você sabe como fazer uma entrada e seu estilo reflete sua natureza real e magnética.',
  },
  'Virgem': {
    style: 'Limpo, clássico e impecavelmente detalhado',
    colors: ['Branco off-white', 'Bege', 'Azul marinho', 'Terracota suave'],
    aesthetic: 'Old money minimalismo, peças bem cortadas',
    accessories: ['Óculos delicados', 'Bolsas estruturadas', 'Joias minimalistas'],
    description: 'Sua Vênus em Virgem tem um senso estético refinado. Você valoriza qualidade, corte perfeito e atenção aos pequenos detalhes que fazem toda a diferença.',
  },
  'Libra': {
    style: 'Elegante, harmonioso e romanticamente equilibrado',
    colors: ['Rosa millennial', 'Azul polvê', 'Branco', 'Nude'],
    aesthetic: 'Parisian chic, feminino equilibrado',
    accessories: ['Brincos de argola', 'Bolsa crossbody', 'Lenços de seda'],
    description: 'Sua Vênus em Libra tem um gosto impecável para equilíbrio e beleza. Você cria looks que são effortlessly elegantes e sempre harmoniosos.',
  },
  'Escorpião': {
    style: 'Misterioso, sensual e intensamente poderoso',
    colors: ['Preto', 'Bordeaux', 'Roxo profundo', 'Vermelho escuro'],
    aesthetic: 'Dark romantic, gótico luxuoso, power dressing',
    accessories: ['Anéis de pedra preciosa', 'Botas cano longo', 'Joias dark'],
    description: 'Sua Vênus em Escorpião veste o mistério como uma segunda pele. Seu estilo é magnético, sensual e possui uma profundidade que hipnotiza.',
  },
  'Sagitário': {
    style: 'Boêmio, aventureiro e livre',
    colors: ['Laranja queimado', 'Turquesa', 'Roxo vibrante', 'Bege'],
    aesthetic: 'Boho-chic, worldly traveler, peças étnicas',
    accessories: ['Colares turquesa', 'Chapéus de aba larga', 'Cintos bordados'],
    description: 'Sua Vênus em Sagitário ama a liberdade e a aventura expressa no vestuário. Você mistura influências de diferentes culturas com naturalidade e estilo.',
  },
  'Capricórnio': {
    style: 'Clássico, poderoso e sofisticado',
    colors: ['Preto', 'Cinza', 'Navy', 'Caramelo'],
    aesthetic: 'Corporate chic, power dressing clássico',
    accessories: ['Relógio fino', 'Bolsa estruturada', 'Joias de ouro clássico'],
    description: 'Sua Vênus em Capricórnio veste o poder com naturalidade. Você prefere peças clássicas e atemporais que transmitem autoridade e elegância discreta.',
  },
  'Aquário': {
    style: 'Vanguardista, único e inesperado',
    colors: ['Elétrico azul', 'Prata', 'Branco', 'Cores neon'],
    aesthetic: 'Avant-garde, futurista, streetwear conceitual',
    accessories: ['Óculos futuristas', 'Joias tecnológicas', 'Tênis statement'],
    description: 'Sua Vênus em Aquário faz das próprias regras. Você ama peças que desafiam convenções e expressam sua individualidade única e visionária.',
  },
  'Peixes': {
    style: 'Etéreo, delicado e romanticamente onírico',
    colors: ['Lilás', 'Azul água', 'Rosa pálido', 'Prata iridescente'],
    aesthetic: 'Fairycore, dreamy romantic, tecidos fluidos',
    accessories: ['Cristais', 'Brincos de concha', 'Bolsas artísticas'],
    description: 'Sua Vênus em Peixes veste sonhos. Você é atraída por tecidos fluidos, cores suaves e peças que parecem vir de outro plano de existência.',
  },
};
