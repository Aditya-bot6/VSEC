
import React, { useState } from "react";
import ExpenseForm from "./ExpenseForm";
import ExpenseList from "./ExpenseList";
import "./App.css";

function App() {
  const [expenses, setExpenses] = useState([]);

  const addExpense = (expense) => {
    setExpenses((prev) => [...prev, expense]);
  };

  const deleteExpense = (id) => {
    setExpenses((prev) =>
      prev.filter((expense) => expense.id !== id)
    );
  };

  const totalExpense = expenses.reduce(
    (total, expense) => total + expense.amount,
    0
  );

  const categoryTotals = expenses.reduce((totals, expense) => {
    totals[expense.category] =
      (totals[expense.category] || 0) + expense.amount;
    return totals;
  }, {});

  return (
    <div className="app-container">
      <header>
        <h1>Personal Expense Tracker</h1>
        <p>Record, manage and analyze your spending.</p>
      </header>

      <div className="summary-card">
        <p>Total Expenses</p>
        <h2>
          ₹{totalExpense.toLocaleString("en-IN", {
            minimumFractionDigits: 2
          })}
        </h2>
        <span>{expenses.length} transaction(s) recorded</span>
      </div>

      <ExpenseForm onAddExpense={addExpense} />

      <section className="analysis">
        <h2>Category-wise Analysis</h2>

        {Object.keys(categoryTotals).length === 0 ? (
          <p className="empty">Add expenses to see your analysis.</p>
        ) : (
          Object.entries(categoryTotals).map(([category, amount]) => (
            <div className="category-row" key={category}>
              <div className="category-label">
                <span>{category}</span>
                <strong>
                  ₹{amount.toLocaleString("en-IN", {
                    maximumFractionDigits: 2
                  })}
                </strong>
              </div>

              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${totalExpense > 0
                      ? (amount / totalExpense) * 100
                      : 0}%`
                  }}
                />
              </div>

              <small>
                {totalExpense > 0
                  ? ((amount / totalExpense) * 100).toFixed(1)
                  : "0.0"}% of total spending
              </small>
            </div>
          ))
        )}
      </section>

      <ExpenseList
        expenses={[...expenses].sort((a, b) =>
          b.date.localeCompare(a.date) || b.id - a.id
        )}
        onDeleteExpense={deleteExpense}
      />
    </div>
  );
}

export default App;
