import { useState } from "react";
import * as XLSX from "xlsx";

export default function App() {
  const [description, setDescription] = useState("");
  const [country, setCountry] = useState("");
  const [user, setUser] = useState("");
  const [hts, setHts] = useState("");

  const [entries, setEntries] = useState([]);
  const [htsData, setHtsData] = useState([]);
  const [search, setSearch] = useState("");

  const [htsMapping, setHtsMapping] = useState([]);
  const [dutyRules, setDutyRules] = useState([]);

  // ✅ Normalize country
  const normalizeCountry = (input) => {
    const val = (input || "").toLowerCase().trim();
    if (val === "china" || val === "cn") return "china";
    if (val === "us" || val === "usa" || val === "united states") return "usa";
    return val;
  };

  // ✅ Normalize HTS (remove dots/spaces)
  const normalizeHTS = (code) => {
    return (code || "").toString().replace(/\D/g, "");
  };

  // ✅ Upload HTS CSV
  const handleHTSUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const rows = event.target.result.split("\n").slice(1);

      const parsed = rows
        .map((row) => {
          if (!row) return null;

          const cleaned = row.replace(/"/g, "");
          const parts = cleaned.split(",");

          if (!parts[0]) return null;

          return {
            code: parts[0].trim(),
            description: parts.slice(1).join(" ").trim()
          };
        })
        .filter(Boolean);

      setHtsData(parsed);
    };

    reader.readAsText(file);
  };

  // ✅ Upload 232 mapping file
  const handle232Upload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);

      const parsed = json
        .map((row) => ({
          hts: normalizeHTS(row["US HTS"]),
          result: row["Chapter 99 Result"]
        }))
        .filter(
          (r) =>
            r.hts &&
            r.hts.length >= 8 &&
            r.result &&
            r.result.toString().startsWith("9903")
        );

      setHtsMapping(parsed);
    };

    reader.readAsArrayBuffer(file);
  };

  // ✅ Upload duty rules file
  const handleDutyUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);

      const parsed = json
        .map((row) => ({
          code: row["Chapter 99 HTS"],
          rate: row["Additional Duty"],
          desc: row["Description"]
        }))
        .filter((r) => r.code);

      setDutyRules(parsed);
    };

    reader.readAsArrayBuffer(file);
  };

  // ✅ HTS search
  const filteredHTS = htsData.filter(
    (h) =>
      h.description?.toLowerCase().includes(search.toLowerCase()) ||
      h.code.includes(search)
  );

  // ✅ Suggestions
  const suggestedHTS = htsData
    .filter(
      (h) =>
        description &&
        h.description?.toLowerCase().includes(description.toLowerCase())
    )
    .slice(0, 5);

  // ✅ MAIN CLASSIFICATION ENGINE (FIXED)
  const classifyEntry = () => {
    if (!description && !country && !hts) {
      alert("Enter at least one field");
      return;
    }

    const cleanHTS = normalizeHTS(hts);
    const normCountry = normalizeCountry(country);

    let duties = [];
    let flags = [];

    let match = null;

    // ✅ 1. EXACT 10-digit match
    match = htsMapping.find(
      (row) => normalizeHTS(row.hts) === cleanHTS
    );

    // ✅ 2. 8-digit fallback
    if (!match) {
      match = htsMapping.find(
        (row) =>
          normalizeHTS(row.hts)?.substring(0, 8) === cleanHTS.substring(0, 8)
      );
    }

    // ✅ 3. 6-digit fallback
    if (!match) {
      match = htsMapping.find(
        (row) =>
          normalizeHTS(row.hts)?.substring(0, 6) === cleanHTS.substring(0, 6)
      );
    }

    // ✅ Apply 232 result
    if (match) {
      duties.push(match.result);

      const dutyInfo = dutyRules.find(
        (d) => d.code === match.result
      );

      if (dutyInfo?.rate) {
        duties.push(`Rate: ${dutyInfo.rate}`);
      }
    } else {
      flags.push("No 232 mapping found");
    }

    // ✅ Section 301
    if (normCountry === "china" && cleanHTS) {
      if (cleanHTS.startsWith("84") || cleanHTS.startsWith("85")) {
        duties.push("9903.88.03 (25%)");
      } else if (cleanHTS.startsWith("90")) {
        duties.push("9903.88.01 (25%)");
      }
    }

    const entry = {
      user: user || "N/A",
      description: description || "N/A",
      country: country || "N/A",
      hts: hts || "N/A",
      duties: duties.join(" | ") || "None",
      flags: flags.join(" | ") || "None",
      timestamp: new Date().toLocaleString()
    };

    setEntries((prev) => [entry, ...prev]);

    setDescription("");
    setCountry("");
    setHts("");
  };

  // ✅ Export
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(entries);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Entries");
    XLSX.writeFile(wb, "brokerage_entries.xlsx");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Brokerage Command Center</h1>

      <input placeholder="User" value={user} onChange={(e) => setUser(e.target.value)} /><br /><br />

      <input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} /><br /><br />

      {suggestedHTS.length > 0 && (
        <div style={{ background: "#e6ffe6", padding: 10 }}>
          <b>Suggested HTS:</b>
          {suggestedHTS.map((h, i) => (
            <div key={i} onClick={() => setHts(h.code)} style={{ cursor: "pointer" }}>
              {h.code} - {h.description}
            </div>
          ))}
        </div>
      )}

      <input placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} /><br /><br />

      <p><b>Upload HTS CSV</b></p>
      <input type="file" accept=".csv" onChange={handleHTSUpload} /><br /><br />

      <p><b>Upload 232 Mapping File</b></p>
      <input type="file" accept=".xlsx" onChange={handle232Upload} /><br /><br />

      <p><b>Upload Duty File</b></p>
      <input type="file" accept=".xlsx" onChange={handleDutyUpload} /><br /><br />

      <input placeholder="Search HTS" value={search} onChange={(e) => setSearch(e.target.value)} /><br /><br />

      <div style={{ maxHeight: 150, overflowY: "scroll", border: "1px solid black" }}>
        {filteredHTS.map((h, i) => (
          <div key={i} onClick={() => setHts(h.code)} style={{ cursor: "pointer" }}>
            {h.code} - {h.description}
          </div>
        ))}
      </div>

      <br />

      <input placeholder="Selected HTS" value={hts} onChange={(e) => setHts(e.target.value)} /><br /><br />

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
          <div><b>Duties:</b> {e.duties}</div>
          {e.flags !== "None" && <div style={{ color: "red" }}>⚠ {e.flags}</div>}
        </div>
      ))}
    </div>
  );
}
``
