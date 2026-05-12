import React, { useState } from "react";
import Chat from "./components/Chat";
import InputBox from "./components/InputBox";
import "./index.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (message) => {
    if (!message.trim()) return;

    const userMessage = { role: "user", content: message };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message,
          history: messages,
        }),
      });

      if (!response.ok) throw new Error("API request failed");

      const data = await response.json();
      const botMessage = { role: "assistant", content: data.reply };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <Chat messages={messages} isLoading={isLoading} />
      <InputBox onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
}

export default App;