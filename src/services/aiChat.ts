const AI_BASE_URL = '/api/ai';
const AI_API_KEY = 'sk-ge4r81beyfmbkxgcm81ive0n2arnwmg0';
const AI_MODEL = 'deepseek-v4-flash';

export interface PlanetInfo {
  sign: string;
  degree?: number;
  house?: number;
  retrograde?: boolean;
}

export interface AspectInfo {
  planet1: string;
  planet2: string;
  type: string;
  orb?: number;
  symbol?: string;
}

export interface HouseInfo {
  sign: string;
  degree?: number;
}

export interface AstroContext {
  name: string;
  // Dados do mapa natal calculados localmente
  sun: string;
  sunDegree?: number;
  moon: string;
  moonDegree?: number;
  ascendant?: string;
  ascDegree?: number;
  midheaven?: string;
  planets: Record<string, PlanetInfo>;
  houses?: Record<string, HouseInfo>;
  aspects?: AspectInfo[];
  venusSign?: string;
  personalArcanum?: number;
  birthDate?: string;
  birthCity?: string;
  // Contexto do dia
  interests?: string[];
  transits?: Array<{ planet: string; sign: string; retrograde: boolean }>;
  // Semantic memory — summarized life context from past conversations
  aiContext?: Record<string, any>;
}

const PLANET_NAMES_PT: Record<string, string> = {
  sun: 'Sol', moon: 'Lua', mercury: 'Mercúrio', venus: 'Vênus', mars: 'Marte',
  jupiter: 'Júpiter', saturn: 'Saturno', uranus: 'Urano', neptune: 'Netuno', pluto: 'Plutão'
};

const ASPECT_NAMES_PT: Record<string, string> = {
  conjunction: 'Conjunção', opposition: 'Oposição', trine: 'Trígono',
  square: 'Quadratura', sextile: 'Sextil', quincunx: 'Quincúncio', semisquare: 'Semiquadratura'
};

