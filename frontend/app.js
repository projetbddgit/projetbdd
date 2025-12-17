let photoPage = 1;
let materielPage = 1;
const limit = 10;

// ---------------------------
// Photos aléatoires
// ---------------------------
async function loadImages() {
  const res = await fetch("/api/random-photos");
  const photos = await res.json();
  const gallery = document.getElementById("gallery");
  gallery.innerHTML = "";

  photos.forEach(p => {
    const img = document.createElement("img");
    img.src = p.url;
    img.width = 250;
    gallery.appendChild(img);
  });
}

// ---------------------------
// PHOTOS LISTE
// ---------------------------
async function loadPhotoList() {
  const order = document.getElementById("photo-order").value;
  const res = await fetch(`/api/photos?page=${photoPage}&limit=${limit}&order=${order}`);
  const { photos, total } = await res.json();

  const container = document.getElementById("photo-list");
  container.innerHTML = "";

  photos.forEach(p => {
    container.innerHTML += `
      <p>
        <strong>URL :</strong> ${p.url}<br>
        <strong>Date :</strong> ${new Date(p.time_photo).toLocaleString()}
      </p>
    `;
  });

  document.getElementById("photo-info").textContent =
    `${(photoPage - 1) * limit + 1} à ${Math.min(photoPage * limit, total)} sur ${total}`;
}

// ---------------------------
// MATÉRIEL LISTE
// ---------------------------
async function loadMaterielList() {
  const order = document.getElementById("materiel-order").value;
  const res = await fetch(`/api/materiels?page=${materielPage}&limit=${limit}&order=${order}`);
  const { materiels, total } = await res.json();

  const container = document.getElementById("materiel-list");
  container.innerHTML = "";

  materiels.forEach(m => {
    container.innerHTML += `
      <p>
        <strong>Modèle :</strong> ${m.modele_mat}<br>
        <strong>Numéro :</strong> ${m.num_mat}<br>
        <strong>Date acquisition :</strong> ${new Date(m.date_acq).toLocaleDateString()}
      </p>
    `;
  });

  document.getElementById("materiel-info").textContent =
    `${(materielPage - 1) * limit + 1} à ${Math.min(materielPage * limit, total)} sur ${total}`;
}

// ---------------------------
// MATÉRIEL DÉTAIL
// ---------------------------
document.getElementById("materiel-search-form").addEventListener("submit", async e => {
  e.preventDefault();

  const modele = document.getElementById("modele_mat").value;
  const num = document.getElementById("num_mat").value;

  const res = await fetch(
    `/api/materiel-detail?modele_mat=${encodeURIComponent(modele)}&num_mat=${encodeURIComponent(num)}`
  );

  const data = await res.json();
  const box = document.getElementById("materiel-detail");

  if (!res.ok) {
    box.textContent = "❌ Matériel introuvable";
    return;
  }

  box.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
});

// ---------------------------
// TOGGLES
// ---------------------------
document.getElementById("toggle-photos").onclick = () => {
  const s = document.getElementById("photo-section");
  s.hidden = !s.hidden;
  if (!s.hidden) loadPhotoList();
};

document.getElementById("toggle-materiel").onclick = () => {
  const s = document.getElementById("materiel-section");
  s.hidden = !s.hidden;
  if (!s.hidden) loadMaterielList();
};

// ---------------------------
loadImages();
