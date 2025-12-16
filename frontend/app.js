// ---------------------------
// Charger une photo aléatoire
// ---------------------------
async function loadImages() {
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
}

// ---------------------------
// Ajouter un client
// ---------------------------
document.getElementById("client-form").addEventListener("submit", async e => {
  e.preventDefault();

  const nom = document.getElementById("nom").value;
  const mail = document.getElementById("mail").value;
  const poste = document.getElementById("poste").value;

  await fetch("/api/client", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nom, mail, poste })
  });

  alert("Client ajouté");
  e.target.reset();
});

// ---------------------------
// Recherche client par nom
// ---------------------------
document.getElementById("search-btn").addEventListener("click", async () => {
  const nom = document.getElementById("search-name").value;

  const res = await fetch(`/api/clients?nom=${encodeURIComponent(nom)}`);
  const data = await res.json();

  document.getElementById("client-result").textContent =
    JSON.stringify(data, null, 2);
});

// ---------------------------
// Ajouter une image
// ---------------------------
document.getElementById("photo-form").addEventListener("submit", async e => {
  e.preventDefault();

  const url = document.getElementById("photo-url").value;
  const flash = document.getElementById("photo-flash").checked;

  await fetch("/api/photo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, flash })
  });

  alert("Image ajoutée");
  e.target.reset();
  loadImages();
});

// ---------------------------
// Initialisation
// ---------------------------
loadImages();
