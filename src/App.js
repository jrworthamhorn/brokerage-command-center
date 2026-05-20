import { useState, useEffect } from "react";
import * as XLSX from "xlsx";

// ✅ Sample HTS Data (expand later)
const HTS_DATA = [
  { code: "7308903000", description: "Steel structures" },
  { code: "7606123091", description: "Aluminum plates" },
  { code: "8504400000", description: "Electrical transformers" },
  { code: "8471300000", description: "Portable computers" }
];

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
  const [search, setSearch] = useState("");

  // ✅ HTS Search Filter
  const filteredHTS = HTS_DATA.filter(item =>
    item.description.toLowerCase().includes(search.toLowerCase()) ||
    item.code.includes(search)
  );

  // ✅ Suggestions based on description
  const suggestedHTS = HTS_DATA.filter(item =>
    description.length > 2 &&
    item.description.toLowerCase().includes(description.toLowerCase())
  ).slice(0, 5);

  // ✅ KPI
  const totalEntries = entries.length;
  const errorEntries = entries.filter(e => e.flags !== "None").length;
  const errorRate = totalEntries > 0
    ? ((errorEntries / totalEntries) * 100).toFixed(1)
    : 0;
  
// ✅ Normalize country input
const normalizeCountry = (input) => {
  const value = input.toLowerCase().trim();

  if (value === "china" || value === "cn") return "china";
  if (value === "united states" || value === "us" || value === "usa") return "usa";

  return value; // fallback
};

  // ✅ Classification Engine
  const classifyEntry = () => {

  // ✅ allow flexible entry (no strict requirement)
  if (!description && !country && !hts) {
    alert("Enter at least one field");
    return;
  }

  let flags = [];
  let duties = [];

  const normCountry = normalizeCountry(country);
  const desc = description?.toLowerCase() || "";

  // ✅ Section 232 (only if description exists)
  if (desc.includes("steel")) {
    duties.push("9903.80.01 (25%)");
  }

  if (desc.includes("aluminum")) {
    duties.push("9903.85.01 (10%)");
  }

  // ✅ Section 301 (only if country + hts available)
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

  // ✅ reset fields
  setDescription("");
  setCountry("");
  setHts("");
};

    let duties = [];
    let flags = [];

    const desc = description.toLowerCase();

    SECTION_232.forEach(rule => {
      if (desc.includes(rule.keyword)) {
        duties.push(`${rule.duty} (${rule.rate})`);
      }
    });

    if (country.toLowerCase() === "china") {
      let found = false;
      SECTION_301.forEach(rule => {
        if (hts.startsWith(rule.prefix)) {
          duties.push(`${rule.duty} (${rule.rate})`);
          found = true;
        }
      });
      if (!found) flags.push("Missing 301 duty");
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
      <div>
        Total: {totalEntries} | Errors: {errorEntries} | Rate: {errorRate}%
      </div>

      <hr />

      {/* Inputs */}
      <input placeholder="User" value={user} onChange={e => setUser(e.target.value)} /><br /><br />

      <input
        placeholder="Description"
        value={description}
        onChange={e => setDescription(e.target.value)}
      /><br /><br />

      {/* ✅ Suggested HTS */}
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

      <input placeholder="Search HTS" value={search} onChange={e => setSearch(e.target.value)} /><br /><br />

      {/* ✅ HTS List */}
      <div style={{ maxHeight: 150, overflowY: "scroll", border: "1px solid #ccc" }}>
        {filteredHTS.map((item, i) => (
          <div key={i} onClick={() => setHts(item.code)} style={{ padding: 5, cursor: "pointer" }}>
            {item.code} - {item.description}
          </div>
        ))}
      </div>

      <br />

      <input
        placeholder="Selected HTS"
        value={hts}
        onChange={e => setHts(e.target.value)}
      /><br /><br />

      <button onClick={classifyEntry}>Generate Entry</button>
      <button onClick={exportToExcel}>Export Excel</button>

      <hr />

      {/* Entries */}
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
          <div>Duties: {e.duties}</div>
          {e.flags !== "None" && <div>⚠ {e.flags}</div>}
        </div>
      ))}
    </div>
  );
}
