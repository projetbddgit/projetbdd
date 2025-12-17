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

  if (!document.getElementById("photo-section").hidden) {
    loadPhotoList();
  }
});

// ---------------------------
// Liste photos + tri
// ---------------------------
async function loadPhotoList() {
  const dateMin = document.getElementById("date-min").value;
  const dateMax = document.getElementById("date-max").value;
  const order = document.getElementById("order").value;

  const params = new URLSearchParams();
  if (dateMin) params.append("date_min", dateMin);
  if (dateMax) params.append("date_max", dateMax);
  params.append("order", order);

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
    info.innerHTML = `
      <strong>URL :</strong> ${p.url}<br>
      <strong>Date :</strong> ${new Date(p.time_photo).toLocaleString()}
    `;

    div.appendChild(img);
    div.appendChild(info);
    container.appendChild(div);
  });
}

// ---------------------------
// Toggle affichage
// ---------------------------
document.getElementById("toggle-photos").addEventListener("click", () => {
  const section = document.getElementById("photo-section");
  section.hidden = !section.hidden;

  if (!section.hidden) loadPhotoList();
});

document.getElementById("filter-photos")
  .addEventListener("click", loadPhotoList);

// ---------------------------
// Init
// ---------------------------
loadImages();
