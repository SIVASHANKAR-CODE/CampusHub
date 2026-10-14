import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { aiAPI } from '../../services/api';
import { Bot, Send, User, AlertCircle, Loader } from 'lucide-react';
import './AIAssistant.css';

const QUICK_QUESTIONS = [
  'What is my attendance percentage?',
  'Do I have any upcoming exams?',
  'What is my fee due amount?',
  'Where is the principal office?',
  'How do I apply for leave?',
  'What events are coming up?',
];

function renderInlineText(text) {
  const segments = String(text).split(/(\*\*.*?\*\*)/g);
  return segments.map((segment, index) => {
    if (segment.startsWith('**') && segment.endsWith('**')) {
      return <strong key={`${segment}-${index}`}>{segment.slice(2, -2)}</strong>;
    }
    return <span key={`${segment}-${index}`}>{segment}</span>;
  });
}

function renderRichMessage(content) {
  const lines = String(content ?? '').split(/\n/);
  const nodes = [];
  let listType = null;
  let items = [];

  const flushList = () => {
    if (!listType || items.length === 0) return;
    const ListTag = listType === 'ul' ? 'ul' : 'ol';
    nodes.push(
      <ListTag key={`list-${nodes.length}`}>
        {items.map((item, index) => <li key={`${item}-${index}`}>{renderInlineText(item)}</li>)}
      </ListTag>
    );
    listType = null;
    items = [];
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      nodes.push(<div key={`empty-${index}`} className="chat-line-spacer" />);
      return;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      items.push(trimmed.replace(/^[-*]\s+/, ''));
      listType = listType || 'ul';
      if (listType !== 'ul') {
        flushList();
        listType = 'ul';
        items.push(trimmed.replace(/^[-*]\s+/, ''));
      }
      return;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      items.push(trimmed.replace(/^\d+\.\s+/, ''));
      listType = listType || 'ol';
      if (listType !== 'ol') {
        flushList();
        listType = 'ol';
        items.push(trimmed.replace(/^\d+\.\s+/, ''));
      }
      return;
    }

    flushList();
    nodes.push(<p key={`line-${index}`}>{renderInlineText(trimmed)}</p>);
  });

  flushList();
  return nodes;
}

function Message({ msg }) {
  const isBot = msg.role === 'assistant';
  return (
    <div className={`chat-message ${isBot ? 'bot' : 'user'}`}>
      <div className="chat-avatar">
        {isBot ? <Bot size={16} /> : <User size={16} />}
      </div>
      <div className="chat-bubble">
        {msg.isHighRisk && (
          <div className="high-risk-note">
            <AlertCircle size={14} />
            <span>I can explain this process but can't perform this action directly.</span>
          </div>
        )}
        <div className="chat-content">{renderRichMessage(msg.content)}</div>
        <span className="chat-time">{msg.time}</span>
      </div>
    </div>
  );
}

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hi! I\'m your CampusHub AI assistant. I can help you with your attendance, fees, exam schedule, campus locations, events, and more. What would you like to know?',
      time: formatTime(new Date()),
    }
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const sendMutation = useMutation({
    mutationFn: (message) => aiAPI.chat(message),
    onSuccess: ({ data }) => {
      const answer = data?.data?.answer || "I'm not sure how to help with that.";
      setMessages((prev) => [...prev, {
        id: Date.now() + '-bot',
        role: 'assistant',
        content: answer,
        isHighRisk: data?.data?.isHighRisk,
        time: formatTime(new Date()),
      }]);
    },
    onError: (error) => {
      const backendMessage = error?.response?.data?.message;
      setMessages((prev) => [...prev, {
        id: Date.now() + '-err',
        role: 'assistant',
        content: backendMessage || 'I couldn’t retrieve your campus details right now. Please try again in a moment.',
        time: formatTime(new Date()),
      }]);
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sendMutation.isPending]);

  const handleSend = (text) => {
    const msg = (text ?? input).trim();
    if (!msg || sendMutation.isPending) return;

    setMessages((prev) => [...prev, {
      id: Date.now() + '-user',
      role: 'user',
      content: msg,
      time: formatTime(new Date()),
    }]);
    setInput('');
    sendMutation.mutate(msg);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="ai-page">
      <div className="ai-header">
        <div className="ai-header-icon"><Bot size={22} /></div>
        <div>
          <h1 className="page-title" style={{ fontSize: 'var(--text-xl)' }}>Campus AI Assistant</h1>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>Campus data plus general answers</p>
        </div>
      </div>

      <div className="chat-window">
        {messages.map((msg) => <Message key={msg.id} msg={msg} />)}
        {sendMutation.isPending && (
          <div className="chat-message bot">
            <div className="chat-avatar"><Bot size={16} /></div>
            <div className="chat-bubble typing">
              <Loader size={16} className="spin" />
              <span className="typing-text">AI is thinking...</span>
              <span className="typing-dots" aria-label="AI is typing"><span /> <span /> <span /></span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length === 1 && (
        <div className="quick-questions">
          {QUICK_QUESTIONS.map((q) => (
            <button key={q} className="quick-chip" onClick={() => handleSend(q)}>{q}</button>
          ))}
        </div>
      )}

      <div className="chat-input-bar">
        <input
          ref={inputRef}
          className="chat-input"
          type="text"
          placeholder="Ask anything about your campus…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={500}
          disabled={sendMutation.isPending}
        />
        <button
          className="chat-send-btn"
          onClick={() => handleSend()}
          disabled={!input.trim() || sendMutation.isPending}
          aria-label="Send message"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

function formatTime(d) {
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}
