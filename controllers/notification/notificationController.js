import Notification from "../../models/Notification.js";


// =====================================================
// GET ALL NOTIFICATIONS
// =====================================================

export const getNotifications = async (req, res) => {
  try {

    const userId = req.user?._id || null;

    let filter;

    if (userId) {

      filter = {
        $or: [
          { userId: userId },
          { userId: null }
        ]
      };

    } else {

      filter = {
        userId: null
      };

    }

    const notifications =
      await Notification.find(filter)
        .sort({
          createdAt: -1
        })
        .lean();

    const unreadCount =
      notifications.filter(
        (item) => !item.isRead
      ).length;

    res.status(200).json({

      success: true,

      notifications,

      unreadCount,

    });

  } catch (error) {

    console.error(
      "Get Notifications Error:",
      error
    );

    res.status(500).json({

      success: false,

      message:
        "Failed to get notifications",

    });

  }
};



// =====================================================
// GET UNREAD COUNT
// =====================================================

export const getUnreadCount = async (
  req,
  res
) => {

  try {

    const userId =
      req.user?._id || null;

    let filter;

    if (userId) {

      filter = {
        isRead: false,

        $or: [
          { userId: userId },
          { userId: null }
        ]
      };

    } else {

      filter = {
        isRead: false,
        userId: null
      };

    }

    const unreadCount =
      await Notification.countDocuments(
        filter
      );

    res.status(200).json({

      success: true,

      unreadCount,

    });

  } catch (error) {

    console.error(
      "Unread Count Error:",
      error
    );

    res.status(500).json({

      success: false,

      message:
        "Failed to get unread count",

    });

  }
};



// =====================================================
// MARK ONE NOTIFICATION AS READ
// =====================================================

export const markNotificationRead =
  async (req, res) => {

    try {

      const { id } = req.params;

      const notification =
        await Notification.findByIdAndUpdate(

          id,

          {
            $set: {
              isRead: true
            }
          },

          {
            new: true
          }

        );

      if (!notification) {

        return res.status(404).json({

          success: false,

          message:
            "Notification not found",

        });

      }

      res.status(200).json({

        success: true,

        message:
          "Notification marked as read",

        notification,

      });

    } catch (error) {

      console.error(
        "Mark Read Error:",
        error
      );

      res.status(500).json({

        success: false,

        message:
          "Failed to mark notification",

      });

    }
  };



// =====================================================
// MARK ALL AS READ
// =====================================================

export const markAllNotificationsRead =
  async (req, res) => {

    try {

      const userId =
        req.user?._id || null;

      let filter;

      if (userId) {

        filter = {
          isRead: false,

          $or: [
            { userId: userId },
            { userId: null }
          ]
        };

      } else {

        filter = {
          isRead: false,
          userId: null
        };

      }

      await Notification.updateMany(

        filter,

        {
          $set: {
            isRead: true
          }
        }

      );

      res.status(200).json({

        success: true,

        message:
          "All notifications marked as read",

      });

    } catch (error) {

      console.error(
        "Mark All Read Error:",
        error
      );

      res.status(500).json({

        success: false,

        message: "Failed",

      });

    }
  };



// =====================================================
// DELETE NOTIFICATION
// =====================================================

export const deleteNotification =
  async (req, res) => {

    try {

      const { id } = req.params;

      const notification =
        await Notification.findByIdAndDelete(
          id
        );

      if (!notification) {

        return res.status(404).json({

          success: false,

          message:
            "Notification not found",

        });

      }

      res.status(200).json({

        success: true,

        message:
          "Notification deleted",

      });

    } catch (error) {

      console.error(
        "Delete Notification Error:",
        error
      );

      res.status(500).json({

        success: false,

        message:
          "Failed to delete notification",

      });

    }
  };