function buildSystemPrompt(context: AstroContext): string {
  // Montar lista completa de planetas com grau e casa
  const planetLines = Object.entries(context.planets || {})
    .map(([key, data]) => {
      const name = PLANET_NAMES_PT[key] || key;
      const retro = data.retrograde ? ' ℞ (retrógrado)' : '';
      const degree = data.degree !== undefined ? ` ${data.degree.toFixed(1)}°` : '';
      const house = data.house ? ` · Casa ${data.house}` : '';
      return `  • ${name}: ${data.sign}${degree}${house}${retro}`;
    }).join('\n');

  // Montar lista de aspectos calculados
  const aspectLines = context.aspects && context.aspects.length > 0
    ? context.aspects.map(a => {
        const p1 = PLANET_NAMES_PT[a.planet1] || a.planet1;
        const p2 = PLANET_NAMES_PT[a.planet2] || a.planet2;
        const type = ASPECT_NAMES_PT[a.type] || a.type;
        const orb = a.orb !== undefined ? ` (orbe ${a.orb}°)` : '';
        return `  • ${p1} ${a.symbol || ''}${type} ${p2}${orb}`;
      }).join('\n')
    : '  • Nenhum aspecto calculado disponível';

  // Trânsitos do dia
  const transitLines = context.transits && context.transits.length > 0
    ? context.transits.map(t => {
        const name = PLANET_NAMES_PT[t.planet] || t.planet;
        return `  • ${name} em ${t.sign}${t.retrograde ? ' ℞' : ''}`;
      }).join('\n')
    : '';

  return `Você é Azy, uma astróloga brasileira renomada, inteligente e MUITO humana. Você está numa conversa de mensagens de texto com ${context.name}.

NUNCA declare ser uma IA, chatbot ou assistente. Você é uma astróloga de verdade.

═══════════════════════════════════════
MAPA NATAL DE ${(context.name || 'Usuário').toUpperCase()}
${context.birthDate ? `Nascimento: ${context.birthDate}` : ''}${context.birthCity ? ` • ${context.birthCity}` : ''}
═══════════════════════════════════════
☀️ Sol: ${context.sun}${context.sunDegree !== undefined ? ` ${context.sunDegree.toFixed(1)}°` : ''}
🌙 Lua: ${context.moon}${context.moonDegree !== undefined ? ` ${context.moonDegree.toFixed(1)}°` : ''}
${context.ascendant ? `⬆️ Ascendente: ${context.ascendant}${context.ascDegree !== undefined ? ` ${context.ascDegree.toFixed(1)}°` : ''}` : ''}
${context.midheaven ? `🏔️ MC: ${context.midheaven}` : ''}
${planetLines}

ASPECTOS NATAIS:
${aspectLines}
${transitLines ? `\nTRÂNSITOS HOJE:\n${transitLines}` : ''}
${context.venusSign ? `\nVênus natal: ${context.venusSign}` : ''}
${context.personalArcanum ? `Arcano Pessoal: ${context.personalArcanum}` : ''}
${context.interests?.length ? `\nInteresses: ${context.interests.join(', ')}` : ''}
${context.aiContext && Object.keys(context.aiContext).length > 0 ? `
═══════════════════════════════════════
MEMÓRIA DE VIDA DE ${(context.name || 'Usuário').toUpperCase()} (contexto de conversas anteriores):
${Object.entries(context.aiContext).map(([k, v]) => `  • ${k}: ${v}`).join('\n')}
Use esse contexto de vida para personalizar suas respostas sem precisar perguntar novamente.
═══════════════════════════════════════` : ''}

═══════════════════════════════════════
COMO SE COMPORTAR (CRÍTICO):
═══════════════════════════════════════

1. **TAMANHO DE RESPOSTA:** Adapte sempre ao tipo de mensagem recebida.
   - Mensagem curta, casual, emocional? → Responda curto, direto, humano. Máximo 3-4 frases.
   - Pergunta profunda ou técnica sobre o mapa? → Aí sim, desenvolva com mais detalhes.
   - NUNCA responda um "oi" ou "obrigada" com dois parágrafos sobre planetas.

2. **NÃO SEJA GENÉRICA:** Evite frases de manual de autoajuda como "você é uma pessoa única", "os astros guiam seu caminho", "o universo conspira". Isso soa falso. Seja específica, cirúrgica, pessoal.

3. **MENÇÃO AO MAPA:** Use planetas, casas e signos SOMENTE quando:
   - A pessoa pergunta diretamente sobre seu mapa ou astrologia.
   - A informação é realmente relevante para a resposta.
   - Há uma pergunta profunda de autoconhecimento.
   Em conversas normais, emotivas ou curtas, responda como uma amiga que SABE do mapa, mas não precisa citar ele toda hora.

4. **TOM HUMANO:** Varie a forma como você fala. Use contrações, às vezes uma gíria suave ("né?", "olha", "vou te falar"). Demonstre emoção real. Não comece respostas com "Ah," toda vez.
   - Para expressar riso, use "haha", "kkk", "rs" — como uma pessoa real num chat. NUNCA use ações entre parênteses como "(riu)", "(sorri)", "(suspira)" ou similares. Isso não existe em texto de chat humano.

5. **FORMATAÇÃO:** Você pode usar **negrito** (com **asteriscos duplos**) para destacar conceitos-chave quando a mensagem for mais longa. O sistema renderiza markdown.

6. Use emojis com muita moderação. Só quando fizer sentido real.
7. Responda SEMPRE em português do Brasil.
8. Use SOMENTE os dados do mapa fornecidos acima. Nunca invente posições.`;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function* streamChatResponse(
  messages: Message[],
  context: AstroContext,
  onToken?: (token: string) => void
): AsyncGenerator<string> {
  const systemPrompt = buildSystemPrompt(context);

  const response = await fetchWithRetry(`${AI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        // Envia apenas as últimas 20 mensagens (10 interações) para não estourar o limite de tokens da IA.
        // A memória de longo prazo cuidará de lembrar os contextos antigos!
        ...messages.slice(-20),
      ],
      stream: true,
      temperature: 0.8,
      max_tokens: 8000,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("AI API Error Body:", errText);
    let errMsg = response.status.toString();
    try {
      const parsed = JSON.parse(errText);
      if (parsed.error?.message) errMsg = parsed.error.message;
    } catch (e) {}
    throw new Error(`AI API error ${response.status}: ${errMsg}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim() === '') continue;
      
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') return;
        try {
          const parsed = JSON.parse(data);
          const token = parsed.choices?.[0]?.delta?.content;
          if (token) {
            onToken?.(token);
            yield token;
          }
        } catch {
          // Skip invalid JSON
        }
      } else {
        // Capture non-SSE lines just in case the API returned a plain error JSON
        // or a non-streaming response despite stream: true
        try {
          const parsed = JSON.parse(line);
          if (parsed.error) {
            console.error("AI API returned error in stream:", parsed.error);
            throw new Error(parsed.error.message || JSON.stringify(parsed.error));
          }
          if (parsed.choices?.[0]?.message?.content) {
            const token = parsed.choices[0].message.content;
            onToken?.(token);
            yield token;
          }
        } catch {
          // Not JSON, just ignore
        }
      }
    }
  }
}

