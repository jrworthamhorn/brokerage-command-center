import { useState } from "react";
import * as XLSX from "xlsx";

export default function App() {
  const [description, setDescription] = useState("");
  const [country, setCountry] = useState("");
  const [user, setUser] = useState("");
  const [hts, setHts] = useState("");
  const [entries, setEntries] = useState([]);
  const [search, setSearch] = useState("");
  const [htsData, setHtsData] = useState([]);

  // ✅ Country normalization
  const normalizeCountry = (input) => {
    const value = input.toLowerCase().trim();

    if (value === "china" || value === "cn") return "china";
    if (value === "us" || value === "usa" || value === "united states") return "usa";

    return value;
  };

  // ✅ Load CSV
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const rows = event.target.result.split("\n").slice(1);

      cconst parsed = rows.map(row => {
  const cleaned = row.replace(/"/g, "").split(",");

  const code = cleaned[0]?.trim();
  const description = cleaned.slice(1).join(" ").trim();

  // ✅ Only keep valid HTS codes (10+ digits)
  if (!code || code.length < 4) return null;

  return {
    code,
    description: description || "No description"
  };
}).filter(Boolean);
  const filteredHTS = htsData.filter(item =>
    item.description?.toLowerCase().includes(search.toLowerCase()) ||
    item.code?.includes(search)
  );

  // ✅ Suggestions
  const suggestedHTS = htsData.filter(item =>
    description.length > 2 &&
    item.description?.toLowerCase().includes(description.toLowerCase())
  ).slice(0, 5);

  // ✅ Classification (flexible now)
  const classifyEntry = () => {
    if (!description && !country && !hts) {
      alert("Enter at least one field");
      return;
    }

    let flags = [];
    let duties = [];

    const normCountry = normalizeCountry(country);
    const desc = description?.toLowerCase() || "";

    // Section 232
    if (desc.includes("steel")) duties.push("9903.80.01 (25%)");
    if (desc.includes("aluminum")) duties.push("9903.85.01 (10%)");

    // Section 301
    if (normCountry === "china" && hts) {
      if (hts.startsWith("8504")) {
        duties.push("9903.88.03 (25%)");
      } else if (hts.startsWith("8471")) {
        duties.push("9903.88.01 (25%)");
      } else {
        flags.push("Missing 301 duty");
      }
    }

    const entry = {
      user,
      description: description || "N/A",
      country: country || "N/A",
      hts: hts || "N/A",
      duties: duties.join(" | ") || "None",
      flags: flags.join(" | ") || "None",
      timestamp: new Date().toLocaleString()
    };

    setEntries(prev => [entry, ...prev]);

    setDescription("");
    setCountry("");
    setHts("");
  };

  // ✅ Export
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(entries);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Entries");
    XLSX.writeFile(wb, "entries.xlsx");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Brokerage Command Center</h1>

      <input placeholder="User" value={user} onChange={e => setUser(e.target.value)} /><br /><br />

      <input placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} /><br /><br />

      {suggestedHTS.length > 0 && (
        <div style={{ background: "#e6ffe6", padding: 10 }}>
          <strong>Suggested HTS:</strong>
          {suggestedHTS.map((item, i) => (
            <div key={i} onClick={() => setHts(item.code)} style={{ cursor: "pointer" }}>
              {item.code} - {item.description}
            </div>
          ))}
        </div>
      )}

      <input placeholder="Country" value={country} onChange={e => setCountry(e.target.value)} /><br /><br />

      <input type="file" accept=".csv" onChange={handleFileUpload} /><br /><br />

      <input placeholder="Search HTS" value={search} onChange={e => setSearch(e.target.value)} /><br /><br />

      <div style={{ maxHeight: 150, overflowY: "scroll", border: "1px solid #ccc" }}>
        {filteredHTS.map((item, i) => (
          <div key={i} onClick={() => setHts(item.code)} style={{ padding: 5, cursor: "pointer" }}>
            {item.code} - {item.description}
          </div>
        ))}
      </div>

      <br />

      <input placeholder="Selected HTS" value={hts} onChange={e => setHts(e.target.value)} /><br /><br />

      <button onClick={classifyEntry}>Generate Entry</button>
      <button onClick={exportToExcel}>Export Excel</button>

      <hr />

      {entries.map((e, i) => (
        <div key={i} style={{
          background: e.flags !== "None" ? "#ffcccc" : "#ccffcc",
          padding: 10,
          margin: 5
        }}>
          <strong>{e.user}</strong> | {e.hts}
          <div>{e.description}</div>
          <div>{e.country}</div>
          <div>{e.duties}</div>
          {e.flags !== "None" && <div>⚠ {e.flags}</div>}
        </div>
      ))}
    </div>
  );
}
