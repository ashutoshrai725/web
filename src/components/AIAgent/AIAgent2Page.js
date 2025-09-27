import React, { useState, useRef } from 'react';
import './AIAgent2Page.css';

const API_KEY = "AIzaSyBj9AInwAeHJG8QLVcTmdHxh7AGaTe4si4";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${API_KEY}`;

const AIAgent2Page = ({ onPageChange }) => {
    const [messages, setMessages] = useState([
        { text: "Hello! I am the MANUDOCS AI Agent. Ask me anything, and I'll provide a concise, genuine answer.", sender: "ai" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const chatBoxRef = useRef(null);

    const addMessage = (text, sender) => {
        setMessages(prev => [...prev, { text, sender }]);
        setTimeout(() => {
            if (chatBoxRef.current) {
                chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
            }
        }, 100);
    };

    const sendMessage = async () => {
        const userText = input.trim();
        if (!userText || loading) return;
        addMessage(userText, 'user');
        setInput('');
        setLoading(true);

        try {
            const payload = {
                contents: [{ parts: [{ text: userText }] }],
                systemInstruction: {
                    parts: [{ text: "You are a highly precise, to-the-point AI assistant. Answer questions concisely and factually, without conversational filler or pleasantries. Your goal is to provide genuine, direct answers." }]
                },
            };

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            const aiResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't get a response. Please try again.";
            addMessage(aiResponse, 'ai');
        } catch (error) {
            addMessage("I'm sorry, an error occurred. Please try again later.", 'ai');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ai2-container" style={{ position: 'relative' }}>
            {/* Step 2: Add Back to Home Button */}
            <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10 }}>
                <button
                    onClick={() => onPageChange('landing')}
                    style={{
                        background: '#528a64',
                        color: '#fff',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                    }}
                >
                    ← Home
                </button>
            </div>
            <div className="ai2-header">
                <div className="ai2-logo">
                    <img src="https://i.postimg.cc/qhqjBrYN/mnuverse.jpg" height="70px" width="60px" alt="" />
                </div>
                <div className="ai2-title" >MANUDOCS AI</div>
            </div>
            <div className="ai2-chat-box" ref={chatBoxRef}>
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`ai2-message ${msg.sender === 'user' ? 'ai2-user-message' : 'ai2-ai-message'}`}
                        dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br>') }}
                    />
                ))}
                {loading && (
                    <div className="ai2-loading-indicator">
                        <div className="ai2-dot"></div>
                        <div className="ai2-dot"></div>
                        <div className="ai2-dot"></div>
                    </div>
                )}
            </div>
            <div className="ai2-input-area">
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Type your message..."
                    onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
                />
                <button onClick={sendMessage}>Send</button>
            </div>
        </div>
    );
};

export default AIAgent2Page;