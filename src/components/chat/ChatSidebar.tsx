import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Plus, Loader2 } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useUserStore } from '../../stores/userStore';

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
}

interface ChatSession {
  sessao_id: string;
  title: string;
  date: Date;
}

export default function ChatSidebar({ isOpen, onClose, onNewChat }: ChatSidebarProps) {
  const { user, currentSessionId, setSessionId } = useUserStore();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadSessions();
    }
  }, [isOpen, user, currentSessionId]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      // Get all user messages ordered by date (newest first)
      const { data, error } = await supabase
        .from('mensagens_chat')
        .select('sessao_id, conteudo, criado_em, papel')
        .eq('usuario_id', user!.id)
        .order('criado_em', { ascending: false });

      if (error) throw error;

      // Group by sessao_id and extract the title from the first user message of that session
      const sessionMap = new Map<string, ChatSession>();
      
      // Since data is ordered descending, we process it to find the oldest message of a session to be its title?
      // Or just take the first user message we find in the session (which might be the most recent if we just map,
      // but actually users want the first question they asked as the title).
      
      // Let's reverse to process oldest first, so the first message sets the title.
      const chronological = [...(data || [])].reverse();
      
      chronological.forEach((msg) => {
        if (!msg.sessao_id) return;
        
        if (!sessionMap.has(msg.sessao_id)) {
          sessionMap.set(msg.sessao_id, {
            sessao_id: msg.sessao_id,
            title: msg.papel === 'user' ? msg.conteudo : 'Nova Conversa',
            date: new Date(msg.criado_em)
          });
        } else {
          // Update title if we find a user message and it was still 'Nova Conversa'
          const existing = sessionMap.get(msg.sessao_id)!;
          if (existing.title === 'Nova Conversa' && msg.papel === 'user') {
            existing.title = msg.conteudo;
          }
          // Update date to the most recent message's date
          existing.date = new Date(msg.criado_em);
        }
      });

      // Convert to array and sort by date descending
      const sortedSessions = Array.from(sessionMap.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
      
      setSessions(sortedSessions);
    } catch (err) {
      console.error('Error loading sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSession = (id: string) => {
    setSessionId(id);
    onClose();
  };

  const handleCreateNew = () => {
    onNewChat();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-80 bg-white shadow-2xl z-50 flex flex-col border-r border-cosmic-border"
          >
            <div className="p-4 flex items-center justify-between border-b border-cosmic-border">
              <h2 className="text-cosmic-star font-serif text-lg">Histórico</h2>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-black/5 rounded-full text-cosmic-muted transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              <button
                onClick={handleCreateNew}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#B39EB5] text-white rounded-xl font-medium hover:bg-[#A38CA5] transition-colors shadow-sm"
              >
                <Plus size={18} /> Nova Conversa
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={24} className="text-[#B39EB5] animate-spin" />
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-center text-cosmic-muted text-sm py-8">
                  Nenhuma conversa encontrada.
                </p>
              ) : (
                sessions.map((s) => (
                  <button
                    key={s.sessao_id}
                    onClick={() => handleSelectSession(s.sessao_id)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 ${
                      currentSessionId === s.sessao_id 
                        ? 'bg-[#B39EB5]/10 border border-[#B39EB5]/30' 
                        : 'hover:bg-black/5 border border-transparent'
                    }`}
                  >
                    <MessageSquare size={16} className={`mt-0.5 shrink-0 ${currentSessionId === s.sessao_id ? 'text-[#B39EB5]' : 'text-cosmic-muted'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate font-medium ${currentSessionId === s.sessao_id ? 'text-[#B39EB5]' : 'text-cosmic-text'}`}>
                        {s.title}
                      </p>
                      <p className="text-xs text-cosmic-muted mt-1">
                        {s.date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
