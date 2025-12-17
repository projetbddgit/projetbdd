let currentPage = 1;
const limit = 10;

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
// Upload image
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
// Liste photos paginée
// ---------------------------
async function loadPhotoList() {
  const dateMin = document.getElementById("date-min").value;
  const dateMax = document.getElementById("date-max").value;
  const order = document.getElementById("order").value;

  const params = new URLSearchParams({
    page: currentPage,
    limit,
    order
  });

  if (dateMin) params.append("date_min", dateMin);
  if (dateMax) params.append("date_max", dateMax);

  const res = await fetch(`/api/photos?${params.toString()}`);
  const { photos, total } = await res.json();

  const container = document.getElementById("photo-list");
  container.innerHTML = "";

  photos.forEach(p => {
    const div = document.createElement("div");

    const img = document.createElement("img");
    img.src = p.url;
    img.width = 200;

    const info = document.createElement("p");
    info.innerHTML = `
      <strong>URL :</strong> ${p.url}<br>
      <strong>Date :</strong> ${new Date(p.time_photo).toLocaleString()}
    `;

    div.appendChild(img);
    div.appendChild(info);
    container.appendChild(div);
  });

  const start = (currentPage - 1) * limit + 1;
  const end = Math.min(currentPage * limit, total);

  document.getElementById("pagination-info").textContent =
    `${start} à ${end} sur ${total} photos`;

  document.getElementById("prev").disabled = currentPage === 1;
  document.getElementById("next").disabled = end >= total;
}

// ---------------------------
// Pagination
// ---------------------------
document.getElementById("prev").addEventListener("click", () => {
  currentPage--;
  loadPhotoList();
});

document.getElementById("next").addEventListener("click", () => {
  currentPage++;
  loadPhotoList();
});

// ---------------------------
// Recherche photo par URL
// ---------------------------
document.getElementById("search-url-form").addEventListener("submit", async e => {
  e.preventDefault();

  const url = document.getElementById("search-url").value;
  const res = await fetch(`/api/photo-by-url?url=${encodeURIComponent(url)}`);
  const data = await res.json();

  const container = document.getElementById("photo-details");
  container.innerHTML = "";

  if (!res.ok) {
    container.textContent = "❌ Photo introuvable";
    return;
  }

  container.innerHTML = `
    <img src="${data.url}" width="300"><br>
    <strong>URL :</strong> ${data.url}<br>
    <strong>Date :</strong> ${new Date(data.time_photo).toLocaleString()}<br>
    <strong>Focale :</strong> ${data.focale ?? "—"}<br>
    <strong>Obturation :</strong> ${data.obturation ?? "—"}<br>
    <strong>Flash :</strong> ${data.flash}<br>
    <strong>Tag :</strong> ${data.tag ?? "—"}<br>
    <strong>Type :</strong> ${data.type ?? "—"}
  `;
});

// ---------------------------
// 🔧 Recherche matériel (PRÉSENTATION AMÉLIORÉE)
// ---------------------------
document.getElementById("search-mat-form").addEventListener("submit", async e => {
  e.preventDefault();

  const modele = document.getElementById("search-modele").value;
  const numero = document.getElementById("search-numero").value;

  const res = await fetch(
    `/api/materiel?modele_mat=${encodeURIComponent(modele)}&num_mat=${encodeURIComponent(numero)}`
  );

  const data = await res.json();
  const container = document.getElementById("materiel-details");
  container.innerHTML = "";

  if (!res.ok) {
    container.textContent = "❌ Matériel introuvable";
    return;
  }

  // Fonction utilitaire pour dates nulles
  const formatDate = d =>
    d ? new Date(d).toLocaleDateString() : "Pas encore";

  container.innerHTML = `
    <h3>📦 Détails du matériel</h3>
    <ul>
      <li><strong>Modèle :</strong> ${data.modele_mat}</li>
      <li><strong>Numéro de série :</strong> ${data.num_mat}</li>
      <li><strong>Prix :</strong> ${data.prix_mat ?? "Non renseigné"} €</li>
      <li><strong>Poids :</strong> ${data.poids ?? "Non renseigné"} g</li>
      <li><strong>Date d'achat :</strong> ${formatDate(data.date_acq)}</li>
      <li><strong>Date de dernière révision :</strong> ${formatDate(data.date_rev)}</li>
      <li><strong>Date d'arrêt de l'utilisation :</strong> ${formatDate(data.date_rec)}</li>
    </ul>
  `;
});

// ---------------------------
// Toggle liste photos
// ---------------------------
document.getElementById("toggle-photos").addEventListener("click", () => {
  const section = document.getElementById("photo-section");
  section.hidden = !section.hidden;

  if (!section.hidden) {
    currentPage = 1;
    loadPhotoList();
  }
});

// ---------------------------
// Init
// ---------------------------
loadImages();
