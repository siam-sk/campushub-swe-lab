import { useEffect, useState } from 'react';

const fallbackMessages = [];

export default function AssistantPage() {
  const [messages, setMessages] = useState(fallbackMessages);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    const loadMessages = async () => {
      try {
        const response = await fetch('/api/assistant', { signal: controller.signal });
        if (!response.ok) {
          throw new Error('Unable to load assistant');
        }
        const payload = await response.json();
        setMessages(payload.messages || fallbackMessages);
      } catch {
        setMessages(fallbackMessages);
      }
    };

    loadMessages();

    return () => controller.abort();
  }, []);

  const handleSend = async () => {
    if (!draft.trim()) {
      return;
    }

    const newMessage = { sender: 'user', body: draft };
    setMessages((prev) => [...prev, newMessage]);
    setDraft('');

    await fetch('/api/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMessage),
    });
  };

  return (
    <div className="dashboard-view assistant-view">
      <section className="assistant-hero">
        <span className="feature-pill">New Feature - AI Study Assistant</span>
        <h1>AI Study Assistant</h1>
        <p>Get instant help with your studies 24/7</p>
      </section>

      <section className="assistant-actions">
        {['Explain Concept', 'Solve Problem', 'Debug Code', 'Calculate'].map((item) => (
          <button key={item} type="button">{item}</button>
        ))}
      </section>

      <section className="assistant-chat">
        <div className="assistant-messages">
          {messages.length ? (
            messages.map((message, index) => (
              <div
                key={`${message.sender}-${index}`}
                className={`assistant-bubble ${message.sender === 'user' ? 'outgoing' : 'incoming'}`}
              >
                {message.body}
              </div>
            ))
          ) : (
            <div className="empty-state">No assistant messages yet.</div>
          )}
        </div>
        <div className="assistant-input">
          <input
            type="text"
            placeholder="Ask me anything about your studies..."
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <button type="button" onClick={handleSend}>Send</button>
        </div>
      </section>
    </div>
  );
}
