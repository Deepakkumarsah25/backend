import mongoose from "mongoose";
import NotificationCampaign from "../../models/notification/NotificationCampaign.js";
import UserNotification from "../../models/notification/UserNotification.js";
import { publishCampaign } from "../../services/notificationCampaignService.js";
import { repairLegacyNotificationText } from "../../services/notificationText.js";

const CATEGORIES = ["announcements", "events", "tracking", "membership", "general", "promotional", "wishes"];
const AUDIENCES = ["all", "members", "agents", "users"];
const ADMIN_SECTIONS = {
  normal: { type: "general", title: "Normal Updates", description: "Important party and app updates for users." },
  promotional: { type: "promotional", title: "Promotional Notifications", description: "Campaigns, outreach, and promotional messages." },
  wishes: { type: "wishes", title: "Wishes & Greetings", description: "Send festival, birthday, and celebratory greetings." },
};

export const renderNotificationAdminPage = (req, res) => {
  const section = ADMIN_SECTIONS[req.params.section];
  if (!section) return res.sendStatus(404);
  return res.render("notificationAdmin", { sectionKey: req.params.section, section });
};

const isSafeLink = (value, { allowRelative = true } = {}) => {
  if (!value) return true;
  if (allowRelative && value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
};
const normalizeCampaign = (body = {}) => {
  const { title, message, body: messageBody, type, image, imageUrl, deepLink, actionType, actionUrl, relatedId, metadata, audience, scheduledAt } = body;
  const normalized = {
    title: typeof title === "string" ? repairLegacyNotificationText(title.trim()) : "",
    message: typeof (message ?? messageBody) === "string" ? repairLegacyNotificationText((message ?? messageBody).trim()) : "",
    type: type || "general",
    image: image ?? imageUrl ?? "",
    deepLink: deepLink || "",
    actionType: actionType || "none",
    actionUrl: actionUrl || "",
    relatedId: relatedId || null,
    metadata: metadata && typeof metadata === "object" && !Array.isArray(metadata) ? metadata : {},
    audience: audience || { type: "all", userIds: [] },
    scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
  };
  if (!normalized.title || normalized.title.length > 160 || !normalized.message || normalized.message.length > 5000) return { error: "Title and message are required and must be within their length limits." };
  if (!CATEGORIES.includes(normalized.type)) return { error: "Invalid notification category." };
  if (!AUDIENCES.includes(normalized.audience.type)) return { error: "Invalid target audience." };
  if (normalized.relatedId && !mongoose.Types.ObjectId.isValid(normalized.relatedId)) return { error: "Invalid related ID." };
  if (typeof normalized.actionUrl !== "string" || normalized.actionUrl.length > 2048 || typeof normalized.actionType !== "string" || normalized.actionType.length > 80) return { error: "Invalid notification action." };
  if (JSON.stringify(normalized.metadata).length > 20_000) return { error: "Notification metadata is too large." };
  if (typeof normalized.image !== "string" || normalized.image.length > 2048 || typeof normalized.deepLink !== "string" || normalized.deepLink.length > 2048) return { error: "Image and deep link values must be strings within 2048 characters." };
  if (!isSafeLink(normalized.deepLink) || !isSafeLink(normalized.actionUrl, { allowRelative: false }) || !isSafeLink(normalized.image, { allowRelative: false })) return { error: "Notification links must use an app-relative path or HTTP(S) URL." };
  if (!Array.isArray(normalized.audience.userIds) || normalized.audience.userIds.length > 5000 || normalized.audience.userIds.some((id) => !mongoose.Types.ObjectId.isValid(id))) return { error: "Target user list is invalid." };
  if (normalized.audience.type !== "users") normalized.audience.userIds = [];
  if (normalized.scheduledAt && !Number.isFinite(normalized.scheduledAt.getTime())) return { error: "Invalid scheduled time." };
  return { value: normalized };
};

const actorId = (req) => String(req.session.admin._id);

export const createCampaignDraft = async (req, res) => {
  const normalized = normalizeCampaign(req.body);
  if (normalized.error) return res.status(400).json({ success: false, message: normalized.error });
  try {
    const campaign = await NotificationCampaign.create({ ...normalized.value, createdBy: actorId(req), status: "draft" });
    return res.status(201).json({ success: true, campaign });
  } catch {
    return res.status(500).json({ success: false, message: "Could not create campaign draft." });
  }
};

export const updateCampaignDraft = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: "Invalid campaign ID." });
  const normalized = normalizeCampaign(req.body);
  if (normalized.error) return res.status(400).json({ success: false, message: normalized.error });
  try {
    const campaign = await NotificationCampaign.findOneAndUpdate(
      { _id: req.params.id, status: "draft" },
      { $set: normalized.value },
      { new: true, runValidators: true },
    );
    if (!campaign) return res.status(404).json({ success: false, message: "Draft campaign not found." });
    return res.json({ success: true, campaign });
  } catch {
    return res.status(500).json({ success: false, message: "Could not update campaign draft." });
  }
};

