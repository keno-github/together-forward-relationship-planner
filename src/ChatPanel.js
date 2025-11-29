import React, { useRef, useState } from 'react';
import { Bot, User, Send, Loader2 } from 'lucide-react';

const ChatPanel = ({ chatMessages, sendChatMessage, isChatLoading }) => {
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput);
    setChatInput('');
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 border-2 border-purple-200">
        <p className="text-purple-800 text-sm">
          💬 Ask Luna anything about this goal! She knows your situation and can give personalized advice.
        </p>
      </div>

      {/* Messages */}
      <div className="bg-gray-50 rounded-2xl p-4 min-h-[400px] max-h-[500px] overflow-y-auto space-y-3">
        {chatMessages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-6 h-6 text-white" />
              </div>
            )}
            <div className={`max-w-[75%] p-4 rounded-2xl ${
              msg.role === 'user' ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white' : 'bg-white border-2 border-purple-200'
            }`}>
              <p className={`text-sm leading-relaxed whitespace-pre-line ${
                msg.role === 'user' ? 'text-white' : 'text-gray-800'
              }`}>
                {msg.content}
                {/* Typing cursor for streaming messages */}
                {msg.isStreaming && (
                  <span className="inline-block w-2 h-4 ml-1 bg-purple-500 animate-pulse rounded-sm" />
                )}
              </p>
            </div>
            {msg.role === 'user' && (
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-white" />
              </div>
            )}
          </div>
        ))}

        {/* Only show loading spinner if loading but no streaming message exists yet */}
        {isChatLoading && !chatMessages.some(m => m.isStreaming) && (
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div className="bg-white border-2 border-purple-200 p-4 rounded-2xl">
              <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Ask Luna anything about this goal..."
          className="flex-1 px-5 py-4 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base"
        />
        <button
          type="submit"
          disabled={!chatInput.trim() || isChatLoading}
          className="px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
        >
          <Send className="w-5 h-5" /> Send
        </button>
      </form>
    </div>
  );
};

export default ChatPanel;
