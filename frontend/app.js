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
  document.getElementById("client-result").textContent = JSON.stringify(data, null, 2);
});

// ---------------------------
// Upload photo bucket avec flash
// ---------------------------
document.getElementById("upload-form").addEventListener("submit", async e => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const flash = document.createElement("input");
  flash.type = "hidden";
  flash.name = "flash";
  flash.value = document.getElementById("photo-flash")?.checked ?? false;
  formData.append("flash", flash.value);

  const res = await fetch("/api/upload-photo", { method: "POST", body: formData });
  const data = await res.json();

  if (!res.ok) return alert(`Erreur (${data.step}) : ${data.error}`);
  alert("✅ Image uploadée");
  loadImages();
});

// ---------------------------
// Init
// ---------------------------
loadImages();
