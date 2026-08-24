let allFeedbacks = [];


/* =====================================================
   LOAD DASHBOARD
===================================================== */

async function loadDashboard() {

    try {

        await Promise.all([
            loadStats(),
            loadFeedbacks(),
        ]);

    } catch (error) {

        console.error(
            "Dashboard Load Error:",
            error
        );

    }

}


/* =====================================================
   LOAD STATISTICS
===================================================== */

async function loadStats() {

    try {

        const response =
            await fetch(
                "/api/feedback/stats"
            );

        const data =
            await response.json();

        if (!data.success) {
            throw new Error(
                data.message ||
                "Failed to load statistics"
            );
        }

        const stats = data.stats;


        document.getElementById(
            "totalFeedback"
        ).textContent =
            stats.totalFeedback;


        document.getElementById(
            "averageRating"
        ).textContent =
            stats.averageRating;


        document.getElementById(
            "fiveStar"
        ).textContent =
            stats.fiveStar;


        document.getElementById(
            "oneStar"
        ).textContent =
            stats.oneStar;


        setRating(
            5,
            stats.fiveStar,
            stats.totalFeedback
        );

        setRating(
            4,
            stats.fourStar,
            stats.totalFeedback
        );

        setRating(
            3,
            stats.threeStar,
            stats.totalFeedback
        );

        setRating(
            2,
            stats.twoStar,
            stats.totalFeedback
        );

        setRating(
            1,
            stats.oneStar,
            stats.totalFeedback
        );

    } catch (error) {

        console.error(
            "Stats Error:",
            error
        );

    }

}


/* =====================================================
   RATING BAR
===================================================== */

function setRating(
    rating,
    count,
    total
) {

    const countElement =
        document.getElementById(
            `count${rating}`
        );

    const barElement =
        document.getElementById(
            `bar${rating}`
        );

    if (countElement) {
        countElement.textContent =
            count;
    }

    let percentage = 0;

    if (total > 0) {
        percentage =
            (count / total) * 100;
    }

    if (barElement) {
        barElement.style.width =
            `${percentage}%`;
    }

}


/* =====================================================
   LOAD ALL FEEDBACK
===================================================== */

async function loadFeedbacks() {

    const table =
        document.getElementById(
            "feedbackTable"
        );

    table.innerHTML = `
        <tr>
            <td
                colspan="7"
                class="loading"
            >
                Loading feedback...
            </td>
        </tr>
    `;

    try {

        const response =
            await fetch(
                "/api/feedback"
            );

        const data =
            await response.json();

        if (!data.success) {
            throw new Error(
                data.message ||
                "Failed to load feedback"
            );
        }

        allFeedbacks =
            data.feedbacks || [];

        renderFeedbacks(
            allFeedbacks
        );

    } catch (error) {

        console.error(
            "Feedback Load Error:",
            error
        );

        table.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="no-data"
                >
                    Failed to load feedback.
                </td>
            </tr>
        `;
    }

}


/* =====================================================
   RENDER FEEDBACK
===================================================== */

function renderFeedbacks(
    feedbacks
) {

    const table =
        document.getElementById(
            "feedbackTable"
        );

    if (!feedbacks.length) {

        table.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="no-data"
                >
                    <i
                        class="fa-regular fa-comment-dots"
                    ></i>

                    <br><br>

                    No feedback submitted yet.
                </td>
            </tr>
        `;

        return;
    }


    table.innerHTML =
        feedbacks
            .map(
                (item, index) => {

                    const name =
                        escapeHtml(
                            item.name ||
                            "Unknown User"
                        );

                    const email =
                        escapeHtml(
                            item.email ||
                            "-"
                        );

                    const message =
                        escapeHtml(
                            item.message ||
                            ""
                        );

                    const firstLetter =
                        (
                            item.name ||
                            "U"
                        )
                            .charAt(0)
                            .toUpperCase();

                    const stars =
                        "★".repeat(
                            Number(
                                item.rating
                            )
                        ) +
                        "☆".repeat(
                            5 -
                            Number(
                                item.rating
                            )
                        );

                    const date =
                        formatDate(
                            item.createdAt
                        );

                    return `
                        <tr>

                            <td>
                                ${index + 1}
                            </td>

                            <td>

                                <div
                                    class="user-cell"
                                >

                                    <div
                                        class="user-avatar"
                                    >
                                        ${firstLetter}
                                    </div>

                                    <div>

                                        <div
                                            class="user-name"
                                        >
                                            ${name}
                                        </div>

                                    </div>

                                </div>

                            </td>

                            <td>
                                <span class="email">
                                    ${email}
                                </span>
                            </td>

                            <td>

                                <div
                                    class="stars"
                                >
                                    ${stars}
                                </div>

                            </td>

                            <td>

                                <div
                                    class="feedback-text"
                                    title="${message}"
                                >
                                    ${truncateText(
                                        message,
                                        100
                                    )}
                                </div>

                            </td>

                            <td>

                                <span
                                    class="date-text"
                                >
                                    ${date}
                                </span>

                            </td>

                            <td>

                                <div
                                    class="action-buttons"
                                >

                                    <button
                                        class="view-btn"
                                        title="View"
                                        onclick="viewFeedback('${item._id}')"
                                    >
                                        <i
                                            class="fa-solid fa-eye"
                                        ></i>
                                    </button>

                                    <button
                                        class="delete-btn"
                                        title="Delete"
                                        onclick="deleteFeedback('${item._id}')"
                                    >
                                        <i
                                            class="fa-solid fa-trash"
                                        ></i>
                                    </button>

                                </div>

                            </td>

                        </tr>
                    `;
                }
            )
            .join("");
}


