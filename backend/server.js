require("dotenv").config();
const express = require("express");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------
//    CONNEXION SUPABASE
// ---------------------------
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.error("❌ ERREUR : Variables SUPABASE manquantes.");
  process.exit(1);
}

// ---------------------------
//     SERVE FRONTEND
// ---------------------------
const frontendPath = path.join(__dirname, "..", "frontend");
app.use(express.static(frontendPath));

// ---------------------------
//         ROUTES API
// ---------------------------

// Test Supabase
app.get("/api/test-supabase", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("materiel")
      .select("modele_mat")
      .limit(1);

    if (error) return res.status(500).json({
      success: false,
      message: "Connexion échouée ❌",
      error
    });

    res.json({
      success: true,
      message: "Connexion Supabase OK ✔️",
      data
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Erreur backend",
      err
    });
  }
});

// Random photos
app.get("/api/random-photos", async (req, res) => {
  const { data, error } = await supabase
    .from("photo")
    .select("url")
    .order("random()")
    .limit(12);

  if (error) return res.status(500).json({ error });

  res.json(data);
});

// ---------------------------
//   CATCH-ALL → FRONTEND
// ---------------------------
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// ---------------------------
//     START SERVER
// ---------------------------
app.listen(PORT, () => {
  console.log(`🚀 Backend lancé sur http://localhost:${PORT}`);
});
