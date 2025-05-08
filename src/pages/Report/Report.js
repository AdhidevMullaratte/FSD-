import React from "react";
import { Link } from "react-router-dom";
import "./Report.css";

const Report = () => {
  return (
    <div className="report-container">
      {/* Top Left Our Services Button */}
      <Link to="/services" className="services-button">Our Services</Link>

      <h1 className="report-title">REPORT</h1>

      <div className="report-content">
        {/* Left Panel - Profile Details */}
        <div className="left-panel">
          <div className="profile-pic"></div>
          <div className="details">
            <div className="detail-box">NAME</div>
            <div className="detail-box">AGE</div>
            <div className="detail-box">GENDER</div>
            <div className="detail-box">CONTACT DETAILS</div>
          </div>
        </div>

        {/* Main Report Area */}
        <div className="main-report">
          <div className="report-section"></div>
          <div className="report-image-section"></div>
        </div>
      </div>

      {/* Print Button */}
      <button className="print-button">PRINT REPORT</button>
    </div>
  );
};

export default Report;
