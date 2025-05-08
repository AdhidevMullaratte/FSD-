import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Tracking.css";

const Tracking = () => {
  const [beforeFile, setBeforeFile] = useState(null);
  const [afterFile, setAfterFile] = useState(null);
  const [beforePreview, setBeforePreview] = useState(null);
  const [afterPreview, setAfterPreview] = useState(null);
  const [weeks, setWeeks] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleBeforeImageUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setBeforeFile(file);
      setBeforePreview(URL.createObjectURL(file));
      setError(null);
    } else {
      setError("Please upload a valid image file for the before picture.");
    }
  };

  const handleAfterImageUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setAfterFile(file);
      setAfterPreview(URL.createObjectURL(file));
      setError(null);
    } else {
      setError("Please upload a valid image file for the after picture.");
    }
  };

  const handleEnterClick = async () => {
    if (!beforeFile || !afterFile || !weeks || !name || !age || !gender) {
      alert("Please fill all fields and upload both images.");
      return;
    }

    const formData = new FormData();
    formData.append("beforeImage", beforeFile);
    formData.append("afterImage", afterFile);
    formData.append("weeks", weeks);
    formData.append("name", name);
    formData.append("age", age);
    formData.append("gender", gender);

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:5001/api/tracking", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${name}_vitiligo_report.docx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        const errData = await response.json();
        setError("Tracking failed: " + errData.error || "Unknown error occurred.");
      }
    } catch (err) {
      console.error("Upload Error:", err);
      setError("Something went wrong while uploading data.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="tracking-container">
      <h1 className="tracker-title">TRACKER</h1>
      <Link to="/services" className="services-button">
        Our Services
      </Link>
      <p className="tracking-description">
        Upload your before and after images to track vitiligo progress. Enter the number of weeks between the two images and fill out the form to analyze the treatment effectiveness.
      </p>

      <div className="tracking-box">
        <div className="form-section">
          <div className="form-group">
            <label>Name:</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="form-group">
            <label>Age:</label>
            <input type="number" value={age} onChange={(e) => setAge(e.target.value)} />
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
              {beforePreview ? <img src={beforePreview} alt="Before" className="preview-img" /> : "UPLOAD"}
            </label>
          </div>

          <div className="upload-box">
            <h3>AFTER PICTURE</h3>
            <label className="upload-label">
              <input type="file" accept="image/*" onChange={handleAfterImageUpload} />
              {afterPreview ? <img src={afterPreview} alt="After" className="preview-img" /> : "UPLOAD"}
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

        {error && <p className="error-message">{error}</p>}

        <div className="enter-button-wrapper">
          <button className="enter-button" onClick={handleEnterClick} disabled={isLoading}>
            {isLoading ? "Processing..." : "ENTER"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Tracking;
