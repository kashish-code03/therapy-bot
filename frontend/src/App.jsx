import React, { useState, useRef, useEffect, useMemo } from "react";
import Chat from "./components/Chat";
import InputBox from "./components/InputBox";
import "./index.css";

const STORAGE_KEY = "nova-ai-memory-v2";

const AI_NAME = "Nova";

const WELCOME_MESSAGE = {
  id: crypto.randomUUID(),
  role: "assistant",
  content:
    "Hey, I’m Nova ✨ Your AI companion. I’m here whenever you want to talk.",
  timestamp: new Date().toISOString(),
};

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const createNewChat = (title = "New Chat") => ({
  id: uid(),
  sessionId: uid(),
  title,
  createdAt: new Date().toISOString(),
  messages: [WELCOME_MESSAGE],
});

function loadInitialState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);

      if (parsed?.chats?.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Memory load failed:", err);
  }

  const firstChat = createNewChat("General Chat");

  return {
    chats: [firstChat],
    activeChatId: firstChat.id,
  };
}

function cleanHistory(messages = []) {
  return messages
    .filter((msg) => msg.status !== "pending")
    .map(({ id, requestId, status, timestamp, ...rest }) => rest);
}

function App() {
  const [chatState, setChatState] = useState(loadInitialState);
  const messagesEndRef = useRef(null);

  const { chats, activeChatId } = chatState;

  const activeChat = useMemo(
    () => chats.find((chat) => chat.id === activeChatId) || chats[0],
    [chats, activeChatId]
  );

  const activeChatIsThinking = useMemo(() => {
    return activeChat?.messages?.some(
      (msg) => msg.status === "pending"
    );
  }, [activeChat]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chatState));
  }, [chatState]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [activeChat?.messages]);

  const updateChatById = (chatId, updater) => {
    setChatState((prev) => ({
      ...prev,
      chats: prev.chats.map((chat) =>
        chat.id === chatId ? updater(chat) : chat
      ),
    }));
  };

  const handleNewChat = () => {
    const newChat = createNewChat(`Chat ${chats.length + 1}`);

    setChatState((prev) => ({
      ...prev,
      chats: [newChat, ...prev.chats],
      activeChatId: newChat.id,
    }));
  };

  const serializeFiles = async (files = []) => {
    return Promise.all(
      files.map(
        (file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => {
              resolve({
                name: file.name,
                type: file.type,
                size: file.size,
                dataUrl: reader.result,
              });
            };

            reader.onerror = () => {
              reject(new Error(`Failed to read ${file.name}`));
            };

            reader.readAsDataURL(file);
          })
      )
    );
  };

  const handleSendMessage = async (message, files = []) => {
    const trimmed = message.trim();

    if (!trimmed && files.length === 0) return;
    if (!activeChat) return;

    const currentChatId = activeChat.id;
    const currentSessionId = activeChat.sessionId;

    const requestId = uid();

    const fileMeta = files.map((file) => ({
      name: file.name,
      type: file.type,
      size: file.size,
    }));

    const userMessageContent =
      trimmed ||
      `Shared ${files.length} file${files.length > 1 ? "s" : ""}`;

    const userMessage = {
      id: uid(),
      role: "user",
      content: userMessageContent,
      timestamp: new Date().toISOString(),
      attachments: fileMeta,
    };

    const assistantPlaceholder = {
      id: requestId,
      requestId,
      role: "assistant",
      content: "Nova is thinking...",
      status: "pending",
      timestamp: new Date().toISOString(),
    };

    const historySnapshot = [
      ...cleanHistory(activeChat.messages),
      {
        role: "user",
        content: userMessageContent,
      },
    ];

    updateChatById(currentChatId, (chat) => ({
      ...chat,
      messages: [...chat.messages, userMessage, assistantPlaceholder],
    }));

    try {
      const uploadedFiles =
        files.length > 0
          ? await serializeFiles(files)
          : [];

      const response = await fetch(
        "http://localhost:5000/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: userMessageContent,
            history: historySnapshot,
            session_id: currentSessionId,
            files: uploadedFiles,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status}`
        );
      }

      const data = await response.json();

      const botReply =
        data.reply ||
        "I’m here with you. Tell me more.";

      updateChatById(currentChatId, (chat) => ({
        ...chat,
        messages: chat.messages.map((msg) =>
          msg.requestId === requestId
            ? {
                id: uid(),
                role: "assistant",
                content: botReply,
                timestamp: new Date().toISOString(),
              }
            : msg
        ),
      }));
    } catch (error) {
      console.error(error);

      updateChatById(currentChatId, (chat) => ({
        ...chat,
        messages: chat.messages.map((msg) =>
          msg.requestId === requestId
            ? {
                id: uid(),
                role: "assistant",
                content:
                  "Something went wrong. Please try again.",
                timestamp: new Date().toISOString(),
              }
            : msg
        ),
      }));
    }
  };

  return (
    <div className="app-layout">
      <div className="sidebar">
        <div className="logo">
          {AI_NAME}
        </div>

        <button
          className="new-chat-btn"
          onClick={handleNewChat}
        >
          + New Chat
        </button>

        <div className="chat-history">
          <p className="history-title">
            Conversations
          </p>

          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`chat-item ${
                chat.id === activeChatId
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setChatState((prev) => ({
                  ...prev,
                  activeChatId: chat.id,
                }))
              }
            >
              <input
                value={chat.title}
                className="chat-title-input"
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  const value = e.target.value;

                  setChatState((prev) => ({
                    ...prev,
                    chats: prev.chats.map((c) =>
                      c.id === chat.id
                        ? {
                            ...c,
                            title: value,
                          }
                        : c
                    ),
                  }));
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="main-chat">
        <div className="chat-header">
          <div>
            <h2>{activeChat?.title}</h2>
            <p className="ai-subtitle">
              Emotional AI Companion
            </p>
          </div>

          <span className="status">
            ● {AI_NAME} Online
          </span>
        </div>

        <Chat
          messages={activeChat?.messages || []}
          isLoading={activeChatIsThinking}
          aiName={AI_NAME}
        />

        <InputBox
          onSendMessage={handleSendMessage}
          isLoading={activeChatIsThinking}
        />

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

export default App;