import { useState, useEffect } from "react";
import * as XLSX from "xlsx";

const SECTION_232 = [
  { keyword: "steel", duty: "9903.80.01", rate: "25%" },
  { keyword: "aluminum", duty: "9903.85.01", rate: "10%" }
];

const SECTION_301 = [
  { prefix: "8504", duty: "9903.88.03", rate: "25%" },
  { prefix: "8471", duty: "9903.88.01", rate: "25%" }
];

export default function App() {
  const [description, setDescription] = useState("");
  const [country, setCountry] = useState("");
  const [user, setUser] = useState("");
  const [hts, setHts] = useState("");
  const [entries, setEntries] = useState([]);
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  // ✅ KPI calculations
  const totalEntries = entries.length;
  const errorEntries = entries.filter(e => e.flags !== "None").length;
  const errorRate =
    totalEntries > 0
      ? ((errorEntries / totalEntries) * 100).toFixed(1)
      : 0;

  // ✅ Alerts
  useEffect(() => {
    if (!alertsEnabled) return;
    if (errorRate > 20) {
      alert(`⚠ High Error Rate: ${errorRate}%`);
    }
  }, [entries]);

  // ✅ Classification Engine
  const classifyEntry = () => {
    if (!description || !country || !hts) {
      alert("Description, Country, and HTS required");
      return;
    }

    let duties = [];
    let flags = [];

    const desc = description.toLowerCase();

    // Section 232
    SECTION_232.forEach(rule => {
      if (desc.includes(rule.keyword)) {
        duties.push(`${rule.duty} (${rule.rate})`);
      }
    });

    // Section 301
    if (country.toLowerCase() === "china") {
      let found301 = false;

      SECTION_301.forEach(rule => {
        if (hts.startsWith(rule.prefix)) {
          duties.push(`${rule.duty} (${rule.rate})`);
          found301 = true;
        }
      });

      if (!found301) {
        flags.push("Missing 301 duty");
      }
    }

    if (!hts) {
      flags.push("Missing HTS");
    }

    const entry = {
      user,
      description,
      country,
      hts,
      duties: duties.join(" | ") || "None",
      flags: flags.join(" | ") || "None",
      timestamp: new Date().toLocaleString()
    };

    setEntries(prev => [entry, ...prev]);

    // reset inputs
    setDescription("");
    setCountry("");
    setHts("");
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

      {/* Input Form */}
      <input
        placeholder="User"
        value={user}
        onChange={e => setUser(e.target.value)}
      /><br /><br />

      <input
        placeholder="Product Description"
        value={description}
        onChange={e => setDescription(e.target.value)}
      /><br /><br />

      <input
        placeholder="Country"
        value={country}
        onChange={e => setCountry(e.target.value)}
      /><br /><br />

      <input
        placeholder="HTS Code"
        value={hts}
        onChange={e => setHts(e.target.value)}
      /><br /><br />

      <button onClick={classifyEntry}>Generate Entry</button>
      <button onClick={exportToExcel}>Export Excel</button>
      <button onClick={() => setAlertsEnabled(!alertsEnabled)}>
        {alertsEnabled ? "Disable Alerts" : "Enable Alerts"}
      </button>

      <hr />

      {/* Entry Table */}
      {entries.map((e, i) => (
        <div
          key={i}
          style={{
            background: e.flags !== "None" ? "#ffcccc" : "#ccffcc",
            padding: 10,
            margin: 5
          }}
        >
          <strong>{e.user}</strong> | {e.hts}
          <div>{e.description}</div>
          <div>{e.country}</div>
          <div><b>Duties:</b> {e.duties}</div>
          <div>{e.timestamp}</div>

          {e.flags !== "None" && (
            <div style={{ color: "red" }}>⚠ {e.flags}</div>
          )}
        </div>
      ))}
    </div>
  );
}
