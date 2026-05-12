import React from "react";

const TypingIndicator = () => {
  return (
    <div className="message-row bot">

      <div className="avatar bot">AI</div>

      <div className="message-block">

        <div className="bubble bot-bubble typing">
          <span></span>
          <span></span>
          <span></span>
        </div>

        <div className="timestamp">
          typing...
        </div>

      </div>
    </div>
  );
};

export default TypingIndicator;