/* =====================================================
   SEARCH
===================================================== */

function filterFeedback() {

    const search =
        document
            .getElementById(
                "searchInput"
            )
            .value
            .toLowerCase()
            .trim();

    if (!search) {

        renderFeedbacks(
            allFeedbacks
        );

        return;
    }


    const filtered =
        allFeedbacks.filter(
            (item) => {

                return (

                    item.name
                        ?.toLowerCase()
                        .includes(search)

                    ||

                    item.email
                        ?.toLowerCase()
                        .includes(search)

                    ||

                    item.message
                        ?.toLowerCase()
                        .includes(search)

                );
            }
        );


    renderFeedbacks(
        filtered
    );
}


/* =====================================================
   VIEW FEEDBACK
===================================================== */

function viewFeedback(id) {

    const feedback =
        allFeedbacks.find(
            (item) =>
                item._id === id
        );

    if (!feedback) {
        return;
    }


    const name =
        feedback.name ||
        "Unknown User";


    document.getElementById(
        "modalAvatar"
    ).textContent =
        name
            .charAt(0)
            .toUpperCase();


    document.getElementById(
        "modalName"
    ).textContent =
        name;


    document.getElementById(
        "modalEmail"
    ).textContent =
        feedback.email ||
        "-";


    document.getElementById(
        "modalRating"
    ).textContent =
        "★".repeat(
            Number(
                feedback.rating
            )
        ) +
        "☆".repeat(
            5 -
            Number(
                feedback.rating
            )
        );


    document.getElementById(
        "modalMessage"
    ).textContent =
        feedback.message ||
        "-";


    document.getElementById(
        "modalDate"
    ).textContent =
        formatDate(
            feedback.createdAt
        );


    document
        .getElementById(
            "feedbackModal"
        )
        .classList.add("show");
}


/* =====================================================
   CLOSE MODAL
===================================================== */

function closeModal() {

    document
        .getElementById(
            "feedbackModal"
        )
        .classList.remove(
            "show"
        );
}


/* =====================================================
   DELETE
===================================================== */

async function deleteFeedback(
    id
) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this feedback?"
        );

    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `/api/feedback/${id}`,
                {
                    method: "DELETE",
                }
            );


        const data =
            await response.json();


        if (!data.success) {

            alert(
                data.message ||
                "Failed to delete feedback."
            );

            return;
        }


        alert(
            "Feedback deleted successfully."
        );


        await loadDashboard();

    } catch (error) {

        console.error(
            "Delete Error:",
            error
        );

        alert(
            "Unable to delete feedback."
        );
    }
}


/* =====================================================
   DATE FORMAT
===================================================== */

function formatDate(
    date
) {

    if (!date) {
        return "-";
    }

    const d =
        new Date(date);

    return d.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }
    );
}


/* =====================================================
   TRUNCATE TEXT
===================================================== */

function truncateText(
    text,
    length
) {

    if (!text) {
        return "";
    }

    if (text.length <= length) {
        return text;
    }

    return (
        text.substring(
            0,
            length
        ) + "..."
    );
}


/* =====================================================
   HTML ESCAPE
===================================================== */

function escapeHtml(
    text
) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        text;

    return div.innerHTML;
}


/* =====================================================
   CLOSE MODAL OUTSIDE CLICK
===================================================== */

window.addEventListener(
    "click",
    (event) => {

        const modal =
            document.getElementById(
                "feedbackModal"
            );

        if (
            event.target === modal
        ) {
            closeModal();
        }
    }
);


/* =====================================================
   START
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadDashboard();

    }
);