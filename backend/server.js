require("dotenv").config();
const express = require("express");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const port = process.env.PORT || 3000;

// Connexion à Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Route de test : vérifie la connexion à Supabase
app.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("materiel")
      .select("modele_mat")
      .limit(1);

    if (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Connexion échouée ❌",
        error
      });
    }

    return res.json({
      success: true,
      message: "Connexion Supabase OK ✔️",
      data
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      err
    });
  }
});

// Démarrer le serveur
app.listen(port, () => {
  console.log("Backend lancé sur Render ou en local.");
});
