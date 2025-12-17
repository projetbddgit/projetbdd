let currentPage = 1;
let materielPage = 1;
let commandePage = 1;
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

// Pagination photos
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
    <pre>${JSON.stringify(data, null, 2)}</pre>
  `;
});

// ---------------------------
// MATÉRIEL — LISTE
// ---------------------------
async function loadMaterielList() {
  const order = document.getElementById("materiel-order").value;

  const res = await fetch(
    `/api/materiels?page=${materielPage}&limit=${limit}&order=${order}`
  );
  const { materiels, total } = await res.json();

  const container = document.getElementById("materiel-list");
  container.innerHTML = "";

  materiels.forEach(m => {
    container.innerHTML += `
      <p>
        <strong>Modèle :</strong> ${m.modele_mat}<br>
        <strong>Numéro :</strong> ${m.num_mat}<br>
        <strong>Date :</strong> ${new Date(m.date_acq).toLocaleDateString()}
      </p>
    `;
  });

  const start = (materielPage - 1) * limit + 1;
  const end = Math.min(materielPage * limit, total);

  document.getElementById("materiel-info").textContent =
    `${start} à ${end} sur ${total} matériels`;

  document.getElementById("mat-prev").disabled = materielPage === 1;
  document.getElementById("mat-next").disabled = end >= total;
}

document.getElementById("mat-prev").onclick = () => {
  materielPage--;
  loadMaterielList();
};
document.getElementById("mat-next").onclick = () => {
  materielPage++;
  loadMaterielList();
};

// ---------------------------
// MATÉRIEL — DÉTAIL
// ---------------------------
document.getElementById("materiel-search-form").addEventListener("submit", async e => {
  e.preventDefault();

  const modele = document.getElementById("modele_mat").value;
  const num = document.getElementById("num_mat").value;

  const res = await fetch(
    `/api/materiel-detail?modele_mat=${encodeURIComponent(modele)}&num_mat=${encodeURIComponent(num)}`
  );
  const data = await res.json();

  const container = document.getElementById("materiel-detail");
  container.innerHTML = "";

  if (!res.ok) {
    container.textContent = "❌ Matériel introuvable";
    return;
  }

  // --- SEULE MODIFICATION : affichage formaté selon ta demande ---
  container.innerHTML = `
    <strong>Modèle :</strong> ${data.modele_mat}<br>
    <strong>Numéro de série :</strong> ${data.num_mat}<br>
    <strong>Prix :</strong> ${data.prix_mat ?? "Pas encore"}<br>
    <strong>Poids en g :</strong> ${data.poids ?? "Pas encore"}<br>
    <strong>Date d'achat :</strong> ${data.date_acq ? new Date(data.date_acq).toLocaleDateString() : "Pas encore"}<br>
    <strong>Date de dernière révision :</strong> ${data.date_rev ? new Date(data.date_rev).toLocaleDateString() : "Pas encore"}<br>
    <strong>Date d'arrêt de l'utilisation :</strong> ${data.date_rec ? new Date(data.date_rec).toLocaleDateString() : "Pas encore"}
  `;
});

// ---------------------------
// Toggles
// ---------------------------
document.getElementById("toggle-photos").onclick = () => {
  const s = document.getElementById("photo-section");
  s.hidden = !s.hidden;
  if (!s.hidden) {
    currentPage = 1;
    loadPhotoList();
  }
};

document.getElementById("toggle-materiel").onclick = () => {
  const s = document.getElementById("materiel-section");
  s.hidden = !s.hidden;
  if (!s.hidden) {
    materielPage = 1;
    loadMaterielList();
  }
};

// ---------------------------
loadImages();
