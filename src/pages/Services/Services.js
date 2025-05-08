import React from "react";
import { useNavigate } from "react-router-dom"; // ✅ Import useNavigate
import "./Services.css";
import trackingImg from "../../assets/tracking.webp";
import chatbotImg from "../../assets/chatbot.webp";
import consultationImg from "../../assets/consultation.webp";

const Services = () => {
  const navigate = useNavigate(); // ✅ Initialize navigation

  // Handle Logout
  const handleLogout = () => {
    alert("Logged out successfully!"); // Optional Alert
    navigate("/Login"); // ✅ Navigate to Login page
  };

  // ✅ Handle Consultation Navigation
  const handleConsultation = () => {
    navigate("/consultation"); // ✅ Navigate to Consultation page
  };

  return (
    <div className="services-container">
      {/* ✅ Logout Button */}
      <button className="logout-button" onClick={handleLogout}>Logout</button>

      <div className="services-box">
        <h2>Our Services</h2>
        <p className="services-description">
          We offer an interactive chatbot to track vitiligo treatment progress and calculate key recovery metrics. 
          Get personalized medication recommendations based on data-driven insights. 
          Monitor your treatment journey seamlessly and effectively.
        </p>
        <div className="service-options">
          <button className="service-button" onClick={() => navigate("/tracking")}>
            <img src={trackingImg} alt="Tracking" className="service-img" />
            <span>Tracking</span>
          </button>
          <button className="service-button" onClick={() => navigate("/chatbot")}>
            <img src={chatbotImg} alt="Chatbot" className="service-img" />
            <span>AI Chatbot</span>
          </button>
          <button className="service-button" onClick={handleConsultation}>
            <img src={consultationImg} alt="Consultation" className="service-img" />
            <span>Consultation</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Services;
