require("dotenv").config();
const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer"); // pour gérer l'upload de fichiers
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------
//   CONNECT SUPABASE
// ---------------------------
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ---------------------------
//   MIDDLEWARE
// ---------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Config multer pour upload temporaire
const upload = multer({ dest: "tmp/" });

// ---------------------------
//          API
// ---------------------------

// 🧪 Test Supabase
app.get("/api/test-supabase", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("materiel")
      .select("modele_mat")
      .limit(1);

    if (error) return res.status(500).json({ success: false, error });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, err });
  }
});

// 🎲 API : Photos aléatoires
app.get("/api/random-photos", async (req, res) => {
  try {
    const { count, error: countError } = await supabase
      .from("photo")
      .select("*", { count: "exact", head: true });

    if (countError) return res.status(500).json({ error: countError });
    if (!count || count === 0) return res.json([]);

    const photosCount = Math.min(12, count); // jusqu'à 12 photos
    const offsets = new Set();
    while (offsets.size < photosCount) offsets.add(Math.floor(Math.random() * count));

    const results = [];
    for (let offset of offsets) {
      const { data, error } = await supabase
        .from("photo")
        .select("url")
        .range(offset, offset);

      if (error) return res.status(500).json({ error });
      if (data?.length > 0) results.push(data[0]);
    }

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err });
  }
});

// ➕ API : Ajouter un client
app.post("/api/add-client", async (req, res) => {
  const { nom, mail, poste } = req.body;
  if (!nom || !mail || !poste) return res.status(400).json({ error: "Champs manquants" });

  try {
    const { data, error } = await supabase.from("client").insert([{ nom, mail, poste }]);
    if (error) return res.status(500).json({ error });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// 🔍 API : Rechercher client par nom
app.get("/api/search-client", async (req, res) => {
  const { nom } = req.query;
  if (!nom) return res.status(400).json({ error: "Nom requis" });

  try {
    const { data, error } = await supabase
      .from("client")
      .select("*")
      .ilike("nom", `%${nom}%`);

    if (error) return res.status(500).json({ error });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// 🔍 API : Rechercher commandes
app.get("/api/search-commandes", async (req, res) => {
  const { num_cmd, id_client } = req.query;

  try {
    let query = supabase.from("commande").select("*");
    if (num_cmd) query = query.eq("num_cmd", num_cmd);
    if (id_client) query = query.eq("id_client", id_client);

    const { data, error } = await query;
    if (error) return res.status(500).json({ error });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// 🖼 API : Upload image vers bucket
app.post("/api/upload-photo", upload.single("photo"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Fichier manquant" });

  const filename = req.file.originalname;
  const filePath = req.file.path;

  try {
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("photos_bucket")
      .upload(filename, fs.readFileSync(filePath), { upsert: true });

    if (uploadError) throw uploadError;

    const { publicUrl } = supabase.storage
      .from("photos_bucket")
      .getPublicUrl(filename);

    // Supprimer le fichier temporaire
    fs.unlinkSync(filePath);

    // Ajouter à la table photo
    const { data: photoData, error: dbError } = await supabase
      .from("photo")
      .insert([{ url: publicUrl, time_photo: new Date(), flash: true }]);

    if (dbError) throw dbError;

    res.json({ success: true, url: publicUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || err });
  }
});

// ---------------------------
//   SERVE FRONTEND
// ---------------------------
const frontendPath = path.join(__dirname, "..", "frontend");
app.use(express.static(frontendPath));

// ---------------------------
//   CATCH-ALL (pour SPA)
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
