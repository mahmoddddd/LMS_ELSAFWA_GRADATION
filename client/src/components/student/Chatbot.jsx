import React, { useState } from "react";
import { Button, IconButton, TextField, Box } from "@mui/material";
import { Clear as ClearIcon, Chat as ChatIcon, Send as SendIcon } from "@mui/icons-material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import axios from "axios";

// Define theme for the chatbot UI
const theme = createTheme({
  palette: {
    primary: { main: "#007BFF" },
    background: { default: "#f4f4f4" },
  },
});

// Backend API Base URL
const BACKEND_API_URL = "https://api.openai.com/v1/chat/completions";

const Chatbot = () => {
  const [userInput, setUserInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setUserInput(e.target.value);
  };

  const BACKEND_API_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_API_KEY = "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"; // Replace with your actual OpenAI API key

const handleSend = async () => {
  if (!userInput.trim()) return;

  setChatHistory((prevHistory) => [...prevHistory, { sender: "user", message: userInput }]);
  setLoading(true);

  try {
    const response = await axios.post(
      BACKEND_API_URL,
      {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: userInput }],
        max_tokens: 150,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    setChatHistory((prevHistory) => [
      ...prevHistory,
      { sender: "bot", message: response.data.choices[0].message.content },
    ]);
  } catch (error) {
    console.error("Error sending message:", error);

    if (error.response && error.response.data && error.response.data.error.code === "insufficient_quota") {
      setChatHistory((prevHistory) => [
        ...prevHistory,
        { sender: "bot", message: "⚠️ Quota exceeded. Please check your OpenAI account." },
      ]);
    } else {
      setChatHistory((prevHistory) => [
        ...prevHistory,
        { sender: "bot", message: "❌ Error: Unable to get a response." },
      ]);
    }
  }

  setUserInput("");
  setLoading(false);
};



  const handleClear = () => setChatHistory([]);

  const toggleChat = () => setChatOpen((prev) => !prev);

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          width: chatOpen ? "320px" : "60px",
          height: chatOpen ? "420px" : "60px",
          borderRadius: "8px",
          transition: "all 0.3s ease",
          boxShadow: 3,
          backgroundColor: "#ffffff",
          padding: chatOpen ? "10px" : "0",
        }}
      >
        {chatOpen ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>🤖 Chatbot</strong>
              <IconButton onClick={toggleChat} color="primary"><ClearIcon /></IconButton>
            </div>

            <div style={{ height: "75%", overflowY: "auto", border: "1px solid #ddd", padding: "5px", borderRadius: "5px" }}>
              {chatHistory.map((chat, index) => (
                <div key={index} style={{
                  textAlign: chat.sender === "user" ? "right" : "left",
                  padding: "5px",
                  borderRadius: "8px",
                  background: chat.sender === "user" ? "#007BFF" : "#f0f0f0",
                  color: chat.sender === "user" ? "#fff" : "#000",
                  marginBottom: "5px",
                  maxWidth: "75%",
                  marginLeft: chat.sender === "user" ? "auto" : "0",
                }}>
                  <p>{chat.message}</p>
                </div>
              ))}
              {loading && <p>⏳ Thinking...</p>}
            </div>

            <div style={{ display: "flex", marginTop: "10px" }}>
              <TextField fullWidth value={userInput} onChange={handleChange} placeholder="Ask me anything..." size="small" />
              <IconButton onClick={handleSend} color="primary"><SendIcon /></IconButton>
            </div>
          </>
        ) : (
          <IconButton onClick={toggleChat} color="primary"><ChatIcon /></IconButton>
        )}
      </Box>
    </ThemeProvider>
  );
};

export default Chatbot;
