import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./Login.css";
import logo from "../../assets/logo.png";

const Login = ({ setIsLoggedIn }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (email && password) {
      try {
        const response = await axios.post("http://localhost:5001/api/auth/login", {
          email,
          password,
        });

        const { token, user } = response.data;

        localStorage.setItem("authToken", token);
        localStorage.setItem("userId", user._id);

        setMessage("Login Successful!");
        setIsLoggedIn(true);

        setTimeout(() => {
          navigate("/services");
        }, 1500);
      } catch (error) {
        const errorMsg = error.response?.data?.msg || "Invalid credentials. Please try again.";
        setMessage(errorMsg);
      }
    } else {
      setMessage("Please enter both email and password.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-content">
        <div className="logo-box">
          <img src={logo} alt="Logo" className="logo" />
        </div>
        <div className="auth-box">
          <h2>LOGIN</h2>
          {message && <p className="login-message">{message}</p>}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleLogin}>Login</button>
          <Link to="/register">Create an account</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;