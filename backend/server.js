const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const app = express();
const port = process.env.PORT || 3000;

// Middleware pour JSON
app.use(express.json());

// Connecte à Supabase
const supabaseUrl = "https://TON-PROJET.supabase.co";
const supabaseKey = "TON-API-KEY"; // Garde-le secret ! (voir .env)
const supabase = createClient(supabaseUrl, supabaseKey);

// Exemple route
app.get("/", (req, res) => {
  res.send("Hello backend + Supabase !");
});

// Exemple route API
app.get("/data", async (req, res) => {
  const { data, error } = await supabase.from("ta_table").select("*");
  if (error) return res.status(500).json({ error });
  res.json(data);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
