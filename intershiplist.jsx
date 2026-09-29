export default function InternshipList({ internships, onDelete }) {
  return (
    <ul>
      {internships.map(i => (
        <li key={i._id}>
          {i.company} - {i.role} ({i.status})
          <button onClick={() => onDelete(i._id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}
