import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Chatbot.css";

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [started, setStarted] = useState(false);
  const navigate = useNavigate();

  const sendMessage = async () => {
    if (!started) {
      const greetingMessages = [
        { text: "Hello! 👋 Welcome to VITIBOT!", sender: "bot" },
        {
          text: "I'm here to assist you with vitiligo-related questions and treatment tracking.",
          sender: "bot",
        },
        {
          text: "Feel free to ask anything related to vitiligo. 😊",
          sender: "bot",
        },
      ];
      setMessages(greetingMessages);
      setStarted(true);
      return;
    }

    if (!input.trim()) return;

    const userMessage = { text: input, sender: "user" };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    try {
      console.log("Sending prompt:", input);
      const response = await fetch("/api/chatbot/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3:8b", // ✅ updated model name
          prompt: `You are a chatbot specialized in vitiligo. Only answer vitiligo-related questions. User: ${input}`,
          stream: false,
        }),
      });

      const data = await response.json();
      console.log("Response:", data);

      const botMessage = {
        text: data.response?.trim() || "I'm sorry, I didn't understand that or received no response from the AI.",
        sender: "bot",
      };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: `Error: ${error.message}`, sender: "bot" },
      ]);
    }

    setInput("");
  };

  return (
    <div className="chatbot-container">
      <button className="our-services-btn" onClick={() => navigate("/services")}>
        OUR SERVICES
      </button>
      <div className="chatbox">
        <h2 className="chatbot-title">VITIBOT</h2>
        <div className="message-container">
          {messages.map((msg, index) => (
            <div key={index} className={msg.sender}>
              {msg.text}
            </div>
          ))}
        </div>
        <input
          type="text"
          placeholder="Type here..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
        />
        <button className="send-btn" onClick={sendMessage}>
          {started ? "SEND" : "GET STARTED"}
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
