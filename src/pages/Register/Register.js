import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // ✅ Import Axios for API requests
import "./Register.css";
import logo from "../../assets/logo.png";

const Register = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        gender: "",
        age: "",
        dob: ""
    });

    // Handle input change
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post("http://localhost:5001/api/auth/register", formData);
            alert(response.data.msg || "Registered Successfully!");
            navigate("/Login"); // Navigate to login on success
        } catch (error) {
            console.error("Registration Error:", error.response?.data || error.message);
            alert(error.response?.data?.msg || "Registration failed. Try again.");
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-wrapper">
                <div className="logo-box">
                    <img src={logo} alt="Logo" className="logo" />
                </div>

                <div className="auth-box">
                    <h2>Register</h2>
                    <form onSubmit={handleSubmit}>
                        <input
                            type="text"
                            name="name"
                            placeholder="Full Name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />

                        <div className="gender-container">
                            <label>Gender:</label>
                            <input
                                type="radio"
                                name="gender"
                                value="Male"
                                onChange={handleChange}
                                required
                            />
                            <span>Male</span>
                            <input
                                type="radio"
                                name="gender"
                                value="Female"
                                onChange={handleChange}
                                required
                            />
                            <span>Female</span>
                        </div>

                        <input
                            type="number"
                            name="age"
                            placeholder="Age"
                            value={formData.age}
                            onChange={handleChange}
                            required
                        />
                        <input
                            type="date"
                            name="dob"
                            value={formData.dob}
                            onChange={handleChange}
                            required
                        />

                        <button type="submit">Register</button>
                    </form>

                    <p>Already have an account?</p>
                    <button className="login-btn" onClick={() => navigate("/Login")}>Login</button>
                </div>
            </div>
        </div>
    );
};

export default Register;
