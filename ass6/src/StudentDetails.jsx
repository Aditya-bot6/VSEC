
import React from "react";

function StudentDetails({ student }) {
  if (!student) {
    return <p>No student details submitted yet.</p>;
  }

  return (
    <div className="details">
      <h2>Student Details</h2>

      <p><strong>Name:</strong> {student.name}</p>
      <p><strong>Roll Number:</strong> {student.rollNo}</p>
      <p><strong>Department:</strong> {student.department}</p>
      <p><strong>Marks:</strong> {student.marks}/100</p>
    </div>
  );
}

export default StudentDetails;
