import express from "express";
import multer from "multer";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ---------------------------
// AJOUT CLIENT
// ---------------------------
app.post("/api/client", async (req, res) => {
  const { nom, mail, poste } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO client (nom, mail, poste) VALUES ($1,$2,$3) RETURNING *",
      [nom, mail, poste]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------
// RECHERCHE CLIENT PAR NOM
// ---------------------------
app.get("/api/clients", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM client WHERE nom ILIKE $1",
      [`%${req.query.nom}%`]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------
// AJOUT PHOTO (URL OU UPLOAD)
// ---------------------------
app.post("/api/photo", upload.single("image"), async (req, res) => {
  try {
    let imageUrl = req.body.url || null;

    // CAS 1 : upload fichier → Supabase Storage
    if (req.file) {
      const fileName = `${Date.now()}_${req.file.originalname}`;

      const { error } = await supabase.storage
        .from("photos_bucket")
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype
        });

      if (error) throw error;

      const { data } = supabase.storage
        .from("photos_bucket")
        .getPublicUrl(fileName);

      imageUrl = data.publicUrl;
    }

    if (!imageUrl) {
      return res.status(400).json({ error: "Aucune image fournie" });
    }

    await pool.query(
      "INSERT INTO image (url, flash) VALUES ($1,$2)",
      [imageUrl, req.body.flash === "true"]
    );

    res.json({ success: true, url: imageUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------
// PHOTOS ALÉATOIRES
// ---------------------------
app.get("/api/random-photos", async (req, res) => {
  const result = await pool.query(
    "SELECT url FROM image ORDER BY random() LIMIT 5"
  );
  res.json(result.rows);
});

// ---------------------------
// COMMANDE PAR ID
// ---------------------------
app.get("/api/commande/:id", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM commande WHERE id = $1",
    [req.params.id]
  );
  res.json(result.rows);
});

// ---------------------------
// COMMANDES PAR CLIENT
// ---------------------------
app.get("/api/commandes", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM commande WHERE id_client = $1",
    [req.query.id_client]
  );
  res.json(result.rows);
});

app.listen(3000, () => console.log("Serveur lancé sur port 3000"));
