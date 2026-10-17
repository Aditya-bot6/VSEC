
import React, { useState } from "react";

function StudentForm({ onSubmit }) {
  const [student, setStudent] = useState({
    name: "",
    rollNo: "",
    department: "",
    marks: ""
  });

  const handleChange = (e) => {
    setStudent({
      ...student,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(student);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Student Form</h2>

      <input
        type="text"
        name="name"
        placeholder="Student Name"
        value={student.name}
        onChange={handleChange}
        required
      />

      <input
        type="text"
        name="rollNo"
        placeholder="Roll Number"
        value={student.rollNo}
        onChange={handleChange}
        required
      />

      <input
        type="text"
        name="department"
        placeholder="Department"
        value={student.department}
        onChange={handleChange}
        required
      />

      <input
        type="number"
        name="marks"
        placeholder="Marks (0-100)"
        min="0"
        max="100"
        value={student.marks}
        onChange={handleChange}
        required
      />

      <button type="submit">Submit Details</button>
    </form>
  );
}

export default StudentForm;