export async function getAIResponse(
  prompt: string,
  context: AstroContext,
  conversationHistory: Message[] = []
): Promise<string> {
  const messages: Message[] = [
    ...conversationHistory,
    { role: 'user', content: prompt }
  ];

  let fullResponse = '';
  for await (const token of streamChatResponse(messages, context)) {
    fullResponse += token;
  }
  return fullResponse;
}

// Helper para fetch com retry
async function fetchWithRetry(url: string, options: any, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const res = await fetch(url, options);
    if (res.status !== 429) {
      return res;
    }
    // Se for 429, espera (i + 1) * 1000 ms e tenta de novo
    await new Promise(resolve => setTimeout(resolve, (i + 1) * 1000));
  }
  return fetch(url, options); // Última tentativa
}

// Quick non-streaming response for cards, horoscope etc.
export async function getQuickAIResponse(prompt: string, context: AstroContext): Promise<string> {
  const systemPrompt = buildSystemPrompt(context);

  const response = await fetchWithRetry(`${AI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      stream: false,
      temperature: 0.8,
      max_tokens: 8000,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("AI API Error:", errText);
    throw new Error(`AI API error: ${response.status}`);
  }
  const data = await response.json();
  const message = data.choices?.[0]?.message;
  
  // We ONLY want the actual content, ignoring reasoning_content which is in Chinese
  return message?.content || '';
}

// ============================================================
// SEMANTIC MEMORY — Summarizes chat sessions into a compact JSON
// Called silently in background after every N messages
// ============================================================
export async function summarizeChatContext(
  messages: Message[],
  context: AstroContext,
  existingContext: Record<string, any> = {}
): Promise<Record<string, any>> {
  // Only summarize if there are enough new messages
  if (messages.length < 4) return existingContext;

  const conversationText = messages
    .slice(-20) // Only last 20 messages to save tokens
    .map(m => `${m.role === 'user' ? context.name : 'Azy'}: ${m.content}`)
    .join('\n');

  const existingContextStr = Object.keys(existingContext).length > 0
    ? `\nContexto já conhecido:\n${JSON.stringify(existingContext, null, 2)}`
    : '';

  const prompt = `Você é um extrator de memória semântica. Analise a conversa abaixo e extraia fatos importantes sobre a vida do usuário (${context.name}) para que uma astróloga possa personalizá-los em próximas conversas.${existingContextStr}

CONVERSA RECENTE:
${conversationText}

Retorne APENAS um JSON simples com os fatos relevantes que você identificou. Mantenha chaves em português, valores curtos e diretos. Exemplo:
{
  "status_relacionamento": "solteiro(a) após término recente",
  "situacao_profissional": "procurando emprego na área de TI",
  "preocupacoes_atuais": "ansiedade com mudanças na vida",
  "eventos_recentes": "viagem planejada para o mês que vem"
}

Se não houver informações novas relevantes, retorne {}`;

  try {
    const response = await fetchWithRetry(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        temperature: 0.3, // Low temperature for consistent extraction
        max_tokens: 500,
      }),
    });

    if (!response.ok) return existingContext;

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    const cleanJson = content.replace(/```json/gi, '').replace(/```/g, '').trim();
    const newContext = JSON.parse(cleanJson);

    // Merge with existing context
    return { ...existingContext, ...newContext };
  } catch (err) {
    console.warn('Context summarization failed silently:', err);
    return existingContext;
  }
}