export const publishCampaignAdmin = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: "Invalid campaign ID." });
  try {
    const campaign = await NotificationCampaign.findOne({ _id: req.params.id, status: { $in: ["draft", "failed"] } });
    if (!campaign) return res.status(404).json({ success: false, message: "Draft campaign not found." });
    if (req.body?.scheduledAt) {
      const scheduledAt = new Date(req.body.scheduledAt);
      if (!Number.isFinite(scheduledAt.getTime()) || scheduledAt <= new Date()) return res.status(400).json({ success: false, message: "Scheduled time must be in the future." });
      campaign.status = "scheduled";
      campaign.scheduledAt = scheduledAt;
      await campaign.save();
      return res.json({ success: true, campaign, scheduled: true });
    }
    await NotificationCampaign.updateOne({ _id: campaign._id, status: { $in: ["draft", "failed"] } }, { $set: { status: "scheduled", scheduledAt: new Date() } });
    void publishCampaign(campaign._id).catch((error) => {
      console.error("Admin notification campaign failed.", error?.message || "unknown error");
    });
    const published = await NotificationCampaign.findById(campaign._id).lean();
    return res.status(202).json({ success: true, campaign: published, message: "Campaign publishing has started." });
  } catch {
    return res.status(500).json({ success: false, message: "Campaign publishing failed. Check campaign status and retry if needed." });
  }
};

export const listCampaigns = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 25));
    const [campaigns, total] = await Promise.all([
      NotificationCampaign.find().sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      NotificationCampaign.countDocuments(),
    ]);
    const campaignIds = campaigns.map((campaign) => campaign._id);
    const progressRows = campaignIds.length ? await UserNotification.aggregate([
      { $match: { campaignId: { $in: campaignIds } } },
      { $group: {
        _id: "$campaignId",
        inAppCreated: { $sum: 1 },
        pushSent: { $sum: "$pushSuccessCount" },
        pushFailed: { $sum: "$pushFailureCount" },
        pushSkipped: { $sum: { $cond: [{ $eq: ["$deliveryStatus", "skipped"] }, 1, 0] } },
      } },
    ]) : [];
    const progressByCampaign = new Map(progressRows.map((row) => [String(row._id), row]));
    const campaignsWithProgress = campaigns.map((campaign) => ({
      ...campaign,
      title: repairLegacyNotificationText(campaign.title),
      message: repairLegacyNotificationText(campaign.message),
      liveDeliveryStats: progressByCampaign.get(String(campaign._id)) || { inAppCreated: 0, pushSent: 0, pushFailed: 0, pushSkipped: 0 },
    }));
    return res.json({ success: true, campaigns: campaignsWithProgress, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch {
    return res.status(500).json({ success: false, message: "Could not load notification campaigns." });
  }
};

export const getCampaignStats = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: "Invalid campaign ID." });
  try {
    const campaign = await NotificationCampaign.findById(req.params.id).select("status deliveryStats lastError createdAt publishedAt scheduledAt").lean();
    if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found." });
    const [liveDeliveryStats] = await UserNotification.aggregate([
      { $match: { campaignId: new mongoose.Types.ObjectId(req.params.id) } },
      { $group: {
        _id: null,
        inAppCreated: { $sum: 1 },
        pushSent: { $sum: "$pushSuccessCount" },
        pushFailed: { $sum: "$pushFailureCount" },
        pushSkipped: { $sum: { $cond: [{ $eq: ["$deliveryStatus", "skipped"] }, 1, 0] } },
      } },
    ]);
    return res.json({ success: true, campaignId: req.params.id, status: campaign.status, deliveryStats: campaign.deliveryStats, liveDeliveryStats: liveDeliveryStats || { inAppCreated: 0, pushSent: 0, pushFailed: 0, pushSkipped: 0 }, lastError: campaign.lastError, createdAt: campaign.createdAt, publishedAt: campaign.publishedAt, scheduledAt: campaign.scheduledAt });
  } catch {
    return res.status(500).json({ success: false, message: "Could not load campaign statistics." });
  }
};

export const cancelScheduledCampaign = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: "Invalid campaign ID." });
  try {
    const campaign = await NotificationCampaign.findOneAndUpdate(
      { _id: req.params.id, status: "scheduled" },
      { $set: { status: "cancelled" } },
      { new: true },
    );
    if (!campaign) return res.status(409).json({ success: false, message: "Campaign is not scheduled or has already started." });
    return res.json({ success: true, campaign });
  } catch {
    return res.status(500).json({ success: false, message: "Could not cancel campaign." });
  }
};
