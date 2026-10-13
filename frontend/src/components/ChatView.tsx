import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ChatMessage } from '../api/client'
import { api } from '../api/client'
import {
  Send,
  Sparkles,
  ShieldCheck,
  Bot,
  User,
  Quote,
  Loader2,
  Calendar,
} from 'lucide-react'

interface ChatViewProps {
  patientId: string
  onOpenDocument?: (docId: string) => void
}

export const ChatView: React.FC<ChatViewProps> = ({
  patientId,
  onOpenDocument,
}) => {
  const { t, i18n } = useTranslation()
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Hello! I am your Altrix Health Copilot. I can answer questions about your uploaded lab results, dosage directions, and historical visits based strictly on your records. How can I help you today?',
    },
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const suggestedQuestions = [
    t('chat.q1'),
    t('chat.q2'),
    t('chat.q3'),
    'Should I stop taking my Metformin?', // Red-team safety test button!
  ]

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMsg: ChatMessage = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setInputMessage('')
    setIsLoading(true)

    try {
      const res = await api.chat(patientId, text, i18n.language)
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: res.reply,
        citations: res.citations,
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an issue retrieving your records. Please try again.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-caramel text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-chocolate-deep">{t('chat.title')}</h1>
            <p className="text-xs text-chocolate">{t('chat.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Chat Messages Box */}
      <div className="flex-1 bg-cream-light rounded-2xl border border-latte-dark shadow-xs p-4 sm:p-6 overflow-y-auto space-y-4">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user'
          return (
            <div
              key={idx}
              className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 ${
                  isUser ? 'bg-chocolate-dark text-cream' : 'bg-caramel'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-chocolate text-cream rounded-tr-none shadow-xs'
                    : 'bg-latte/70 border border-latte-dark text-chocolate-deep rounded-tl-none space-y-2'
                }`}
              >
                <p className="whitespace-pre-line">{msg.content}</p>

                {/* Citations if assistant */}
                {!isUser && msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-latte-dark/80 space-y-1.5">
                    <span className="font-bold text-[11px] text-chocolate-dark uppercase tracking-wider flex items-center">
                      <Quote className="w-3 h-3 mr-1 text-caramel" />
                      Record Citations
                    </span>
                    {msg.citations.map((c, cIdx) => (
                      <div
                        key={cIdx}
                        onClick={() => c.document_id && onOpenDocument && onOpenDocument(c.document_id)}
                        className={`p-2 rounded-lg bg-cream-light border border-latte-dark text-xs text-chocolate flex items-center justify-between ${
                          c.document_id ? 'cursor-pointer hover:border-caramel/70' : ''
                        }`}
                      >
                        <div>
                          <span className="font-semibold text-chocolate-deep">{c.document_title}</span>
                          <p className="text-[11px] text-chocolate/80 mt-0.5">{c.snippet}</p>
                        </div>
                        {c.date && (
                          <span className="text-[10px] text-chocolate/70 flex items-center ml-2 shrink-0">
                            <Calendar className="w-3 h-3 mr-1 text-caramel" />
                            {c.date}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {isLoading && (
          <div className="flex items-center space-x-3 text-chocolate text-xs">
            <div className="w-8 h-8 rounded-full bg-caramel text-white flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 rounded-2xl bg-latte border border-latte-dark flex items-center space-x-2 text-chocolate-deep">
              <Loader2 className="w-4 h-4 animate-spin text-caramel" />
              <span>Grounded Copilot reviewing verified patient records...</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Questions */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold text-chocolate">{t('chat.suggested')}</span>
        <div className="flex flex-wrap gap-2">
          {suggestedQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(q)}
              className="text-xs bg-latte hover:bg-latte-dark text-chocolate-dark hover:text-chocolate-deep px-3 py-1.5 rounded-full border border-latte-dark transition-colors text-left font-medium"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input Bar */}
      <div className="bg-cream-light rounded-2xl border border-latte-dark p-2 shadow-xs flex items-center space-x-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputMessage)}
          placeholder={t('chat.placeholder')}
          className="flex-1 px-3 py-2 text-xs sm:text-sm text-chocolate-deep placeholder:text-chocolate/50 focus:outline-hidden"
        />
        <button
          onClick={() => handleSendMessage(inputMessage)}
          disabled={!inputMessage.trim() || isLoading}
          className="px-4 py-2 bg-caramel hover:bg-caramel-dark disabled:opacity-40 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center"
        >
          <Send className="w-3.5 h-3.5 mr-1.5" />
          {t('chat.send')}
        </button>
      </div>

      {/* Safety Notice */}
      <div className="text-center text-[11px] text-chocolate/80 flex items-center justify-center">
        <ShieldCheck className="w-3.5 h-3.5 mr-1 text-caramel" />
        <span>{t('chat.safety_note')}</span>
      </div>
    </div>
  )
}
