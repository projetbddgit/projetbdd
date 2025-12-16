// ---------------------------
//  Charger les photos
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
      img.alt = "Photo aléatoire";
      gallery.appendChild(img);
    });
  } catch (err) {
    console.error("Erreur de chargement :", err);
  }
}

// ---------------------------
//  Ajouter un client
// ---------------------------
const form = document.getElementById("client-form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nom = document.getElementById("nom").value;
  const mail = document.getElementById("mail").value;
  const poste = document.getElementById("poste").value;

  try {
    const res = await fetch("/api/client", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ nom, mail, poste })
    });

    const data = await res.json();

    if (!res.ok) {
      alert("Erreur lors de l'ajout du client");
      console.error(data);
      return;
    }

    alert("Client ajouté avec succès !");
    form.reset();

  } catch (err) {
    console.error("Erreur :", err);
  }
});

// ---------------------------
//  Initialisation
// ---------------------------
loadImages();
