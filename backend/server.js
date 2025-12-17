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

// ---------------------------
// MULTER (upload en mémoire)
// ---------------------------
const upload = multer({ storage: multer.memoryStorage() });

// ---------------------------
// CONNECT SUPABASE
// ---------------------------
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // clé service role pour bypass RLS
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
  console.log("📩 Requête ajout client :", req.body);

  const { nom, mail, poste } = req.body;
  if (!nom || nom.trim() === "") {
    return res.status(400).json({ error: "Le nom est obligatoire" });
  }

  const { data, error } = await supabase
    .from("client")
    .insert([{ nom: nom.trim(), mail: mail || null, poste: poste || null }])
    .select();

  if (error) {
    console.error("❌ Erreur Supabase INSERT client :", error);
    return res.status(500).json({ error: error.message });
  }

  console.log("✅ Client inséré :", data);
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

// 🖼 Ajouter une photo (upload fichier ou URL)
app.post("/api/photo", upload.single("image"), async (req, res) => {
  console.log("📩 Requête ajout photo :", req.body);

  try {
    let imageUrl = req.body.url || null;
    const flashValue = req.body.flash === "true" || req.body.flash === true;

    // ---------------------------
    // CAS 1 : upload fichier vers Supabase Storage
    // ---------------------------
    if (req.file) {
      const ext = req.file.originalname.split(".").pop();
      const fileName = `${Date.now()}.${ext}`;

      const { error: storageError } = await supabase.storage
        .from("photos_bucket")
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false
        });

      if (storageError) {
        console.error("❌ Erreur storage :", storageError);
        return res.status(500).json({ step: "storage", error: storageError.message });
      }

      const { data: urlData } = supabase.storage
        .from("photos_bucket")
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        return res.status(500).json({ step: "public_url", error: "Impossible de récupérer l’URL publique" });
      }

      imageUrl = urlData.publicUrl;
    }

    if (!imageUrl) {
      return res.status(400).json({ step: "input", error: "Aucune image fournie" });
    }

    // ---------------------------
    // INSERTION TABLE photo
    // ---------------------------
    const { data, error: dbError } = await supabase
      .from("photo")
      .insert([{ url: imageUrl, time_photo: new Date().toISOString(), flash: flashValue }])
      .select();

    if (dbError) {
      console.error("❌ Erreur INSERT table photo :", dbError);
      return res.status(500).json({ step: "database", error: dbError.message });
    }

    console.log("✅ Photo insérée :", data);
    res.status(201).json({ success: true, url: imageUrl, data });

  } catch (err) {
    console.error("❌ Erreur inconnue :", err);
    res.status(500).json({ step: "unknown", error: err.message });
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
