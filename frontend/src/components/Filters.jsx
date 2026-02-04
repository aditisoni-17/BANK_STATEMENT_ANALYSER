function Filters({ search, setSearch, type, setType }) {
  return (
    <div className="filters">
      <input
        type="text"
        placeholder="Search description..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <select value={type} onChange={(e) => setType(e.target.value)}>
        <option value="all">All</option>
        <option value="credit">Credit</option>
        <option value="debit">Debit</option>
      </select>
    </div>
  );
}

export default Filters;
