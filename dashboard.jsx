import React, { useState, useEffect } from "react";
import InternshipForm from "../components/InternshipForm";
import InternshipCard from "../components/InternshipCard";

export default function Dashboard() {
  const [internships, setInternships] = useState([]);
  const [error, setError] = useState("");

  // Fetch internships from backend
  useEffect(() => {
    fetch("/api/internships", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => res.json())
      .then(data => setInternships(data))
      .catch(() => setError("Failed to load internships"));
  }, []);

  // Add internship
  const handleAdd = (newInternship) => {
    fetch("/api/internships", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify(newInternship)
    })
      .then(res => res.json())
      .then(data => setInternships([...internships, data]))
      .catch(() => setError("Failed to add internship"));
  };

  // Delete internship
  const handleDelete = (id) => {
    fetch(`/api/internships/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(() => setInternships(internships.filter(i => i._id !== id)))
      .catch(() => setError("Failed to delete internship"));
  };

  // Edit internship (simplified)
  const handleEdit = (updatedInternship) => {
    fetch(`/api/internships/${updatedInternship._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify(updatedInternship)
    })
      .then(res => res.json())
      .then(data => {
        setInternships(internships.map(i => i._id === data._id ? data : i));
      })
      .catch(() => setError("Failed to update internship"));
  };

  return (
    <div className="dashboard">
      <h2>Internship Tracker Dashboard</h2>
      {error && <p className="error">{error}</p>}

      <InternshipForm onSubmit={handleAdd} />

      <div className="internship-list">
        {internships.length === 0 ? (
          <p>No internships yet. Add your first one!</p>
        ) : (
          internships.map(internship => (
            <InternshipCard
              key={internship._id}
              internship={internship}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
