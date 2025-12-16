// ---------------------------
// Convertit lien Google Drive en lien direct
// ---------------------------
function toDirectDriveUrl(url) {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  }
  return url;
}

// ---------------------------
// Photo aléatoire
// ---------------------------
async function loadImages() {
  const res = await fetch("/api/random-photos");
  const photos = await res.json();

  const gallery = document.getElementById("gallery");
  gallery.innerHTML = "";

  photos.forEach(photo => {
    const img = document.createElement("img");
    img.src = toDirectDriveUrl(photo.url);
    img.width = 300;
    gallery.appendChild(img);
  });
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

  if (!res.ok) return alert("Erreur ajout client");
  alert("Client ajouté");
  e.target.reset();
});

// ---------------------------
// Recherche client
// ---------------------------
document.getElementById("search-btn").addEventListener("click", async () => {
  const nom = document.getElementById("search-name").value;
  const res = await fetch(`/api/clients?nom=${encodeURIComponent(nom)}`);
  const data = await res.json();
  document.getElementById("client-result").textContent =
    JSON.stringify(data, null, 2);
});

// ---------------------------
// Ajouter photo (URL + upload)
// ---------------------------
document.getElementById("photo-form").addEventListener("submit", async e => {
  e.preventDefault();

  const fileInput = document.getElementById("photo-file");
  const urlInput = document.getElementById("photo-url");
  const flash = document.getElementById("photo-flash").checked;

  const formData = new FormData();
  formData.append("flash", flash);

  if (fileInput.files.length) {
    formData.append("image", fileInput.files[0]);
  }

  if (urlInput.value.trim()) {
    formData.append("url", toDirectDriveUrl(urlInput.value.trim()));
  }

  if (!fileInput.files.length && !urlInput.value.trim()) {
    return alert("Fichier ou URL requis");
  }

  const res = await fetch("/api/photo", {
    method: "POST",
    body: formData
  });

  if (!res.ok) return alert("Erreur ajout image");

  alert("Image ajoutée");
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
  document.getElementById("commande-result").textContent =
    JSON.stringify(data, null, 2);
});

// ---------------------------
loadImages();
