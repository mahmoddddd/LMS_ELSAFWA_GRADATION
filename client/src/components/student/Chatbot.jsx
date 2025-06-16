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

const Chatbot = () => {
  const [userInput, setUserInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Backend API URL - you can change this to your server URL
  const BACKEND_URL = "https://lms-backend-omega-two.vercel.app";

  const handleChange = (e) => {
    setUserInput(e.target.value);
  };

  const handleSend = async () => {
    if (!userInput.trim()) return;

    const userMessage = userInput.trim();
    setChatHistory((prevHistory) => [...prevHistory, { sender: "user", message: userMessage }]);
    setLoading(true);

    try {
      // Call our backend chatbot API
      const response = await axios.post(
        `${BACKEND_URL}/api/chatbot/chat`,
        {
          message: userMessage,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 15000, // 15 second timeout
        }
      );

      if (response.data && response.data.success) {
        setChatHistory((prevHistory) => [
          ...prevHistory,
          { sender: "bot", message: response.data.response },
        ]);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Fallback responses if API fails
      const fallbackResponses = [
        "I'm here to help you with your learning journey! What would you like to know?",
        "That's an interesting question. Let me help you find the answer.",
        "I'm your AI learning assistant. How can I support you today?",
        "Great question! Let me provide you with some helpful information.",
        "I'm here to make your learning experience better. What can I help you with?"
      ];
      
      const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      
      setChatHistory((prevHistory) => [
        ...prevHistory,
        { sender: "bot", message: randomResponse },
      ]);
    }

    setUserInput("");
    setLoading(false);
  };

  const handleClear = () => setChatHistory([]);

  const toggleChat = () => setChatOpen((prev) => !prev);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          width: chatOpen ? "350px" : "60px",
          height: chatOpen ? "450px" : "60px",
          borderRadius: "20px",
          transition: "all 0.3s ease",
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          backgroundColor: chatOpen ? "rgba(255, 255, 255, 0.95)" : "transparent",
          backdropFilter: chatOpen ? "blur(10px)" : "none",
          border: chatOpen ? "1px solid rgba(255, 255, 255, 0.2)" : "none",
          padding: chatOpen ? "16px" : "0",
          zIndex: 1000,
          overflow: "hidden",
        }}
      >
        {chatOpen ? (
          <>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              marginBottom: "12px",
              paddingBottom: "8px",
              borderBottom: "1px solid rgba(0, 123, 255, 0.1)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ 
                  width: "32px", 
                  height: "32px", 
                  borderRadius: "50%", 
                  background: "linear-gradient(135deg, #007BFF, #0056b3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "16px",
                  boxShadow: "0 2px 8px rgba(0, 123, 255, 0.3)"
                }}>
                  🤖
                </div>
                <strong style={{ color: "#333", fontSize: "14px" }}>AI Learning Assistant</strong>
              </div>
              <IconButton 
                onClick={toggleChat} 
                color="primary" 
                size="small"
                sx={{
                  color: "#007BFF",
                  "&:hover": {
                    backgroundColor: "rgba(0, 123, 255, 0.1)"
                  }
                }}
              >
                <ClearIcon />
              </IconButton>
            </div>

            <div style={{ 
              height: "300px", 
              overflowY: "auto", 
              padding: "8px", 
              borderRadius: "12px",
              backgroundColor: "rgba(248, 249, 250, 0.5)",
              marginBottom: "12px",
              border: "1px solid rgba(0, 123, 255, 0.1)"
            }}>
              {chatHistory.length === 0 && (
                <div style={{ 
                  textAlign: "center", 
                  color: "#666", 
                  fontSize: "13px",
                  marginTop: "20px",
                  padding: "20px",
                  backgroundColor: "rgba(255, 255, 255, 0.7)",
                  borderRadius: "12px",
                  border: "1px dashed rgba(0, 123, 255, 0.2)"
                }}>
                  👋 Hi! I'm your AI learning assistant. Ask me anything about your courses!
                </div>
              )}
              {chatHistory.map((chat, index) => (
                <div key={index} style={{
                  textAlign: chat.sender === "user" ? "right" : "left",
                  padding: "10px 14px",
                  borderRadius: "18px",
                  background: chat.sender === "user" 
                    ? "linear-gradient(135deg, #007BFF, #0056b3)" 
                    : "rgba(255, 255, 255, 0.9)",
                  color: chat.sender === "user" ? "#fff" : "#333",
                  marginBottom: "8px",
                  maxWidth: "85%",
                  marginLeft: chat.sender === "user" ? "auto" : "0",
                  boxShadow: chat.sender === "user" 
                    ? "0 2px 8px rgba(0, 123, 255, 0.3)" 
                    : "0 2px 8px rgba(0, 0, 0, 0.1)",
                  fontSize: "13px",
                  lineHeight: "1.4",
                  border: chat.sender === "user" 
                    ? "none" 
                    : "1px solid rgba(0, 123, 255, 0.1)"
                }}>
                  {chat.message}
                </div>
              ))}
              {loading && (
                <div style={{
                  textAlign: "left",
                  padding: "10px 14px",
                  borderRadius: "18px",
                  background: "rgba(255, 255, 255, 0.9)",
                  color: "#666",
                  marginBottom: "8px",
                  maxWidth: "85%",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                  fontSize: "13px",
                  border: "1px solid rgba(0, 123, 255, 0.1)"
                }}>
                  ⏳ Thinking...
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <TextField 
                fullWidth 
                value={userInput} 
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your courses..." 
                size="small"
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "20px",
                    fontSize: "13px",
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    "& fieldset": {
                      borderColor: "rgba(0, 123, 255, 0.2)"
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(0, 123, 255, 0.4)"
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#007BFF"
                    }
                  }
                }}
              />
              <IconButton 
                onClick={handleSend} 
                color="primary"
                disabled={!userInput.trim() || loading}
                sx={{
                  backgroundColor: userInput.trim() 
                    ? "linear-gradient(135deg, #007BFF, #0056b3)" 
                    : "rgba(0, 123, 255, 0.3)",
                  color: "white",
                  borderRadius: "50%",
                  width: "40px",
                  height: "40px",
                  "&:hover": {
                    backgroundColor: userInput.trim() 
                      ? "linear-gradient(135deg, #0056b3, #004085)" 
                      : "rgba(0, 123, 255, 0.3)"
                  },
                  "&:disabled": {
                    backgroundColor: "rgba(0, 123, 255, 0.3)"
                  }
                }}
              >
                <SendIcon fontSize="small" />
              </IconButton>
            </div>
            
            {chatHistory.length > 0 && (
              <div style={{ 
                textAlign: "center", 
                marginTop: "8px"
              }}>
                <Button 
                  onClick={handleClear} 
                  size="small" 
                  sx={{ 
                    fontSize: "11px", 
                    color: "#666",
                    textTransform: "none",
                    "&:hover": {
                      backgroundColor: "rgba(0, 123, 255, 0.1)"
                    }
                  }}
                >
                  Clear Chat
                </Button>
              </div>
            )}
          </>
        ) : (
          <IconButton 
            onClick={toggleChat} 
            color="primary"
            sx={{
              width: "100%",
              height: "100%",
              background: "linear-gradient(135deg, #007BFF, #0056b3)",
              color: "white",
              borderRadius: "20px",
              boxShadow: "0 4px 16px rgba(0, 123, 255, 0.4)",
              "&:hover": {
                background: "linear-gradient(135deg, #0056b3, #004085)",
                boxShadow: "0 6px 20px rgba(0, 123, 255, 0.5)"
              }
            }}
          >
            <ChatIcon />
          </IconButton>
        )}
      </Box>
    </ThemeProvider>
  );
};

export default Chatbot;
