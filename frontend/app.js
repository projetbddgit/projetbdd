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

  const nom = document.getElementById("nom").value;
  const mail = document.getElementById("mail").value;
  const poste = document.getElementById("poste").value;

  const res = await fetch("/api/client", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nom, mail, poste })
  });

  const data = await res.json();
  if (!res.ok) return alert(data.error);

  alert("✅ Client ajouté");
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
// Ajouter photo URL
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

  const data = await res.json();
  if (!res.ok) return alert(data.error);

  alert("✅ Photo ajoutée");
  e.target.reset();
  loadImages();
});

// ---------------------------
// Upload image (bucket)
// ---------------------------
document.getElementById("upload-form").addEventListener("submit", async e => {
  e.preventDefault();

  const formData = new FormData(e.target);

  const res = await fetch("/api/upload-photo", {
    method: "POST",
    body: formData
  });

  const data = await res.json();

  if (!res.ok) {
    alert(`Erreur (${data.step}) : ${data.error}`);
    return;
  }

  alert("✅ Image uploadée");
  loadImages();
});

// ---------------------------
// Init
// ---------------------------
loadImages();
