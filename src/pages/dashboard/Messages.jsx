const conversations = [
  {
    id: 'sarah',
    name: 'Sarah Johnson',
    preview: 'Thanks for sharing the note:',
    time: '2m ago',
    unread: 2,
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
  {
    id: 'emma',
    name: 'Emma Wilson',
    preview: 'See you in the library',
    time: '3h ago',
    unread: 0,
    role: 'Student',
    initials: 'EW',
  },
];

const messages = [
  {
    id: 'msg-1',
    sender: 'Sarah Johnson',
    time: '10:30 AM',
    body: "Hey! Do you have the notes from yesterday's lecture?",
    incoming: true,
  },
  {
    id: 'msg-2',
    sender: 'You',
    time: '10:32 AM',
    body: "Yes, I do! I'll upload them to the notes library in a few minutes.",
    incoming: false,
  },
  {
    id: 'msg-3',
    sender: 'Sarah Johnson',
    time: '10:33 AM',
    body: 'That would be great! I missed the part about binary trees.',
    incoming: true,
  },
  {
    id: 'msg-4',
    sender: 'You',
    time: '10:35 AM',
    body: 'No problem! I made detailed notes on that topic. They cover implementation and complexity analysis.',
    incoming: false,
  },
  {
    id: 'msg-5',
    sender: 'Sarah Johnson',
    time: '10:36 AM',
    body: 'Perfect! Thanks so much.',
    incoming: true,
  },
  {
    id: 'msg-6',
    sender: 'You',
    time: '10:45 AM',
    body: 'Just uploaded! Check the Data Structures section.',
    incoming: false,
  },
  {
    id: 'msg-7',
    sender: 'Sarah Johnson',
    time: '10:48 AM',
    body: 'Thanks for sharing the notes!',
    incoming: true,
  },
];

export default function Messages() {
  return (
    <div className="dashboard-view messages-view">
      <aside className="messages-sidebar">
        <h1>Messages</h1>
        <div className="messages-search">
          <span aria-hidden="true">🔍</span>
          <input type="search" placeholder="Search conversations..." />
        </div>
        <div className="messages-list">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              className={`message-row ${conversation.id === 'sarah' ? 'active' : ''}`}
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
            <span className="message-avatar">SJ</span>
            <div>
              <strong>Sarah Johnson</strong>
              <span>Online</span>
            </div>
          </div>
          <div className="chat-actions">
            <button type="button" aria-label="Call">📞</button>
            <button type="button" aria-label="Video call">🎥</button>
            <button type="button" aria-label="More">⋮</button>
          </div>
        </header>

        <div className="chat-body">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`chat-bubble ${message.incoming ? 'incoming' : 'outgoing'}`}
            >
              <p>{message.body}</p>
              <span className="chat-time">{message.time}</span>
            </div>
          ))}
        </div>

        <footer className="chat-input">
          <button type="button" className="chat-attach" aria-label="Attach">
            📎
          </button>
          <input type="text" placeholder="Type a message..." />
          <button type="button" className="chat-send" aria-label="Send">
            ➤
          </button>
        </footer>
      </section>
    </div>
  );
}
