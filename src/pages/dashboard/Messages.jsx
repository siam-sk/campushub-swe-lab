import { useState, useMemo, useEffect, useRef } from 'react';
import { auth } from '../../firebase';
import useProfile from '../../hooks/useProfile';

export default function Messages() {
  const { profile } = useProfile();
  
  // Search query to filter sidebar contacts list
  const [searchQuery, setSearchQuery] = useState('');
  
  // Contacts and active conversation states
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  
  // Message input state
  const [inputText, setInputText] = useState('');
  
  // User directory search states
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  // Loader states
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const chatBodyRef = useRef(null);

  const getToken = async () => {
    const mockToken = localStorage.getItem('campushub_mock_token');
    if (mockToken) return mockToken;
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    return null;
  };

  // Load conversations list
  const loadConversations = async () => {
    setLoadingConversations(true);
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch('/api/messages', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
        // Automatically open the first conversation if activeConv is not selected yet
        if (data.conversations?.length > 0 && !activeConv) {
          setActiveConv(data.conversations[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations list:', err);
    } finally {
      setLoadingConversations(false);
    }
  };

  // Load messages history for selected contact
  const loadMessages = async () => {
    if (!activeConv?.id) return;
    setLoadingMessages(true);
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`/api/messages?userB=${activeConv.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Mount listeners
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        loadConversations();
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Reload messages on active conversation switch
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        loadMessages();
      }
    });
    return () => {
      active = false;
    };
  }, [activeConv?.id]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle searching new students/faculty
  const handleUserSearch = async (val) => {
    setUserSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const token = await getToken();
      const res = await fetch(`/api/messages/users?q=${encodeURIComponent(val)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.users || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Select user from search and start conversation
  const handleStartConversation = (userObj) => {
    const newConv = {
      id: userObj.id,
      name: userObj.fullName,
      studentId: userObj.studentId || '',
      facultyId: userObj.facultyId || '',
      preview: 'Start a conversation...',
      time: 'Now',
      role: userObj.role,
    };

    setConversations((prev) => {
      const exists = prev.some((c) => c.id === userObj.id);
      if (exists) return prev;
      return [newConv, ...prev];
    });

    setActiveConv(newConv);
    setSearchResults([]);
    setUserSearchQuery('');
  };

  // Send message
  const handleSend = async () => {
    if (!inputText.trim() || !activeConv) return;

    const bodyText = inputText;
    setInputText('');

    // Optimistic UI update
    const optimisticMsg = {
      _id: Date.now(),
      senderId: profile?.uid || 'You',
      receiverId: activeConv.id,
      body: bodyText,
      timestamp: new Date(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const token = await getToken();
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          receiverId: activeConv.id,
          receiverName: activeConv.name,
          body: bodyText,
        }),
      });

      if (res.ok) {
        // Refresh conversations list to update preview
        setConversations((prev) =>
          prev.map((c) => (c.id === activeConv.id ? { ...c, preview: bodyText, time: 'Now' } : c))
        );
      }
    } catch (err) {
      console.error('Send failed:', err);
    }
  };

  const getInitials = (name = '') => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  };

  // Filter conversations list on search query
  const filteredConversations = useMemo(() => {
    if (searchQuery.trim() === '') return conversations;
    const lowerQuery = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerQuery) ||
        (c.preview && c.preview.toLowerCase().includes(lowerQuery))
    );
  }, [conversations, searchQuery]);

  return (
    <div className="dashboard-view messages-view">
      <aside className="messages-sidebar">
        <h1>Messages</h1>

        {/* User Search Directory Input */}
        <div className="messages-search" style={{ marginBottom: '10px' }}>
          <span aria-hidden="true">👤</span>
          <input
            type="search"
            placeholder="Search student/faculty..."
            value={userSearchQuery}
            onChange={(e) => handleUserSearch(e.target.value)}
          />
        </div>

        {/* User Search Results Dropdown Panel */}
        {searchResults.length > 0 ? (
          <div
            style={{
              maxHeight: '180px',
              overflowY: 'auto',
              border: '1px solid #d0d5dd',
              borderRadius: '8px',
              backgroundColor: '#fff',
              marginBottom: '15px',
              padding: '5px',
            }}
          >
            {searchResults.map((user) => {
              const displayId = user.role === 'student' ? user.studentId : (user.role === 'faculty' ? user.facultyId : '');
              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleStartConversation(user)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    background: 'none',
                    border: 'none',
                    borderBottom: '1px solid #f2f4f7',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  <strong>{user.fullName}</strong> <span style={{ fontSize: '11px', color: '#667085' }}>({user.role})</span>
                  {displayId && <span style={{ display: 'block', fontSize: '12px', color: '#475467' }}>{displayId}</span>}
                </button>
              );
            })}
          </div>
        ) : null}

        {/* Contacts Filter Search */}
        <div className="messages-search">
          <span aria-hidden="true">🔍</span>
          <input
            type="search"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Conversations List */}
        <div className="messages-list">
          {loadingConversations ? (
            <div className="loading-spinner" style={{ margin: '20px auto' }}></div>
          ) : filteredConversations.length ? (
            filteredConversations.map((conversation) => {
              const displayId = conversation.studentId || conversation.facultyId || conversation.role || 'Member';
              return (
                <button
                  key={conversation.id}
                  type="button"
                  className={`message-row ${activeConv && conversation.id === activeConv.id ? 'active' : ''}`}
                  onClick={() => setActiveConv(conversation)}
                >
                  <span className="message-avatar">{getInitials(conversation.name)}</span>
                  <span className="message-info">
                    <span className="message-name">{conversation.name}</span>
                    <span className="message-preview">{conversation.preview}</span>
                    <span className="message-role">{displayId}</span>
                  </span>
                  <span className="message-meta">
                    <span>{conversation.time}</span>
                  </span>
                </button>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', color: '#667085', marginTop: '20px', fontSize: '14px' }}>
              No chats yet. Search directory above to start a conversation!
            </div>
          )}
        </div>
      </aside>

      <section className="messages-chat">
        {activeConv ? (
          <>
            <header className="chat-header">
              <div className="chat-user">
                <span className="message-avatar">{getInitials(activeConv.name)}</span>
                <div>
                  <strong>{activeConv.name}</strong>
                  <span>{activeConv.studentId || activeConv.facultyId || 'Direct Chat'}</span>
                </div>
              </div>
              <div className="chat-actions">
                <button type="button" aria-label="Call" onClick={() => alert('Voice call starting...')}>📞</button>
                <button type="button" aria-label="Video call" onClick={() => alert('Video call starting...')}>🎥</button>
                <button type="button" aria-label="More">⋮</button>
              </div>
            </header>

            <div className="chat-body" ref={chatBodyRef}>
              {loadingMessages ? (
                <div className="loading-spinner" style={{ margin: 'auto' }}>Loading history...</div>
              ) : messages.length ? (
                messages.map((message) => {
                  const isIncoming = message.senderId !== (profile?.uid || 'You');
                  return (
                    <div
                      key={message._id}
                      className={`chat-bubble ${isIncoming ? 'incoming' : 'outgoing'}`}
                    >
                      <p>{message.body}</p>
                      <span className="chat-time">
                        {message.time || new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', color: '#667085', marginTop: '40px' }}>
                  No messages yet. Say hi to start the conversation!
                </div>
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
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#667085' }}>
            <span style={{ fontSize: '3rem' }}>💬</span>
            <h3>No conversation active</h3>
            <p>Select a contact from the sidebar or search above to begin chatting.</p>
          </div>
        )}
      </section>
    </div>
  );
}
