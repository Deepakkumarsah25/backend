import Event from "../../models/events/Event.js";
import fs from "fs";
import path from "path";

const removeFile = (fileUrl) => {
  if (!fileUrl) return;

  try {
    const relativePath =
      fileUrl.replace(/^\/+/, "");

    const filePath = path.join(
      process.cwd(),
      relativePath
    );

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.log(
      "EVENT IMAGE DELETE ERROR:",
      error.message
    );
  }
};

const removeImages = (images = []) => {
  images.forEach((image) => {
    removeFile(image);
  });
};

/* =========================
   ADMIN LIST
========================= */

export const getAdminEvents = async (
  req,
  res
) => {
  try {
    const events = await Event.find()
      .sort({
        eventDate: -1,
        createdAt: -1,
      })
      .lean();

    res.render("events/Event", {
      events,
      message: null,
      error: null,
    });
  } catch (error) {
    console.log(
      "GET ADMIN EVENTS ERROR:",
      error
    );

    res.status(500).render(
      "events/Event",
      {
        events: [],
        message: null,
        error: "Unable to load events.",
      }
    );
  }
};

/* =========================
   CREATE EVENT
========================= */

export const createEvent = async (
  req,
  res
) => {
  try {
    const {
      title,
      description,
      location,
      eventDate,
      eventTime,
      tag,
      tagColor,
      published,
      featured,
    } = req.body;

    if (!title?.trim()) {
      return res
        .status(400)
        .send(
          "Event title is required."
        );
    }

    if (!location?.trim()) {
      return res
        .status(400)
        .send(
          "Event location is required."
        );
    }

    if (!eventDate) {
      return res
        .status(400)
        .send(
          "Event date is required."
        );
    }

    const images = (req.files || []).map(
      (file) =>
        `/uploads/events/${file.filename}`
    );

    if (images.length > 10) {
      removeImages(images);

      return res
        .status(400)
        .send(
          "Maximum 10 images are allowed."
        );
    }

    await Event.create({
      title: title.trim(),

      description:
        description?.trim() || "",

      location:
        location.trim(),

      eventDate:
        new Date(eventDate),

      eventTime:
        eventTime?.trim() || "",

      tag:
        tag?.trim() || "Event",

      tagColor:
        tagColor || "#1d4ed8",

      images,

      published:
        published === "on" ||
        published === "true" ||
        published === "1",

      featured:
        featured === "on" ||
        featured === "true" ||
        featured === "1",
    });

    res.redirect(
      "/admin/events"
    );
  } catch (error) {
    console.log(
      "CREATE EVENT ERROR:",
      error
    );

    if (req.files) {
      req.files.forEach((file) => {
        removeFile(
          `/uploads/events/${file.filename}`
        );
      });
    }

    res.status(500).send(
      error.message ||
        "Unable to create event."
    );
  }
};

/* =========================
   EDIT PAGE
========================= */

export const getEditEvent = async (
  req,
  res
) => {
  try {
    const event =
      await Event.findById(
        req.params.id
      ).lean();

    if (!event) {
      return res
        .status(404)
        .send(
          "Event not found."
        );
    }

    res.render(
      "events/edit",
      {
        event,
        error: null,
      }
    );
  } catch (error) {
    console.log(
      "GET EDIT EVENT ERROR:",
      error
    );

    res
      .status(500)
      .send(
        "Unable to load event."
      );
  }
};

/* =========================
   UPDATE EVENT
========================= */

export const updateEvent = async (
  req,
  res
) => {
  try {
    const event =
      await Event.findById(
        req.params.id
      );

    if (!event) {
      return res
        .status(404)
        .send(
          "Event not found."
        );
    }

    const {
      title,
      description,
      location,
      eventDate,
      eventTime,
      tag,
      tagColor,
      published,
      featured,
    } = req.body;

    if (!title?.trim()) {
      return res
        .status(400)
        .send(
          "Event title is required."
        );
    }

    if (!location?.trim()) {
      return res
        .status(400)
        .send(
          "Event location is required."
        );
    }

    if (!eventDate) {
      return res
        .status(400)
        .send(
          "Event date is required."
        );
    }

    event.title =
      title.trim();

    event.description =
      description?.trim() || "";

    event.location =
      location.trim();

    event.eventDate =
      new Date(eventDate);

    event.eventTime =
      eventTime?.trim() || "";

    event.tag =
      tag?.trim() || "Event";

    event.tagColor =
      tagColor || "#1d4ed8";

    event.published =
      published === "on" ||
      published === "true" ||
      published === "1";

    event.featured =
      featured === "on" ||
      featured === "true" ||
      featured === "1";

    /*
      If new images are uploaded,
      replace the old gallery.
    */

    if (
      req.files &&
      req.files.length > 0
    ) {
      const oldImages =
        event.images || [];

      const newImages =
        req.files.map(
          (file) =>
            `/uploads/events/${file.filename}`
        );

      if (newImages.length > 10) {
        removeImages(
          newImages
        );

        return res
          .status(400)
          .send(
            "Maximum 10 images are allowed."
          );
      }

      event.images =
        newImages;

      await event.save();

      removeImages(
        oldImages
      );

      return res.redirect(
        "/admin/events"
      );
    }

    await event.save();

    res.redirect(
      "/admin/events"
    );
  } catch (error) {
    console.log(
      "UPDATE EVENT ERROR:",
      error
    );

    if (req.files) {
      req.files.forEach(
        (file) => {
          removeFile(
            `/uploads/events/${file.filename}`
          );
        }
      );
    }

    res.status(500).send(
      error.message ||
        "Unable to update event."
    );
  }
};

/* =========================
   DELETE
========================= */

export const deleteEvent = async (
  req,
  res
) => {
  try {
    const event =
      await Event.findByIdAndDelete(
        req.params.id
      );

    if (!event) {
      return res
        .status(404)
        .send(
          "Event not found."
        );
    }

    removeImages(
      event.images || []
    );

    res.redirect(
      "/admin/events"
    );
  } catch (error) {
    console.log(
      "DELETE EVENT ERROR:",
      error
    );

    res
      .status(500)
      .send(
        "Unable to delete event."
      );
  }
};

/* =========================
   MOBILE - ALL
========================= */

export const getPublishedEvents =
  async (req, res) => {
    try {
      const events =
        await Event.find({
          published: true,
        })
          .sort({
            eventDate: 1,
            createdAt: -1,
          })
          .lean();

      res.json({
        success: true,
        count: events.length,
        events,
      });
    } catch (error) {
      console.log(
        "GET PUBLISHED EVENTS ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to fetch events.",
        events: [],
      });
    }
  };

/* =========================
   MOBILE - SINGLE
========================= */

export const getEventById =
  async (req, res) => {
    try {
      const event =
        await Event.findOne({
          _id: req.params.id,
          published: true,
        }).lean();

      if (!event) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Event not found.",
          });
      }

      res.json({
        success: true,
        event,
      });
    } catch (error) {
      console.log(
        "GET EVENT BY ID ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to fetch event.",
      });
    }
  };