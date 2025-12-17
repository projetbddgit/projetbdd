// ---------------------------
// Convertit lien Google Drive en lien direct (CONSERVÉ)
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
    img.src = photo.url;
    img.width = 300;
    gallery.appendChild(img);
  });
}

// ---------------------------
// Ajouter client
// ---------------------------
document.getElementById("client-form").addEventListener("submit", async e => {
  e.preventDefault();

  const nom = nom.value;
  const mail = mail.value;
  const poste = poste.value;

  const res = await fetch("/api/client", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nom, mail, poste })
  });

  if (!res.ok) return alert("Erreur ajout client");
  alert("✅ Client ajouté");
  e.target.reset();
});

// ---------------------------
// Ajouter photo PAR URL (inchangé)
// ---------------------------
document.getElementById("photo-form").addEventListener("submit", async e => {
  e.preventDefault();

  const url = toDirectDriveUrl(document.getElementById("photo-url").value);
  const flash = document.getElementById("photo-flash").checked;

  const res = await fetch("/api/photo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, flash })
  });

  if (!res.ok) return alert("Erreur ajout photo URL");

  e.target.reset();
  loadImages();
});

// ---------------------------
// NOUVEAU : upload fichier
// ---------------------------
document.getElementById("photo-upload-form").addEventListener("submit", async e => {
  e.preventDefault();

  const file = document.getElementById("photo-file").files[0];
  const flash = document.getElementById("photo-flash-upload").checked;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("flash", flash);

  const res = await fetch("/api/photo-upload", {
    method: "POST",
    body: formData
  });

  if (!res.ok) return alert("Erreur upload image");

  e.target.reset();
  loadImages();
});

// ---------------------------
loadImages();
