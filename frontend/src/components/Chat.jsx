import React from "react";

function formatTime(timestamp) {
  if (!timestamp) return "";

  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Chat({ messages = [], isLoading, aiName = "Nova" }) {
  return (
    <div className="chat-area">
      {messages.map((message, index) => {
        const isUser = message.role === "user";

        return (
          <div
            key={message.id || index}
            className={`message-row ${
              isUser ? "user-row" : "assistant-row"
            }`}
          >
            {!isUser && (
              <div className="ai-avatar">
                ✨
              </div>
            )}

            <div className="message-group">
              <div
                className={`message-bubble ${
                  isUser
                    ? "user-bubble"
                    : "assistant-bubble"
                }`}
              >
                <div className="message-content">
                  {message.content}
                </div>

                {message.attachments?.length > 0 && (
                  <div className="attachment-list">
                    {message.attachments.map(
                      (file, fileIndex) => (
                        <div
                          key={fileIndex}
                          className="attachment-item"
                        >
                          📎 {file.name}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              <div className="message-meta">
                {!isUser && (
                  <span className="sender-name">
                    {aiName}
                  </span>
                )}

                <span className="message-time">
                  {formatTime(message.timestamp)}
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {isLoading && (
        <div className="typing-wrapper">
          <div className="ai-avatar">
            ✨
          </div>

          <div className="typing-bubble">
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chat;