import React from "react";
import { Link } from "react-router-dom";

export default function Navbar({ onLogout }) {
  return (
    <nav className="navbar">
      <h1>Internship Tracker</h1>
      <ul>
        <li><Link to="/dashboard">Dashboard</Link></li>
        <li><Link to="/add">Add Internship</Link></li>
        <li><Link to="/profile">Profile</Link></li>
        <li>
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </li>
      </ul>
    </nav>
  );
}
