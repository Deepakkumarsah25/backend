const API_BASE = "/api/albums";

let photoCount = 0;

const albumForm = document.getElementById("albumForm");
const albumId = document.getElementById("albumId");
const titleInput = document.getElementById("title");
const descriptionInput = document.getElementById("description");
const categoryInput = document.getElementById("category");
const locationInput = document.getElementById("location");
const dateInput = document.getElementById("date");
const coverInput = document.getElementById("cover");
const previewImage = document.getElementById("previewImage");
const photosContainer = document.getElementById("photosContainer");
const addPhotoBtn = document.getElementById("addPhotoBtn");
const albumTable = document.getElementById("albumTable");
const resetBtn = document.getElementById("resetBtn");

/* ===========================================
   Add a photo URL input row
=========================================== */
function addPhotoRow(value = "") {
  photoCount++;

  const row = document.createElement("div");
  row.className = "photo-row";
  row.innerHTML = `
    <input type="text" class="form-control photo-url" placeholder="https://..." value="${value}">
    <button type="button" class="btn-remove-photo">
      <i class="fa-solid fa-trash"></i>
    </button>
  `;

  row.querySelector(".btn-remove-photo").addEventListener("click", () => {
    row.remove();
  });

  photosContainer.appendChild(row);
}

addPhotoBtn.addEventListener("click", () => addPhotoRow());

/* ===========================================
   Cover live preview
=========================================== */
coverInput.addEventListener("input", () => {
  previewImage.src = coverInput.value || "https://placehold.co/800x450?text=Cover+Image";
});

/* ===========================================
   Fetch & render all albums
=========================================== */
async function loadAlbums() {
  try {
    const res = await axios.get(API_BASE);

    if (res.data.success) {
      renderTable(res.data.data);
    }
  } catch (err) {
    console.error(err);
    albumTable.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Failed to load albums</td></tr>`;
  }
}

function renderTable(albums) {
  if (!albums.length) {
    albumTable.innerHTML = `<tr><td colspan="6" class="text-center">No albums found</td></tr>`;
    return;
  }

  albumTable.innerHTML = albums
    .map(
      (a) => `
      <tr>
        <td><img src="${a.cover}" alt=""></td>
        <td>${a.title}</td>
        <td>${a.category}</td>
        <td>${a.photos ? a.photos.length : 0}</td>
        <td>
          <span class="${a.isPublished ? "badge-live" : "badge-off"}">
            ${a.isPublished ? "Published" : "Hidden"}
          </span>
        </td>
        <td>
          <button class="action-btn btn-outline-primary edit-btn" data-id="${a._id}">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="action-btn btn-outline-danger delete-btn" data-id="${a._id}">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `
    )
    .join("");

  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", () => editAlbum(btn.dataset.id, albums));
  });

  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => deleteAlbum(btn.dataset.id));
  });
}

/* ===========================================
   Edit — fill form
=========================================== */
function editAlbum(id, albums) {
  const album = albums.find((a) => a._id === id);
  if (!album) return;

  albumId.value = album._id;
  titleInput.value = album.title;
  descriptionInput.value = album.description || "";
  categoryInput.value = album.category;
  locationInput.value = album.location || "";
  dateInput.value = album.date ? album.date.substring(0, 10) : "";
  coverInput.value = album.cover;
  previewImage.src = album.cover;

  photosContainer.innerHTML = "";
  (album.photos || []).forEach((url) => addPhotoRow(url));

  document.getElementById("isPublished").checked = album.isPublished;

  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ===========================================
   Delete
=========================================== */
async function deleteAlbum(id) {
  if (!confirm("Delete this album?")) return;

  try {
    await axios.delete(`${API_BASE}/${id}`);
    loadAlbums();
  } catch (err) {
    console.error(err);
    alert("Failed to delete album");
  }
}

/* ===========================================
   Create / Update — form submit
=========================================== */
albumForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const photos = Array.from(
    document.querySelectorAll(".photo-url")
  )
    .map((input) => input.value.trim())
    .filter((url) => url.length > 0);

  const payload = {
    title: titleInput.value,
    description: descriptionInput.value,
    category: categoryInput.value,
    location: locationInput.value,
    date: dateInput.value,
    cover: coverInput.value,
    photos,
    isPublished: document.getElementById("isPublished").checked,
  };

  try {
    if (albumId.value) {
      await axios.put(`${API_BASE}/${albumId.value}`, payload);
    } else {
      await axios.post(API_BASE, payload);
    }

    albumForm.reset();
    albumId.value = "";
    photosContainer.innerHTML = "";
    previewImage.src = "https://placehold.co/800x450?text=Cover+Image";

    loadAlbums();
  } catch (err) {
    console.error(err);
    alert(err.response?.data?.message || "Failed to save album");
  }
});

resetBtn.addEventListener("click", () => {
  albumId.value = "";
  photosContainer.innerHTML = "";
  previewImage.src = "https://placehold.co/800x450?text=Cover+Image";
});

loadAlbums();