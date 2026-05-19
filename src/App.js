import { useState, useEffect } from "react";
import * as XLSX from "xlsx";

export default function App() {
  const [description, setDescription] = useState("");
  const [country, setCountry] = useState("");
  const [user, setUser] = useState("");
  const [entries, setEntries] = useState([]);
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  const totalEntries = entries.length;
  const errorEntries = entries.filter(e => e.flags !== "None").length;
  const errorRate =
    totalEntries > 0
      ? ((errorEntries / totalEntries) * 100).toFixed(1)
      : 0;

  // ✅ Alert system
  useEffect(() => {
    if (!alertsEnabled) return;
    if (errorRate > 20) {
      alert(`⚠ High Error Rate: ${errorRate}%`);
    }
  }, [entries]);

  // ✅ Entry logic
  const submitEntry = () => {
    if (!description || !country) {
      alert("Description and Country required");
      return;
    }

    let flags = "None";

    if (country.toLowerCase() === "china") {
      flags = "Review 301 duty";
    }

    const entry = {
      user,
      description,
      country,
      flags,
      timestamp: new Date().toLocaleString()
    };

    setEntries(prev => [entry, ...prev]);
    setDescription("");
    setCountry("");
  };

  // ✅ Excel export
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(entries);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Entries");

    XLSX.writeFile(wb, "brokerage_entries.xlsx");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Brokerage Command Center</h1>

      {/* KPI */}
      <div style={{ marginBottom: 20 }}>
        <div>Total Entries: {totalEntries}</div>
        <div>Errors: {errorEntries}</div>
        <div>Error Rate: {errorRate}%</div>
      </div>

      {/* Form */}
      <input
        placeholder="User"
        value={user}
        onChange={e => setUser(e.target.value)}
      /><br /><br />

      <input
        placeholder="Description"
        value={description}
        onChange={e => setDescription(e.target.value)}
      /><br /><br />

      <input
        placeholder="Country"
        value={country}
        onChange={e => setCountry(e.target.value)}
      /><br /><br />

      <button onClick={submitEntry}>Submit Entry</button>
      <button onClick={exportToExcel}>Export Excel</button>
      <button onClick={() => setAlertsEnabled(!alertsEnabled)}>
        {alertsEnabled ? "Disable Alerts" : "Enable Alerts"}
      </button>

      <hr />

      {/* Entries */}
      {entries.map((e, i) => (
        <div key={i} style={{
          background: e.flags !== "None" ? "#ffcccc" : "#ccffcc",
          padding: 10,
          margin: 5
        }}>
          <strong>{e.user}</strong> | {e.description} | {e.country}
          <div>{e.timestamp}</div>
          {e.flags !== "None" && <div>⚠ {e.flags}</div>}
        </div>
      ))}
    </div>
  );
}
