import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Tracking.css";

const Tracking = () => {
  const [beforeImage, setBeforeImage] = useState(null);
  const [afterImage, setAfterImage] = useState(null);
  const [weeks, setWeeks] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const navigate = useNavigate();

  const handleBeforeImageUpload = (event) => {
    setBeforeImage(URL.createObjectURL(event.target.files[0]));
  };

  const handleAfterImageUpload = (event) => {
    setAfterImage(URL.createObjectURL(event.target.files[0]));
  };

  const handleEnterClick = () => {
    if (!beforeImage || !afterImage || !weeks || !name || !age || !gender) {
      alert("Please fill all fields and upload both images.");
      return;
    }

    navigate("/report", {
      state: { beforeImage, afterImage, weeks, name, age, gender },
    });
  };

  return (
    <div className="tracking-container">
      <h1 className="tracker-title">TRACKER</h1>
      <Link to="/services" className="services-button">
        Our Services
      </Link>
      <p className="tracking-description">
        Upload your before and after images to track vitiligo progress. Enter the
        number of weeks between the two images and fill out the form to analyze the
        treatment effectiveness.
      </p>

      <div className="tracking-box">
        <div className="form-section">
          <div className="form-group">
            <label>Name:</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" />
          </div>

          <div className="form-group">
            <label>Age:</label>
            <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Enter your age" />
          </div>

          <div className="form-group">
            <label>Gender:</label>
            <select value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="upload-section">
          <div className="upload-box">
            <h3>BEFORE PICTURE</h3>
            <label className="upload-label">
              <input type="file" accept="image/*" onChange={handleBeforeImageUpload} />
              {beforeImage ? <img src={beforeImage} alt="Before" className="preview-img" /> : "UPLOAD"}
            </label>
          </div>

          <div className="upload-box">
            <h3>AFTER PICTURE</h3>
            <label className="upload-label">
              <input type="file" accept="image/*" onChange={handleAfterImageUpload} />
              {afterImage ? <img src={afterImage} alt="After" className="preview-img" /> : "UPLOAD"}
            </label>
          </div>
        </div>

        <div className="weeks-input">
          <label>NO OF WEEKS:</label>
          <input
            type="number"
            value={weeks}
            onChange={(e) => setWeeks(e.target.value)}
            placeholder="Enter weeks"
          />
        </div>

        <div className="enter-button-wrapper">
          <button className="enter-button" onClick={handleEnterClick}>
            ENTER
          </button>
        </div>
      </div>
    </div>
  );
};

export default Tracking;
