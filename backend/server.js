require("dotenv").config();
const express = require("express");
const path = require("path");
const multer = require("multer");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------
// MIDDLEWARE
// ---------------------------
app.use(express.json());
const upload = multer({ storage: multer.memoryStorage() });

// ---------------------------
// CONNECT SUPABASE
// ---------------------------
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ---------------------------
// API
// ---------------------------

// 🧪 Test Supabase
app.get("/api/test-supabase", async (req, res) => {
  const { data, error } = await supabase
    .from("materiel")
    .select("modele_mat")
    .limit(1);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// 🎲 Photos aléatoires
app.get("/api/random-photos", async (req, res) => {
  const { count } = await supabase
    .from("photo")
    .select("*", { count: "exact", head: true });

  if (!count) return res.json([]);

  const offsets = new Set();
  const photosCount = Math.min(12, count);

  while (offsets.size < photosCount) {
    offsets.add(Math.floor(Math.random() * count));
  }

  const results = [];
  for (let offset of offsets) {
    const { data, error } = await supabase
      .from("photo")
      .select("url")
      .range(offset, offset);

    if (error) return res.status(500).json({ error: error.message });
    if (data?.length > 0) results.push(data[0]);
  }

  res.json(results);
});

// ➕ Ajouter un client
app.post("/api/client", async (req, res) => {
  const { nom, mail, poste } = req.body;
  if (!nom || nom.trim() === "") {
    return res.status(400).json({ error: "Le nom est obligatoire" });
  }

  const { data, error } = await supabase
    .from("client")
    .insert([{ nom: nom.trim(), mail: mail || null, poste: poste || null }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// 🔍 Rechercher clients par nom
app.get("/api/clients", async (req, res) => {
  const { nom } = req.query;
  if (!nom) return res.status(400).json({ error: "Paramètre 'nom' requis" });

  const { data, error } = await supabase
    .from("client")
    .select("*")
    .ilike("nom", `%${nom}%`);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// 🖼 Ajouter une photo PAR URL (FONCTIONNALITÉ CONSERVÉE)
app.post("/api/photo", async (req, res) => {
  const { url, flash } = req.body;
  if (!url) return res.status(400).json({ error: "URL obligatoire" });

  const { data, error } = await supabase
    .from("photo")
    .insert([{ url, time_photo: new Date().toISOString(), flash: flash ?? false }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// 🖼➕ NOUVEAU : upload fichier → bucket → table photo
app.post("/api/photo-upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Fichier manquant" });
    }

    const fileName = `${Date.now()}_${req.file.originalname}`;

    const { error: uploadError } = await supabase.storage
      .from("photos_bucket")
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from("photos_bucket")
      .getPublicUrl(fileName);

    const imageUrl = publicUrlData.publicUrl;

    const { data, error } = await supabase
      .from("photo")
      .insert([
        {
          url: imageUrl,
          time_photo: new Date().toISOString(),
          flash: req.body.flash === "true"
        }
      ])
      .select();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📦 Recherche commande par ID
app.get("/api/commande/:id", async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("commande")
    .select("*")
    .eq("num_cmd", id)
    .single();

  if (error) return res.status(404).json({ error: "Commande introuvable" });
  res.json(data);
});

// 📦 Recherche commandes d’un client
app.get("/api/commandes", async (req, res) => {
  const { id_client } = req.query;
  if (!id_client) return res.status(400).json({ error: "Paramètre id_client requis" });

  const { data, error } = await supabase
    .from("commande")
    .select("*")
    .eq("id_client", id_client)
    .order("date_cmd", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ---------------------------
// SERVE FRONTEND
// ---------------------------
const frontendPath = path.join(__dirname, "..", "frontend");
app.use(express.static(frontendPath));
app.get("*", (req, res) => res.sendFile(path.join(frontendPath, "index.html")));

// ---------------------------
// START SERVER
// ---------------------------
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
