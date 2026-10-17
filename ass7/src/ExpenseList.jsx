
function ExpenseList({ expenses, onDeleteExpense }) {
  return (
    <div className="expense-list">
      <h2>Expense History</h2>

      {expenses.length === 0 ? (
        <p className="empty">No expenses recorded yet.</p>
      ) : (
        expenses.map((expense) => (
          <div className="expense-item" key={expense.id}>
            <div className="expense-info">
              <h3>{expense.title}</h3>
              <p>{expense.category} | {expense.date}</p>
            </div>

            <div className="expense-actions">
              <strong>
                ₹{Number(expense.amount).toLocaleString("en-IN")}
              </strong>

              <button
                type="button"
                className="delete-btn"
                onClick={() => onDeleteExpense(expense.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default ExpenseList;
