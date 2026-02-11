function Filters({ search, setSearch, type, setType, category, setCategory }) {
  return (
    <div className="filters">
      {/* Search */}
      <input
        type="text"
        placeholder="Search description..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Credit / Debit */}
      <select value={type} onChange={(e) => setType(e.target.value)}>
        <option value="all">All</option>
        <option value="credit">Credit</option>
        <option value="debit">Debit</option>
      </select>

      {/* Category filter */}
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
