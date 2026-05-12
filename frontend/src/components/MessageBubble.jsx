import MessageActions from "./MessageActions";
import React from "react";

const formatTime = () => {
  const now = new Date();

  return now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const MessageBubble = ({ message }) => {
  const isUser = message.role === "user";

  return (
    <div className={`message-row ${isUser ? "user" : "bot"}`}>
      
      {!isUser && <div className="avatar bot">AI</div>}

      <div className="message-block">

       <div className="bubble-wrapper">

  <div
    className={`bubble ${
      isUser ? "user-bubble" : "bot-bubble"
    }`}
  >
    {message.content}
  </div>

  {!isUser && (
    <MessageActions text={message.content} />
  )}

</div>
        <div className="timestamp">
          {formatTime()}
        </div>

      </div>

      {isUser && <div className="avatar user">You</div>}
    </div>
  );
};

export default MessageBubble;