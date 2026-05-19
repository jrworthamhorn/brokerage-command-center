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

  // ✅ Load CSV
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;

      const rows = text.split("\n").slice(1);

      const parsed = rows.map(row => {
        const [code, description] = row.split(",");
        return {
          code: code?.trim(),
          description: description?.trim()
        };
      }).filter(r => r.code);

      setHtsData(parsed);
    };

    reader.readAsText(file);
  };

  // ✅ Filter list
  const filteredHTS = htsData.filter(item =>
    item.description?.toLowerCase().includes(search.toLowerCase()) ||
    item.code?.includes(search)
  );

  // ✅ Suggestions
  const suggestedHTS = htsData.filter(item =>
    description.length > 2 &&
    item.description?.toLowerCase().includes(description.toLowerCase())
  ).slice(0, 5);

  // ✅ Entry creation
  const classifyEntry = () => {
    if (!description || !country || !hts) {
      alert("Description, Country, and HTS required");
      return;
    }

    let flags = "None";

    if (country.toLowerCase() === "china") {
      flags = "Check Section 301";
    }

    const entry = {
      user,
      description,
      country,
      hts,
      flags,
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

    XLSX.writeFile(wb, "entries.xlsx");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Brokerage Command Center</h1>

      <input placeholder="User" value={user} onChange={e => setUser(e.target.value)} /><br /><br />

      <input placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} /><br /><br />

      {/* ✅ Suggestions */}
      {suggestedHTS.length > 0 && (
        <div style={{ background: "#e6ffe6", padding: 10 }}>
          <strong>Suggested HTS:</strong>
