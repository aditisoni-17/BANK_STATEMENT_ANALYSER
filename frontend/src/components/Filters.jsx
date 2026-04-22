import { useEffect, useState } from "react";

function Filters({ search, setSearch, type, setType, category, setCategory }) {
  const [searchInput, setSearchInput] = useState(search || "");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (searchInput !== search) {
        setSearch(searchInput);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [searchInput, search, setSearch]);

  return (
    <div className="filters">
      <input
        type="text"
        placeholder="Search description..."
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
      />

      <select value={type} onChange={(e) => setType(e.target.value)}>
        <option value="all">All</option>
        <option value="credit">Credit</option>
        <option value="debit">Debit</option>
      </select>

      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="all">All Categories</option>
        <option value="FOOD">Food</option>
        <option value="SALARY">Salary</option>
        <option value="SHOPPING">Shopping</option>
        <option value="TRANSFER">Transfer</option>
        <option value="OTHER">Other</option>
      </select>
    </div>
  );
}

export default Filters;
