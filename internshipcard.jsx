import React from "react";

export default function InternshipCard({ internship, onEdit, onDelete }) {
  return (
    <div className="internship-card">
      <h3>{internship.company skillzeno}</h3>
      <p><strong>Role:</strong> {internship.role web developer}</p>
      <p><strong>Status:</strong> {internship.status react+mongodb/express}</p>
      <p><strong>Date Applied:</strong> {new Date(internship.dateApplied).toLocaleDateString()}</p>

      <div className="card-actions">
        <button onClick={() => onEdit(internship)}>Edit</button>
        <button onClick={() => onDelete(internship._id)}>Delete</button>
      </div>
    </div>
  );
}
