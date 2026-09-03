import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, MessageSquarePlus } from 'lucide-react';
import { useUserStore } from '../stores/userStore';
import { streamChatResponse, summarizeChatContext, type Message } from '../services/aiChat';
import { supabase } from '../services/supabase';
import AppLayout from '../components/layout/AppLayout';
import type { AstroContext } from '../services/aiChat';

// Lightweight inline markdown renderer: bold, italic, line breaks
function renderMarkdown(text: string) {
  const parts: React.ReactNode[] = [];
  // Split by **bold** and *italic*
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const segment = text.slice(lastIndex, match.index);
      parts.push(...segment.split('\n').flatMap((line, i, arr) =>
        i < arr.length - 1 ? [line, <br key={`br-${key++}`} />] : [line]
      ));
    }
    if (match[1] !== undefined) {
      parts.push(<strong key={key++}>{match[1]}</strong>);
    } else if (match[2] !== undefined) {
      parts.push(<em key={key++}>{match[2]}</em>);
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    const segment = text.slice(lastIndex);
    parts.push(...segment.split('\n').flatMap((line, i, arr) =>
      i < arr.length - 1 ? [line, <br key={`br-${key++}`} />] : [line]
    ));
  }

  return parts;
}

export default function Chat() {
  const { user, profile, chart, currentSessionId, setSessionId } = useUserStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    carregarHistorico();
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const carregarHistorico = async () => {
    if (!user) return;

    let sessionId = currentSessionId;

    if (!sessionId) {
      // Find the most recent session
      const { data: ultimas } = await supabase
        .from('mensagens_chat')
        .select('sessao_id')
        .eq('usuario_id', user.id)
        .not('sessao_id', 'is', null)
        .order('criado_em', { ascending: false })
        .limit(1);

      if (ultimas && ultimas.length > 0 && ultimas[0].sessao_id) {
        sessionId = ultimas[0].sessao_id;
        setSessionId(sessionId);
      } else {
        // First ever chat session
        sessionId = crypto.randomUUID();
        setSessionId(sessionId);
        setMessages([]);
        return;
      }
    }

    const { data } = await supabase
      .from('mensagens_chat')
      .select('*')
      .eq('usuario_id', user.id)
      .eq('sessao_id', sessionId)
      .order('criado_em', { ascending: true })
      .limit(50);

    if (data) {
      setMessages(data.map(m => ({ 
        role: m.papel === 'usuario' ? 'user' : 'assistant', 
        content: m.conteudo 
      })));
    }
  };

  const sendMessage = async (content?: string) => {
    const messageContent = content || input.trim();
    if (!messageContent || isStreaming || !profile || !chart) return;

    setInput('');
    const userMessage: Message = { role: 'user', content: messageContent };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsStreaming(true);
    setStreamingContent('');

    // Salvar mensagem do usuário
    if (user && currentSessionId) {
      await supabase.from('mensagens_chat').insert({
        usuario_id: user.id,
        sessao_id: currentSessionId,
        papel: 'usuario',
        conteudo: messageContent,
      });
    }

    const context: AstroContext = {
      name: profile.name,
      sun: chart.sun_sign,
      sunDegree: chart.sun_degree,
      moon: chart.moon_sign,
      moonDegree: chart.moon_degree,
      ascendant: chart.ascendant,
      ascDegree: chart.asc_degree,
      midheaven: chart.midheaven,
      planets: chart.planets as any,
      aspects: chart.aspects as any,
      venusSign: chart.venus_sign,
      personalArcanum: chart.personal_arcanum,
      birthDate: profile.birth_date,
      birthCity: profile.birth_city,
      interests: profile.interests,
      aiContext: profile.ai_context || {}, // Semantic memory
    };

    let fullResponse = '';
    try {
      for await (const token of streamChatResponse(
        newMessages,
        context,
        (token) => {
          fullResponse += token;
          setStreamingContent(fullResponse);
        }
      )) {
        // tokens handled by callback
      }
    } catch (err: any) {
      console.error("Chat streaming error:", err);
      fullResponse = `Erro técnico: ${err.message || 'Desconhecido'}. Tente novamente. 🌙`;
      setStreamingContent(fullResponse);
    }

    const assistantMessage: Message = { role: 'assistant', content: fullResponse };
    const finalMessages = [...newMessages, assistantMessage];
    setMessages(finalMessages);
    setStreamingContent('');
    setIsStreaming(false);

    // Save assistant message
    if (user && currentSessionId && !fullResponse.startsWith('Erro técnico:')) {
      await supabase.from('mensagens_chat').insert({
        usuario_id: user.id,
        sessao_id: currentSessionId,
        papel: 'assistente',
        conteudo: fullResponse,
      });
    }

    // Background semantic memory update every 6 messages
    if (user && finalMessages.length % 6 === 0) {
      const context: AstroContext = {
        name: profile.name,
        sun: chart.sun_sign,
        moon: chart.moon_sign,
        planets: chart.planets as any,
        aspects: chart.aspects as any,
        birthDate: profile.birth_date,
        birthCity: profile.birth_city,
        interests: profile.interests,
      };
      summarizeChatContext(finalMessages, context, profile.ai_context || {}).then(async newCtx => {
        if (Object.keys(newCtx).length > 0) {
          // Save to Supabase (silent, no await block)
          await supabase.from('perfis').update({ contexto_ia: newCtx }).eq('id', user.id);
          // Update local store
          useUserStore.getState().updateAiContext(newCtx);
        }
      }).catch(() => {/* silent fail */});
    }
  }; // end sendMessage

  const novaConversa = () => {
    const newSession = crypto.randomUUID();
    setSessionId(newSession);
    setMessages([]);
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100dvh-80px)]">
        {/* Header Modernizado */}
        <div className="py-4 flex items-center justify-between border-b border-cosmic-border/30 mb-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cosmic-accent/20 border border-cosmic-accent flex items-center justify-center text-lg shadow-glow">
              🔮
            </div>
            <div>
              <h1 className="font-serif text-xl text-cosmic-star leading-tight">Azy</h1>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <p className="text-cosmic-muted text-xs">Sua Astróloga Pessoal</p>
              </div>
            </div>
          </div>
          <button
            onClick={novaConversa}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cosmic-accent/10 border border-cosmic-accent/30 text-cosmic-text hover:bg-cosmic-accent/20 transition-all text-sm font-medium"
            title="Nova Conversa"
          >
            <MessageSquarePlus size={16} />
            <span className="hidden sm:inline">Nova Conversa</span>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-none space-y-4 pb-4">
          {messages.length === 0 && !isStreaming && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full min-h-[40vh]">
              {/* Welcome */}
              <div className="glass-card p-8 max-w-lg w-full text-center border border-cosmic-accent/10 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cosmic-accent/30 to-transparent" />
                
                <h3 className="font-serif text-2xl text-cosmic-star mb-3">Olá, {profile?.name}!</h3>
                <p className="text-cosmic-muted text-sm leading-relaxed max-w-md mx-auto">
                  Sou Azy, sua astróloga pessoal. Já estudei profundamente o seu mapa astral e estou aqui para guiá-la, entender os trânsitos do momento e desvendar os mistérios das suas casas, planetas e signos. O que você gostaria de descobrir sobre si mesma hoje?
                </p>
              </div>
            </motion.div>
          )}

          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-cosmic-accent/10 border border-cosmic-accent/20 flex items-center justify-center text-sm mr-2 shrink-0 mt-1">
                  🔮
                </div>
              )}
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-cosmic-accent text-black font-medium rounded-br-sm'
                  : 'glass-card text-cosmic-text rounded-bl-sm border border-cosmic-border'
              }`}>
                {msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content}
              </div>
            </motion.div>
          ))}

          {/* Streaming message */}
          {isStreaming && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="w-7 h-7 rounded-full bg-cosmic-accent/10 border border-cosmic-accent/20 flex items-center justify-center text-sm mr-2 shrink-0 mt-1">
                🔮
              </div>
              <div className="max-w-[85%] glass-card rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-cosmic-text leading-relaxed">
                {streamingContent ? renderMarkdown(streamingContent) : (
                  <div className="flex gap-1 items-center py-1">
                    <span className="w-2 h-2 rounded-full bg-cosmic-purple animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-cosmic-purple animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-cosmic-purple animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="py-3 border-t border-cosmic-border">
          <div className="flex gap-2 items-center">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Pergunte à Azy..."
              disabled={isStreaming}
              className="input-cosmic flex-1 pr-12"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isStreaming}
              className="cosmic-button py-3 px-4 flex items-center justify-center shrink-0 disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
