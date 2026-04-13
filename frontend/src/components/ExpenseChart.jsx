import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

function ExpenseChart({ transactions }) {
  const expensesByCategory = transactions.reduce((totals, transaction) => {
    if (transaction.amount >= 0) {
      return totals;
    }

    const category = transaction.category || "Others";
    totals[category] = (totals[category] || 0) + Math.abs(transaction.amount);
    return totals;
  }, {});

  const labels = Object.keys(expensesByCategory);
  const values = Object.values(expensesByCategory);

  if (labels.length === 0) {
    return null;
  }

  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: [
          "#1976d2",
          "#2e7d32",
          "#ed6c02",
          "#c62828",
          "#6a1b9a",
          "#00838f",
        ],
      },
    ],
  };

  return (
    <div className="expense-chart">
      <h2>Category-wise Expenses</h2>
      <Pie data={data} />
    </div>
  );
}

export default ExpenseChart;
