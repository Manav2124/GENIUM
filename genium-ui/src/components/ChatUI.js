import React, { useState } from 'react';
import './ChatUI.css';

const ChatUI = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      setMessages([...messages, { text: message, sender: 'user' }]);
      setMessage('');
      // Simulate a response
      setTimeout(() => {
        setMessages((prevMessages) => [...prevMessages, { text: "This is a simulated response.", sender: 'ai' }]);
      }, 1000);
    }
  };

  return (
    <div className="chat-container">
      <div className="messages-display">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
      </div>
      <div className="siri-wave-container">
        <div className="siri-wave"></div>
      </div>
      <form onSubmit={handleSendMessage} className="chat-input-form">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="chat-input"
        />
        <button type="submit" className="send-button">Send</button>
      </form>
    </div>
  );
};

export default ChatUI;