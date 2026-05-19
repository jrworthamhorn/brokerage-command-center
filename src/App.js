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

