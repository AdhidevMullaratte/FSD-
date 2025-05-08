import React, { useState } from "react"; // Import React here
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Services from "./pages/Services/Services";
import Tracking from "./pages/Tracking/Tracking";
import Chatbot from "./pages/Chatbot/Chatbot";
import Consultation from "./pages/Consultation/Consultation";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Manage logged-in status

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/Login" />} />

        <Route 
          path="/Login" 
          element={<Login setIsLoggedIn={setIsLoggedIn} />} 
        />
        <Route path="/register" element={<Register />} />
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
      </Routes>
    </Router>
  );
}

export default App;
