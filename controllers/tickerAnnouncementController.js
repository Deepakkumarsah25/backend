import TickerAnnouncement from "../models/TickerAnnouncement.js";
import TickerAnnouncementMeta from "../models/TickerAnnouncementMeta.js";

const starterItems = [
  { slug: "nishad-aarakshan-mahasammelan", title: "विशाल निषाद आरक्षण महासम्मेलन", tickerText: "🎯 विशाल निषाद आरक्षण महासम्मेलन | 📅 दिनांक: 15 नवम्बर 2026 | 📍 स्थान: गांधी मैदान, पटना → पूरी जानकारी यहाँ देखें", summary: "दिनांक 15 नवम्बर 2026 को गांधी मैदान, पटना में आयोजित विशाल निषाद आरक्षण महासम्मेलन।", content: "दिनांक: 15 नवम्बर 2026\nस्थान: गांधी मैदान, पटना", displayOrder: 1 },
  { slug: "mukesh-sahani-public-dialogue", title: "श्री मुकेश सहनी का जनसंवाद कार्यक्रम", tickerText: "★ 'सन ऑफ मल्लाह' श्री मुकेश सहनी का जनसंवाद कार्यक्रम | 📍 मुजफ्फरपुर → पार्टी से जुड़ने के लिए ऑनलाइन आवेदन करें", summary: "'सन ऑफ मल्लाह' श्री मुकेश सहनी का जनसंवाद कार्यक्रम, मुजफ्फरपुर।", content: "स्थान: मुजफ्फरपुर\nपार्टी से जुड़ने के लिए वेबसाइट पर ऑनलाइन आवेदन करें।", displayOrder: 2 },
  { slug: "jubba-sahani-scholarship", title: "अमर शहीद जुब्बा सहनी मेधा छात्रवृत्ति", tickerText: "🎓 अमर शहीद जुब्बा सहनी मेधा छात्रवृत्ति के लिए ऑनलाइन आवेदन शुरू → अभी आवेदन करें", summary: "अमर शहीद जुब्बा सहनी मेधा छात्रवृत्ति के लिए ऑनलाइन आवेदन।", content: "छात्रवृत्ति के लिए आवेदन करने हेतु वेबसाइट का छात्रवृत्ति फॉर्म भरें।", displayOrder: 3 },
];

let starterSeedPromise;
export async function seedTickerAnnouncements() {
  if (await TickerAnnouncementMeta.exists({ key: "starter-items-v1" })) return;
  if (starterSeedPromise) return starterSeedPromise;
  starterSeedPromise = (async () => {
    await Promise.all(starterItems.map((item) => TickerAnnouncement.updateOne({ slug: item.slug }, { $setOnInsert: item }, { upsert: true })));
    await TickerAnnouncementMeta.updateOne({ key: "starter-items-v1" }, { $setOnInsert: { key: "starter-items-v1" } }, { upsert: true });
  })();
  try {
    await starterSeedPromise;
  } finally {
    starterSeedPromise = null;
  }
}

export async function listTickerAnnouncements(req, res) {
  try {
    await seedTickerAnnouncements();
    const items = await TickerAnnouncement.find().sort({ displayOrder: 1, createdAt: 1 }).lean();
    res.render("website/ticker-announcements", { items, success: req.query.success || "", error: req.query.error || "" });
  } catch (error) {
    console.error("Ticker announcements list error:", error);
    res.status(500).send("Ticker announcements load nahi ho paye.");
  }
}

export async function editTickerAnnouncement(req, res) {
  try {
    const item = req.params.id === "new" ? { tickerText: "", title: "", slug: "", summary: "", content: "", coverImage: "", sections: [], active: true, displayOrder: 0 } : await TickerAnnouncement.findById(req.params.id).lean();
    if (!item) return res.status(404).send("Announcement nahi mila.");
    res.render("website/ticker-announcement-edit", { item, error: req.query.error || "" });
  } catch (error) {
    res.status(400).send("Announcement nahi mila.");
  }
}

const makeSlug = (text) => String(text || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export async function saveTickerAnnouncement(req, res) {
  const editUrl = `/admin/website/ticker-announcements/${req.params.id}/edit`;
  try {
    const { tickerText, title, slug: inputSlug, summary, content, coverImage } = req.body;
    const slug = makeSlug(inputSlug || title);
    if (!tickerText?.trim() || !title?.trim() || !slug) return res.redirect(`${editUrl}?error=${encodeURIComponent("Ticker text, page title aur valid slug zaroori hain.")}`);
    const headings = Array.isArray(req.body.sectionHeading) ? req.body.sectionHeading : [req.body.sectionHeading || ""];
    const contents = Array.isArray(req.body.sectionContent) ? req.body.sectionContent : [req.body.sectionContent || ""];
    const images = Array.isArray(req.body.sectionImage) ? req.body.sectionImage : [req.body.sectionImage || ""];
    const sections = headings.map((heading, i) => ({ heading: String(heading || "").trim(), content: String(contents[i] || "").trim(), imageUrl: String(images[i] || "").trim() })).filter((section) => section.heading || section.content || section.imageUrl);
    const values = { tickerText: tickerText.trim(), title: title.trim(), slug, summary: String(summary || "").trim(), content: String(content || "").trim(), coverImage: String(coverImage || "").trim(), sections, active: req.body.active === "on", displayOrder: Number(req.body.displayOrder) || 0 };
    if (req.params.id === "new") await TickerAnnouncement.create(values);
    else await TickerAnnouncement.findByIdAndUpdate(req.params.id, values, { runValidators: true });
    return res.redirect("/admin/website/ticker-announcements?success=" + encodeURIComponent("Announcement save ho gaya."));
  } catch (error) {
    const message = error.code === 11000 ? "Ye page URL pehle se maujood hai." : error.message;
    return res.redirect(`${editUrl}?error=${encodeURIComponent(message)}`);
  }
}

export async function deleteTickerAnnouncement(req, res) {
  try {
    await TickerAnnouncement.findByIdAndDelete(req.params.id);
    res.redirect("/admin/website/ticker-announcements?success=" + encodeURIComponent("Announcement delete ho gaya."));
  } catch (error) {
    console.error("Ticker announcement delete error:", error);
    res.redirect("/admin/website/ticker-announcements?error=" + encodeURIComponent("Announcement delete nahi ho paya."));
  }
}

export async function publicTickerAnnouncements(req, res) {
  try {
    await seedTickerAnnouncements();
    const items = await TickerAnnouncement.find({ active: true }).select("tickerText title slug displayOrder").sort({ displayOrder: 1, createdAt: 1 }).lean();
    res.set("Cache-Control", "public, max-age=20").json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, data: [] });
  }
}

export async function publicTickerAnnouncement(req, res) {
  try {
    const item = await TickerAnnouncement.findOne({ slug: req.params.slug, active: true }).lean();
    if (!item) return res.status(404).json({ success: false });
    res.set("Cache-Control", "public, max-age=20").json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false });
  }
}
