import React from "react";

const MessageActions = ({ text }) => {

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Copy failed");
    }
  };

  return (
    <div className="message-actions">

      <button
        className="action-btn"
        onClick={handleCopy}
        title="Copy"
      >
        📋
      </button>

      <button
        className="action-btn"
        title="Regenerate"
      >
        🔄
      </button>

      <button
        className="action-btn"
        title="Like"
      >
        👍
      </button>

      <button
        className="action-btn"
        title="Dislike"
      >
        👎
      </button>

    </div>
  );
};

export default MessageActions;