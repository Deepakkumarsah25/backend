const API = "/api/live";

const liveForm = document.getElementById("liveForm");
const liveId = document.getElementById("liveId");

const title = document.getElementById("title");
const description = document.getElementById("description");
const youtubeUrl = document.getElementById("youtubeUrl");
const isLive = document.getElementById("isLive");

const previewImage = document.getElementById("previewImage");
const liveTable = document.getElementById("liveTable");

window.onload = () => {
    loadLives();
};

function getVideoId(url) {

    if (!url) return "";

    const regExp =
        /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|live\/|shorts\/)([^#&?]*).*/;

    const match = url.match(regExp);

    return match && match[2].length === 11
        ? match[2]
        : "";

}

youtubeUrl.addEventListener("input", () => {

    const id = getVideoId(youtubeUrl.value);

    if (id) {

        previewImage.src =
            `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

    }

});

async function loadLives() {

    try {

        const res = await axios.get(API);

        const all = [
            ...res.data.live,
            ...res.data.history
        ];

        renderTable(all);

    }

    catch (err) {

        console.log(err);

    }

}

function renderTable(data) {

    if (!data.length) {

        liveTable.innerHTML =

            `<tr>

<td colspan="4"
class="text-center">

No Live Found

</td>

</tr>`;

        return;

    }

    let html = "";

    data.forEach(item => {

        html +=

            `<tr>

<td>

<img
src="${item.thumbnail}"
>

</td>

<td>

<b>

${item.title}

</b>

<br>

<small>

${item.description || ""}

</small>

</td>

<td>

${item.isLive

                ?

                `<span class="badge badge-live">

LIVE

</span>`

                :

                `<span class="badge badge-off">

Offline

</span>`

            }

</td>

<td>

<button

class="btn btn-warning btn-sm action-btn"

onclick="editLive('${item._id}')"

>

<i class="fa fa-pen">

</i>

</button>

<button

class="btn btn-danger btn-sm action-btn"

onclick="deleteLive('${item._id}')"

>

<i class="fa fa-trash">

</i>

</button>

<button

class="btn ${item.isLive ? "btn-secondary" : "btn-success"}

btn-sm"

onclick="toggleStatus('${item._id}')"

>

${item.isLive ? "End Live" : "Go Live"}

</button>

</td>

</tr>`;

    });

    liveTable.innerHTML = html;

}

liveForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const body = {

        title: title.value,

        description: description.value,

        youtubeUrl: youtubeUrl.value,

        isLive: isLive.checked

    };

    try {

        if (liveId.value === "") {

            await axios.post(API, body);

            alert("Live Added Successfully");

        }

        else {

            await axios.put(

                `${API}/${liveId.value}`,

                body

            );

            alert("Live Updated");

        }

        liveForm.reset();

        liveId.value = "";

        previewImage.src =
            "https://placehold.co/800x450?text=Thumbnail";

        loadLives();

    }

    catch (err) {

        alert(err.response?.data?.message || "Error");

    }

});
/* ===========================================
   Edit Live
=========================================== */

async function editLive(id) {
    try {

        const res = await axios.get(API);

        const all = [
            ...res.data.live,
            ...res.data.history
        ];

        const item = all.find(x => x._id === id);

        if (!item) return;

        liveId.value = item._id;

        title.value = item.title;

        description.value = item.description || "";

        youtubeUrl.value = item.youtubeUrl;

        isLive.checked = item.isLive;

        previewImage.src = item.thumbnail;

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    } catch (err) {

        console.log(err);

    }
}


/* ===========================================
   Delete Live
=========================================== */

async function deleteLive(id) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this live stream?"
    );

    if (!confirmDelete) return;

    try {

        await axios.delete(`${API}/${id}`);

        alert("Live deleted successfully.");

        loadLives();

    } catch (err) {

        alert(
            err.response?.data?.message ||
            "Unable to delete."
        );

    }

}


/* ===========================================
   Toggle Live Status
=========================================== */

async function toggleStatus(id) {

    try {

        await axios.patch(
            `${API}/${id}/status`
        );

        loadLives();

    } catch (err) {

        alert(
            err.response?.data?.message ||
            "Unable to update status."
        );

    }

}


/* ===========================================
   Reset Form
=========================================== */

document
    .getElementById("resetBtn")
    .addEventListener("click", () => {

        liveId.value = "";

        previewImage.src =
            "https://placehold.co/800x450?text=Thumbnail";

        liveForm.reset();

});


/* ===========================================
   Refresh after any action
=========================================== */

document.addEventListener("DOMContentLoaded", () => {
    loadLives();
});