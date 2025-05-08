import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Services from "./pages/Services/Services";
import Tracking from "./pages/Tracking/Tracking";
import Chatbot from "./pages/Chatbot/Chatbot";
import Consultation from "./pages/Consultation/Consultation";
import Report from "./pages/Report/Report"; // ✅ Importing Report Page
import { useState } from "react"; // Import useState to manage logged-in state
import React from 'react';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Manage logged-in status

  return (
    <Router>
      <Routes>
        {/* ✅ Redirect "/" to "/Login" for cleaner navigation */}
        <Route path="/" element={<Navigate to="/Login" />} />
        
        {/* Login Route */}
        <Route 
          path="/Login" 
          element={<Login setIsLoggedIn={setIsLoggedIn} />} // Pass setter to Login to handle login */}
        />

        <Route path="/register" element={<Register />} />

        {/* Protect routes from unauthorized access */}
        <Route
          path="/services"
          element={isLoggedIn ? <Services /> : <Navigate to="/Login" />}
        />
        <Route
          path="/tracking"
          element={isLoggedIn ? <Tracking /> : <Navigate to="/Login" />}
        />
        <Route
          path="/chatbot"
          element={isLoggedIn ? <Chatbot /> : <Navigate to="/Login" />}
        />
        <Route
          path="/consultation"
          element={isLoggedIn ? <Consultation /> : <Navigate to="/Login" />}
        />
        <Route
          path="/report"
          element={isLoggedIn ? <Report /> : <Navigate to="/Login" />}
        />
      </Routes>
    </Router>
  );
}

export default App;
