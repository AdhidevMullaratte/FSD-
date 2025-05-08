import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./Consultation.css";
import { FaArrowRight, FaArrowLeft } from "react-icons/fa";
import doctorImage from "../../assets/doctor.webp";
import axios from "axios";

const doctors = [
  { id: 1, name: "Dr. Smith", contact: "123-456-7890", email: "doc1@email.com" },
  { id: 2, name: "Dr. Johnson", contact: "987-654-3210", email: "doc2@email.com" },
  { id: 3, name: "Dr. Williams", contact: "555-555-5555", email: "doc3@email.com" },
];

const timeSlots = [
  "5:00 PM", "5:20 PM", "5:40 PM", "6:00 PM", "6:20 PM", 
  "6:40 PM", "7:00 PM", "7:20 PM", "7:40 PM", "8:00 PM"
];

const Consultation = () => {
  const navigate = useNavigate();
  const [selectedDoctor, setSelectedDoctor] = useState(0);
  const [showBooking, setShowBooking] = useState(false);
  const [date, setDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState("");
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("authToken");

  useEffect(() => {
    if (!userId || !token) {
      navigate("/login");
      return;
    }
  }, [userId, navigate, token]);

  useEffect(() => {
    if (showBooking) {
      const fetchBookedSlots = async () => {
        try {
          setLoading(true);
          const response = await axios.get(
            `http://localhost:5001/api/appointments?doctor=${doctors[selectedDoctor].name}&date=${date.toDateString()}`,
            { headers: { 'x-auth-token': token } }
          );
          setBookedSlots(response.data.map(app => app.time));
        } catch (error) {
          console.error("Error fetching appointments:", error);
          alert("Failed to load available time slots");
        } finally {
          setLoading(false);
        }
      };
      fetchBookedSlots();
    }
  }, [showBooking, selectedDoctor, date, token]);

  const availableSlots = timeSlots.filter(slot => !bookedSlots.includes(slot));

  const handleBooking = async () => {
    if (!selectedTime) return;
    
    try {
      setLoading(true);
      const response = await axios.post(
        "http://localhost:5001/api/appointments",
        {
          doctorName: doctors[selectedDoctor].name,
          date: date.toDateString(),
          time: selectedTime,
          userId: userId
        },
        { headers: { 'x-auth-token': token } }
      );
      
      if (response.status === 201) {
        alert("Appointment booked successfully!");
        setBookedSlots([...bookedSlots, selectedTime]);
        setShowBooking(false);
        setSelectedTime("");
      }
    } catch (error) {
      console.error("Booking error:", error);
      alert(error.response?.data?.error || "Failed to book appointment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="consultation-container">
      <div className="header-buttons">
        <button className="top-button logout" onClick={() => navigate("/login")}>Logout</button>
        <button className="top-button services" onClick={() => navigate("/services")}>Our Services</button>
      </div>

      <h2>Our Dermatologists</h2>
      <p className="consultation-description">
        Our dermatologists provide expert care for vitiligo and other skin concerns.
        Book a consultation with a specialist today!
      </p>

      <div className="doctor-box">
        <button 
          className="arrow-btn" 
          onClick={() => setSelectedDoctor((prev) => (prev - 1 + doctors.length) % doctors.length)}
          disabled={loading}
        >
          <FaArrowLeft />
        </button>
        
        <div className="doctor-card slide-in">
          <div className="doctor-img-box">
            <img src={doctorImage} alt="Doctor" className="doctor-img" />
          </div>
          <div className="inner-box">
            <h3>{doctors[selectedDoctor].name}</h3>
            <p>Contact: {doctors[selectedDoctor].contact}</p>
            <p>Email: {doctors[selectedDoctor].email}</p>
            <button 
              className="appointment-btn" 
              onClick={() => setShowBooking(true)}
              disabled={loading}
            >
              {loading ? "Loading..." : "Get Appointment"}
            </button>
          </div>
        </div>
        
        <button 
          className="arrow-btn" 
          onClick={() => setSelectedDoctor((prev) => (prev + 1) % doctors.length)}
          disabled={loading}
        >
          <FaArrowRight />
        </button>
      </div>

      {showBooking && (
        <div className="booking-modal">
          <h3>Select Date</h3>
          <Calendar
            onChange={setDate}
            value={date}
            minDate={new Date()}
            maxDate={new Date(new Date().setMonth(new Date().getMonth() + 2))}
            disabled={loading}
          />

          <h3>Select Time Slot</h3>
          {loading ? (
            <div className="loading-slots">Loading available time slots...</div>
          ) : (
            <div className="time-slots">
              {availableSlots.map((time, index) => (
                <button
                  key={index}
                  className={`time-slot-btn ${selectedTime === time ? "selected" : ""}`}
                  onClick={() => setSelectedTime(time)}
                  disabled={loading}
                >
                  {time}
                </button>
              ))}
            </div>
          )}

          <button 
            className="book-appointment-btn" 
            onClick={handleBooking}
            disabled={!selectedTime || loading}
          >
            {loading ? "Processing..." : "Book Appointment"}
          </button>
          <button 
            className="close-btn" 
            onClick={() => setShowBooking(false)}
            disabled={loading}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default Consultation;