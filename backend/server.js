require("dotenv").config();
const express = require("express");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------
// MIDDLEWARE
// ---------------------------
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage()
});

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
    .from("photo")
    .select("url")
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

// 🔍 Recherche clients
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

// 🆕 Upload image + métadonnées
app.post("/api/upload-photo", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        step: "multer",
        error: "Aucun fichier reçu"
      });
    }

    const {
      focale,
      obturation,
      flash,
      tag,
      type
    } = req.body;

    const ext = req.file.originalname.split(".").pop();
    const fileName = `${Date.now()}.${ext}`;

    const { error: storageError } = await supabase.storage
      .from("photos_bucket")
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype
      });

    if (storageError) {
      return res.status(500).json({
        step: "storage",
        error: storageError.message
      });
    }

    const { data: urlData } = supabase.storage
      .from("photos_bucket")
      .getPublicUrl(fileName);

    const { data, error: dbError } = await supabase
      .from("photo")
      .insert([{
        url: urlData.publicUrl,
        time_photo: new Date().toISOString(),
        focale: focale || null,
        obturation: obturation || null,
        flash: flash === "true",
        tag: tag || null,
        type: type || null
      }])
      .select();

    if (dbError) {
      return res.status(500).json({
        step: "database",
        error: dbError.message
      });
    }

    res.status(201).json({ success: true, data });

  } catch (err) {
    res.status(500).json({ step: "unknown", error: err.message });
  }
});

// 📸 Liste des photos + filtres date
app.get("/api/photos", async (req, res) => {
  const { date_min, date_max } = req.query;

  let query = supabase
    .from("photo")
    .select("*")
    .order("time_photo", { ascending: false });

  if (date_min) query = query.gte("time_photo", date_min);
  if (date_max) query = query.lte("time_photo", date_max);

  const { data, error } = await query;

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ---------------------------
// SERVE FRONTEND
// ---------------------------
const frontendPath = path.join(__dirname, "..", "frontend");
app.use(express.static(frontendPath));
app.get("*", (req, res) =>
  res.sendFile(path.join(frontendPath, "index.html"))
);

// ---------------------------
// START SERVER
// ---------------------------
app.listen(PORT, () =>
  console.log(`🚀 Backend running on port ${PORT}`)
);
