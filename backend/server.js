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
  process.env.SUPABASE_KEY,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
//test bizarre
// ---------------------------
// API — PHOTOS (INCHANGÉ)
// ---------------------------

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
    const { data } = await supabase
      .from("photo")
      .select("url")
      .range(offset, offset);

    if (data?.length) results.push(data[0]);
  }

  res.json(results);
});

// 🆕 Upload image
app.post("/api/upload-photo", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ step: "multer", error: "Aucun fichier" });
    }

    const { focale, obturation, flash, tag, type } = req.body;

    const ext = req.file.originalname.split(".").pop();
    const fileName = `${Date.now()}.${ext}`;

    const { error: storageError } = await supabase.storage
      .from("photos_bucket")
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype
      });

    if (storageError) {
      return res.status(500).json({ step: "storage", error: storageError.message });
    }

    const { data: urlData } = supabase.storage
      .from("photos_bucket")
      .getPublicUrl(fileName);

    const { error: dbError } = await supabase
      .from("photo")
      .insert([{
        url: urlData.publicUrl,
        time_photo: new Date().toISOString(),
        focale: focale || null,
        obturation: obturation || null,
        flash: flash === "true",
        tag: tag || null,
        type: type || null
      }]);

    if (dbError) {
      return res.status(500).json({ step: "database", error: dbError.message });
    }

    res.status(201).json({ success: true });

  } catch (err) {
    res.status(500).json({ step: "unknown", error: err.message });
  }
});

// 📸 Liste photos PAGINÉE
app.get("/api/photos", async (req, res) => {
  const { date_min, date_max, order = "desc", page = 1, limit = 10 } = req.query;

  const from = (page - 1) * limit;
  const to = from + Number(limit) - 1;

  let query = supabase
    .from("photo")
    .select("url, time_photo", { count: "exact" });

  if (date_min) query = query.gte("time_photo", date_min);
  if (date_max) query = query.lte("time_photo", date_max);

  query = query
    .order("time_photo", { ascending: order === "asc" })
    .range(from, to);

  const { data, count, error } = await query;

  if (error) return res.status(500).json({ error: error.message });

  res.json({ photos: data, total: count });
});

// 🔍 Photo par URL
app.get("/api/photo-by-url", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "URL manquante" });

  const { data, error } = await supabase
    .from("photo")
    .select("*")
    .eq("url", url)
    .single();

  if (error) return res.status(404).json({ error: "Photo introuvable" });
  res.json(data);
});

// ---------------------------
// API — MATÉRIEL (AJOUT SEULEMENT)
// ---------------------------

// 📦 Liste matériel PAGINÉE
app.get("/api/materiels", async (req, res) => {
  const { order = "desc", page = 1, limit = 10 } = req.query;

  const from = (page - 1) * limit;
  const to = from + Number(limit) - 1;

  const { data, count, error } = await supabase
    .from("materiel")
    .select("modele_mat, num_mat, date_acq", { count: "exact" })
    .order("date_acq", { ascending: order === "asc" })
    .range(from, to);

  if (error) return res.status(500).json({ error: error.message });

  res.json({ materiels: data, total: count });
});

// 🔍 Détails matériel via (modele_mat, num_mat)
app.get("/api/materiel-detail", async (req, res) => {
  const { modele_mat, num_mat } = req.query;

  if (!modele_mat || !num_mat) {
    return res.status(400).json({ error: "modele_mat et num_mat requis" });
  }

  const { data, error } = await supabase
    .from("materiel")
    .select("*")
    .eq("modele_mat", modele_mat)
    .eq("num_mat", num_mat)
    .single();

  if (error) {
    return res.status(404).json({ error: "Matériel introuvable" });
  }

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
app.listen(PORT, () =>
  console.log(`🚀 Backend running on port ${PORT}`)
);
