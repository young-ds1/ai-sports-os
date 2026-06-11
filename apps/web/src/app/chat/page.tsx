'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { sendChatMessage } from '@/lib/api-client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  message: string;
  sources?: any[];
  confidence?: number;
}

export default function ChatPage() {
  const searchParams = useSearchParams();
  const matchId = searchParams.get('matchId') || undefined;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // Optimistic user message
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', message: userMessage }]);

    try {
      const res = await sendChatMessage({ sessionId, message: userMessage, matchId });
      if (res.sessionId) setSessionId(res.sessionId);

      setMessages(prev => [...prev, {
        id: res.message?.id || Date.now().toString(),
        role: 'assistant',
        message: res.message?.message || '抱歉，我暂时无法回答。',
        sources: res.message?.sources,
        confidence: res.message?.confidence,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        message: '⚠️ 连接失败，请确保后端服务已启动。',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <div className="mb-4">
        <h1 className="text-xl font-bold">💬 AI 体育问答</h1>
        <p className="text-sm text-gray-500">优先查询数据库，拒绝编造数据</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-20">
            <p className="text-3xl mb-2">🤖</p>
            <p>问我任何体育相关的问题</p>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {['今天有哪些比赛？', '阿根廷对巴西的比赛结果？', 'Messi 最近表现怎么样？'].map(q => (
                <button
                  key={q}
                  onClick={() => { setInput(q); handleSend(); }}
                  className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-gray-200 shadow-sm'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
              {/* Sources */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="flex flex-wrap gap-1">
                    {msg.sources.map((s: any, i: number) => (
                      <span key={i} className="text-xs px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">
                        {s.type === 'database' ? `📊 ${s.table}` : s.type === 'llm_inference' ? '🧠 AI推理' : `📋 ${s.type}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {msg.confidence && msg.role === 'assistant' && (
                <div className="text-xs text-gray-400 mt-1">置信度: {msg.confidence}%</div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-gray-50 pt-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={matchId ? '针对本场比赛提问...' : '输入你的体育问题...'}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary-500"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="btn-primary px-6"
          >
            {loading ? '...' : '发送'}
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">
          AI 优先查询数据库，拒绝编造数据
        </p>
      </div>
    </div>
  );
}
