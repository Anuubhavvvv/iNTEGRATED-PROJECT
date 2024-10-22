import React, { useState, useEffect, useRef } from 'react';
import { Smile, Paperclip, X } from 'lucide-react';

const TypingIndicator = () => (
  <div className="flex items-center space-x-2 p-3 bg-gray-100 rounded-lg max-w-[100px]">
    <div className="flex space-x-1">
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  </div>
);

const Message = ({ text, isBot, isTyping }) => {
  if (isTyping) return <TypingIndicator />;
  
  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-4`}>
      <div className={`p-3 rounded-lg max-w-[80%] ${
        isBot 
          ? 'bg-gray-100 text-gray-800' 
          : 'bg-purple-500 text-white'
      }`}>
        {text}
      </div>
    </div>
  );
};

const FloatingParticle = ({ color, delay }) => (
  <div 
    className={`absolute w-2 h-2 rounded-full ${color} animate-float`}
    style={{
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${delay}s`
    }}
  />
);

const ModernChatUI = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { text: "Hello! I'm your Ultimate Computer Science Chatbot. How can I help you today?", isBot: true }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!message.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, { text: message, isBot: false }]);
    const userMessage = message;
    setMessage('');
    
    // Show typing indicator
    setIsTyping(true);
    
    try {
      // Send message to backend
      const response = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });
      
      const data = await response.json();
      
      // Hide typing indicator and add bot response
      setIsTyping(false);
      setMessages(prev => [...prev, { text: data.response, isBot: true }]);
    } catch (error) {
      console.error('Error:', error);
      setIsTyping(false);
      setMessages(prev => [...prev, { 
        text: "Sorry, I'm having trouble connecting right now. Please try again.", 
        isBot: true 
      }]);
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-50 flex items-center justify-center overflow-hidden">
      {/* Floating Particles */}
      {[...Array(12)].map((_, i) => (
        <FloatingParticle 
          key={i}
          color={[
            'bg-purple-400',
            'bg-blue-400',
            'bg-green-400',
            'bg-yellow-400',
            'bg-red-400'
          ][i % 5]}
          delay={i * 0.5}
        />
      ))}
      
      {/* Chat Container */}
      <div className="relative w-96 h-[600px] bg-white rounded-3xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-purple-500 rounded-t-3xl flex items-center">
          <div className="w-10 h-10 rounded-full bg-purple-400 mr-3" />
          <div className="text-white">
            <h2 className="font-semibold">CS Chatbot</h2>
          </div>
          <button className="ml-auto text-white/80 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Chat Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          {messages.map((msg, index) => (
            <Message key={index} {...msg} />
          ))}
          {isTyping && <Message isTyping={true} isBot={true} />}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input Area */}
        <div className="p-4 border-t">
          <div className="flex items-center bg-gray-50 rounded-full px-4 py-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a Message..."
              className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400"
            />
            <button className="p-2 text-gray-400 hover:text-purple-500">
              <Paperclip className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-purple-500">
              <Smile className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernChatUI;
