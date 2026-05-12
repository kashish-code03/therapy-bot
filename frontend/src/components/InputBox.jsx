import React, { useState, useRef } from "react";

function InputBox({ onSendMessage }) {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState([]);

  const fileInputRef = useRef(null);

  const handleSend = () => {
    if (!message.trim() && files.length === 0) return;

    onSendMessage(message, files);

    setMessage("");
    setFiles([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    if (selectedFiles.length > 0) {
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  return (
    <div className="input-container">

      {files.length > 0 && (
        <div className="selected-files">
          {files.map((file, index) => (
            <div key={index} className="file-pill">
              📎 {file.name}
            </div>
          ))}
        </div>
      )}

      <div className="modern-input-box">

        <button
          className="icon-btn"
          onClick={openFilePicker}
        >
          +
        </button>

        <input
          type="file"
          multiple
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        <textarea
          className="modern-textarea"
          placeholder="Message Nova..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />

        <button
          className="send-button"
          onClick={handleSend}
        >
          ➤
        </button>
      </div>

      <div className="input-footer-text">
        Press Enter to send • Shift + Enter for new line
      </div>
    </div>
  );
}

export default InputBox;