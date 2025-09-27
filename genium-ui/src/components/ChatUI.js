import React, { useState } from 'react';
import './ChatUI.css';
import { askDocumentQuestion } from '../utils/api'; // Import the API function
import { useSession } from 'next-auth/react'; // Import useSession

const ChatUI = () => {
  const { data: session } = useSession(); // Get session data
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // New state for loading

  const handleSendMessage = async (e) => { // Make function async
    e.preventDefault();
    if (message.trim()) {
      const userMessage = { text: message, sender: 'user' };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setMessage('');
      setIsLoading(true); // Set loading to true

      try {
        const token = session?.accessToken; // Get token from session
        const response = await askDocumentQuestion(userMessage.text, token); // Call backend API
        setMessages((prevMessages) => [...prevMessages, { text: response.answer, sender: 'ai' }]);
      } catch (error) {
        console.error('Error asking document question:', error);
        setMessages((prevMessages) => [...prevMessages, { text: `Error: ${error.message}`, sender: 'ai' }]);
      } finally {
        setIsLoading(false); // Set loading to false
      }
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
        {isLoading && ( // Display loading indicator
          <div className="message ai">
            <div className="siri-wave-container">
              <div className="siri-wave"></div>
            </div>
          </div>
        )}
      </div>
      <form onSubmit={handleSendMessage} className="chat-input-form">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="chat-input"
          disabled={isLoading} // Disable input while loading
        />
        <button type="submit" className="send-button" disabled={isLoading}>Send</button>
      </form>
    </div>
  );
};

export default ChatUI;