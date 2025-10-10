import React, { useState } from 'react';
import './ChatUI.css';
import { askSyllabusQuestion } from '../utils/api'; // Import the API function for syllabus questions
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
        const response = await askSyllabusQuestion(userMessage.text, token); // Call backend API
        
        // Add AI response with marks and footer to messages
        const aiMessage = {
          text: response.answer,
          sender: 'ai',
          marks: response.predicted_marks,
          footer: `✅ Verified from your uploaded syllabus (Confidence: ${response.confidence}%, ${response.source})`
        };
        setMessages((prevMessages) => [...prevMessages, aiMessage]);

      } catch (error) {
        console.error('Error asking syllabus question:', error);
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
            {msg.sender === 'ai' && msg.marks && (
              <div className="marks-suggestion">
                Suggested Marks: <strong>{msg.marks}</strong>
              </div>
            )}
            {msg.text}
            {msg.sender === 'ai' && msg.footer && (
              <div className="trust-footer">
                {msg.footer}
              </div>
            )}
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