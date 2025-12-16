require("dotenv").config();
const express = require("express");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------
//   MIDDLEWARE
// ---------------------------
app.use(express.json());

// ---------------------------
//   CONNECT SUPABASE
// ---------------------------
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ---------------------------
//          API
// ---------------------------

// 🧪 Test Supabase
app.get("/api/test-supabase", async (req, res) => {
  const { data, error } = await supabase
    .from("materiel")
    .select("modele_mat")
    .limit(1);

  if (error) return res.status(500).json({ error });
  res.json(data);
});

// 🎲 Photos aléatoires
app.get("/api/random-photos", async (req, res) => {
  const { count, error: countError } = await supabase
    .from("photo")
    .select("*", { count: "exact", head: true });

  if (countError || !count) return res.json([]);

  const offset = Math.floor(Math.random() * count);

  const { data, error } = await supabase
    .from("photo")
    .select("url")
    .range(offset, offset);

  if (error) return res.status(500).json({ error });

  res.json(data);
});

// ➕ Ajouter un client
app.post("/api/client", async (req, res) => {
  const { nom, mail, poste } = req.body;

  if (!nom) {
    return res.status(400).json({ error: "Nom obligatoire" });
  }

  const { data, error } = await supabase
    .from("client")
    .insert([{ nom, mail, poste }])
    .select();

  if (error) return res.status(500).json({ error });

  res.status(201).json(data);
});

// 🔍 Rechercher des clients par nom
app.get("/api/clients", async (req, res) => {
  const { nom } = req.query;

  if (!nom) {
    return res.status(400).json({ error: "Paramètre 'nom' requis" });
  }

  const { data, error } = await supabase
    .from("client")
    .select("*")
    .ilike("nom", `%${nom}%`);

  if (error) return res.status(500).json({ error });

  res.json(data);
});

// 🖼️ Ajouter une image (URL)
app.post("/api/photo", async (req, res) => {
  const { url, flash } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL obligatoire" });
  }

  const { data, error } = await supabase
    .from("photo")
    .insert([
      {
        url,
        time_photo: new Date().toISOString(),
        flash: flash ?? false
      }
    ])
    .select();

  if (error) return res.status(500).json({ error });

  res.status(201).json(data);
});

// ---------------------------
//   SERVE FRONTEND
// ---------------------------
const frontendPath = path.join(__dirname, "..", "frontend");
app.use(express.static(frontendPath));

// ---------------------------
//   CATCH-ALL (SPA)
// ---------------------------
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// ---------------------------
//   START SERVER
// ---------------------------
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
