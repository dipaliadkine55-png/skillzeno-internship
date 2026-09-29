import { useState } from "react";

export default function InternshipForm({ onSubmit }) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("Applied");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ company, role, status, dateApplied: new Date() });
    setCompany(""); setRole(""); setStatus("Applied");
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Company" required />
      <input value={role} onChange={e => setRole(e.target.value)} placeholder="Role" required />
      <select value={status} onChange={e => setStatus(e.target.value)}>
        <option>Applied</option>
        <option>Interview</option>
        <option>Offer</option>
        <option>Rejected</option>
      </select>
      <button type="submit">Add Internship</button>
    </form>
  );
}
