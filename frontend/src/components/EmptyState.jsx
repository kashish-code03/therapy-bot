import React from "react";

const suggestions = [
  "Explain AI in simple terms",
  "Give me startup ideas",
  "Help me prepare for interview",
  "Write a professional email",
];

const EmptyState = ({ onSendMessage }) => {
  return (
    <div className="empty-state">

      <h2>What can I help with?</h2>

      <div className="suggestions">

        {suggestions.map((text, index) => (
          <div
            key={index}
            className="suggestion-card"
            onClick={() => onSendMessage(text)}
          >
            {text}
          </div>
        ))}

      </div>
    </div>
  );
};

export default EmptyState;