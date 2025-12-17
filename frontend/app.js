// ---------------------------
// Photos aléatoires
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
// Upload image + infos
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

  // Recharge la liste seulement si elle est visible
  if (!document.getElementById("photo-section").hidden) {
    loadPhotoList();
  }
});

// ---------------------------
// Liste photos + filtre date
// ---------------------------
async function loadPhotoList() {
  const dateMin = document.getElementById("date-min").value;
  const dateMax = document.getElementById("date-max").value;

  const params = new URLSearchParams();
  if (dateMin) params.append("date_min", dateMin);
  if (dateMax) params.append("date_max", dateMax);

  const res = await fetch(`/api/photos?${params.toString()}`);
  const photos = await res.json();

  const container = document.getElementById("photo-list");
  container.innerHTML = "";

  photos.forEach(p => {
    const div = document.createElement("div");
    div.style.marginBottom = "20px";

    const img = document.createElement("img");
    img.src = p.url;
    img.width = 250;

    const info = document.createElement("p");
    info.textContent =
      `📅 ${new Date(p.time_photo).toLocaleString()} | Flash: ${p.flash} | Type: ${p.type || "-"}`;

    div.appendChild(img);
    div.appendChild(info);
    container.appendChild(div);
  });
}

// ---------------------------
// Afficher / masquer section liste
// ---------------------------
document.getElementById("toggle-photos").addEventListener("click", () => {
  const section = document.getElementById("photo-section");

  section.hidden = !section.hidden;

  if (!section.hidden) {
    loadPhotoList();
  }
});

document.getElementById("filter-photos")
  .addEventListener("click", loadPhotoList);

// ---------------------------
// Init
// ---------------------------
loadImages();
