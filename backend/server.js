require("dotenv").config();
const express = require("express");
const path = require("path");
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
//   SERVE FRONTEND
// ---------------------------
const frontendPath = path.join(__dirname, "..", "frontend");

app.use(express.static(frontendPath)); 
// Sert index.html, styles.css, script.js… automatiquement

// ---------------------------
//          API
// ---------------------------

// Test Supabase (ATTENTION: plus sur /)
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

// Random photos
app.get("/api/random-photos", async (req, res) => {
  try {
    // 1. Compter le nombre total d’images
    const { count, error: countError } = await supabase
      .from("photo")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error(countError);
      return res.status(500).json({ error: countError });
    }

    if (count === 0) {
      return res.json([]);
    }

    // 2. Générer 12 offsets aléatoires SANS DOUBLONS
    const maxPhotos = Math.min(2, count); 
    const offsets = new Set();

    while (offsets.size < maxPhotos) {
      offsets.add(Math.floor(Math.random() * count));
    }

    offsetsArray = [...offsets];

    // 3. Récupérer les images une par une
    const results = [];

    for (let offset of offsetsArray) {
      const { data, error } = await supabase
        .from("photo")
        .select("url")
        .range(offset, offset); // équivalent de offset offset limit 1

      if (error) {
        console.error(error);
        return res.status(500).json({ error });
      }

      if (data && data.length > 0) {
        results.push(data[0]);
      }
    }

    res.json(results);

  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// ---------------------------
//   CATCH-ALL (Doit être après API)
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
