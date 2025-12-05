async function loadImages() {
  try {
    const res = await fetch("/random-photos");
    const photos = await res.json();

    const gallery = document.getElementById("gallery");
    gallery.innerHTML = "";

    photos.forEach(photo => {
      const img = document.createElement("img");
      img.src = photo.url;  // ta colonne Supabase 'url'
      gallery.appendChild(img);
    });
  } catch (err) {
    console.error("Erreur de chargement :", err);
  }
}

loadImages();
