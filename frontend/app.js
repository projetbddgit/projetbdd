// ---------------------------
// Photo aléatoire
// ---------------------------
async function loadImages() {
  try {
    const res = await fetch("/api/random-photos");
    const photos = await res.json();

    const gallery = document.getElementById("gallery");
    gallery.innerHTML = "";

    photos.forEach(photo => {
      const img = document.createElement("img");
      img.src = photo.url;
      img.width = 300;
      gallery.appendChild(img);
    });
  } catch (err) {
    console.error("Erreur chargement photos :", err);
  }
}

// ---------------------------
// Ajouter client
// ---------------------------
document.getElementById("client-form").addEventListener("submit", async e => {
  e.preventDefault();

  const nom = document.getElementById("nom").value;
  const mail = document.getElementById("mail").value;
  const poste = document.getElementById("poste").value;

  const res = await fetch("/api/client", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nom, mail, poste })
  });

  const data = await res.json();

  if (!res.ok) {
    alert("❌ Erreur : " + data.error);
    return;
  }

  alert("✅ Client ajouté avec succès");
  e.target.reset();
});

// ---------------------------
// Recherche client par nom
// ---------------------------
document.getElementById("search-btn").addEventListener("click", async () => {
  const nom = document.getElementById("search-name").value;
  const res = await fetch(`/api/clients?nom=${encodeURIComponent(nom)}`);
  const data = await res.json();

  if (!res.ok) {
    alert("❌ Erreur : " + data.error);
    return;
  }

  document.getElementById("client-result").textContent =
    JSON.stringify(data, null, 2);
});

// ---------------------------
// Ajouter photo
// ---------------------------
document.getElementById("photo-form").addEventListener("submit", async e => {
  e.preventDefault();

  const url = document.getElementById("photo-url").value;
  const flash = document.getElementById("photo-flash").checked;

  const res = await fetch("/api/photo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, flash })
  });

  const data = await res.json();

  if (!res.ok) {
    alert("❌ Erreur : " + data.error);
    return;
  }

  alert("✅ Photo ajoutée");
  e.target.reset();
  loadImages();
});

// ---------------------------
// Recherche commande par ID
// ---------------------------
document.getElementById("search-cmd-id").addEventListener("click", async () => {
  const id = document.getElementById("cmd-id").value;

  const res = await fetch(`/api/commande/${id}`);
  const data = await res.json();

  if (!res.ok) {
    alert("❌ Erreur : " + data.error);
    return;
  }

  document.getElementById("commande-result").textContent =
    JSON.stringify(data, null, 2);
});

// ---------------------------
// Commandes par client
// ---------------------------
document.getElementById("search-cmd-client").addEventListener("click", async () => {
  const id = document.getElementById("cmd-client-id").value;

  const res = await fetch(`/api/commandes?id_client=${id}`);
  const data = await res.json();

  if (!res.ok) {
    alert("❌ Erreur : " + data.error);
    return;
  }

  document.getElementById("commande-result").textContent =
    JSON.stringify(data, null, 2);
});

// ---------------------------
// Init
// ---------------------------
loadImages();
