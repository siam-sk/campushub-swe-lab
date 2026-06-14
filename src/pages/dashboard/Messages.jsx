import { useState, useMemo, useEffect, useRef } from 'react';

const initialConversations = [
  {
    id: 'sarah',
    name: 'Sarah Johnson',
    preview: 'Thanks for sharing the notes!',
    time: '2m ago',
    unread: 0,
    role: 'Student',
    initials: 'SJ',
  },
  {
    id: 'study-group',
    name: 'Study Group - D',
    preview: 'Meeting tomorrow at 3 PM',
    time: '15m ago',
    unread: 5,
    role: 'Group',
    initials: 'SG',
  },
  {
    id: 'michael',
    name: 'Michael Chen',
    preview: 'Did you finish the assignment?',
    time: '1h ago',
    unread: 0,
    role: 'Student',
    initials: 'MC',
  },
  {
    id: 'prof',
    name: 'Prof. David Williar',
    preview: 'Office hours extended',
    time: '2h ago',
    unread: 1,
    role: 'Faculty',
    initials: 'DW',
  },
];

export default function Messages() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeConv, setActiveConv] = useState(initialConversations[0]);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const chatBodyRef = useRef(null);

  // Load messages for active conversation
  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/messages?conversationId=${activeConv.id}`);
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        } else {
          // Fallback initial messages if DB is empty
          setMessages([
            { id: 'm1', body: `Hello! I am ${activeConv.name}. How can I help?`, incoming: true, time: '10:00 AM' }
          ]);
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [activeConv.id, activeConv.name]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const newMessage = {
      conversationId: activeConv.id,
      sender: 'You',
      body: inputText,
      incoming: false,
    };

    // Optimistic UI update
    const tempId = Date.now();
    setMessages(prev => [...prev, { ...newMessage, _id: tempId, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setInputText('');

    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMessage),
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const filteredConversations = useMemo(() => {
    if (searchQuery.trim() === '') return initialConversations;
    const lowerQuery = searchQuery.toLowerCase();
    return initialConversations.filter(c => 
      c.name.toLowerCase().includes(lowerQuery) ||
      c.preview.toLowerCase().includes(lowerQuery) ||
      c.role.toLowerCase().includes(lowerQuery)
    );
  }, [searchQuery]);

  return (
    <div className="dashboard-view messages-view">
      <aside className="messages-sidebar">
        <h1>Messages</h1>
        <div className="messages-search">
          <span aria-hidden="true">🔍</span>
          <input 
            type="search" 
            placeholder="Search conversations..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="messages-list">
          {filteredConversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              className={`message-row ${conversation.id === activeConv.id ? 'active' : ''}`}
              onClick={() => setActiveConv(conversation)}
            >
              <span className="message-avatar">{conversation.initials}</span>
              <span className="message-info">
                <span className="message-name">{conversation.name}</span>
                <span className="message-preview">{conversation.preview}</span>
                <span className="message-role">{conversation.role}</span>
              </span>
              <span className="message-meta">
                <span>{conversation.time}</span>
                {conversation.unread ? <span className="message-unread">{conversation.unread}</span> : null}
              </span>
            </button>
          ))}
        </div>
      </aside>

      <section className="messages-chat">
        <header className="chat-header">
          <div className="chat-user">
            <span className="message-avatar">{activeConv.initials}</span>
            <div>
              <strong>{activeConv.name}</strong>
              <span>Online</span>
            </div>
          </div>
          <div className="chat-actions">
            <button type="button" aria-label="Call" onClick={() => alert('Voice call starting...')}>📞</button>
            <button type="button" aria-label="Video call" onClick={() => alert('Video call starting...')}>🎥</button>
            <button type="button" aria-label="More">⋮</button>
          </div>
        </header>

        <div className="chat-body" ref={chatBodyRef}>
          {loading ? (
            <div className="loading-spinner" style={{ margin: 'auto' }}>Loading messages...</div>
          ) : (
            messages.map((message) => (
              <div
                key={message._id || message.id}
                className={`chat-bubble ${message.incoming ? 'incoming' : 'outgoing'}`}
              >
                <p>{message.body}</p>
                <span className="chat-time">{message.time}</span>
              </div>
            ))
          )}
        </div>

        <footer className="chat-input">
          <button type="button" className="chat-attach" aria-label="Attach" onClick={() => alert('Attachment feature coming soon')}>
            📎
          </button>
          <input 
            type="text" 
            placeholder="Type a message..." 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button type="button" className="chat-send" aria-label="Send" onClick={handleSend}>
            ➤
          </button>
        </footer>
      </section>
    </div>
  );
}
