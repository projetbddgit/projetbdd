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
    // 1. Compter les photos
    const { count, error: countError } = await supabase
      .from("photo")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error(countError);
      return res.status(500).json({ error: countError });
    }

    if (!count || count === 0) {
      return res.json([]);
    }

    // 2. On veut 12 photos uniques (ou moins si la BDD en a moins)
    const photosCount = Math.min(2, count);
    const offsets = new Set();

    while (offsets.size < photosCount) {
      offsets.add(Math.floor(Math.random() * count));
    }

    const offsetsArray = [...offsets];

    // 3. Récupération
    const results = [];

    for (let offset of offsetsArray) {
      const { data, error } = await supabase
        .from("photo")
        .select("url")
        .range(offset, offset);

      if (error) {
        console.error(error);
        return res.status(500).json({ error });
      }

      if (data?.length > 0) {
        results.push(data[0]);
      }
    }

    res.json(results);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err });
  }
});


// ---------------------------
//   SERVE FRONTEND
// ---------------------------
const frontendPath = path.join(__dirname, "..", "frontend");

// Sert les fichiers statiques (index.html, style.css, app.js…)
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
