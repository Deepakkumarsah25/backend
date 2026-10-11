import Join from "../models/joinmodel.js";
import { uploadToCloudinary } from "../config/cloudinary.js";
import { generateMemberId } from "../services/memberId.js";

/*******************************************************
 * CONSTANTS
 *******************************************************/

const MEMBER_LIMIT_WITHOUT_AGENT = 5;

// My Members API maximum page size
const MAX_PAGE_LIMIT = 10;

// Maximum search characters
const MAX_SEARCH_LENGTH = 50;



const escapeRegex = (value = "") => {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
};


/*******************************************************
 * ADD MEMBER
 *
 * POST /api/join/add-member
 *******************************************************/

export const addMemberByAgent = async (
  req,
  res
) => {
  try {
    const agentUser = req.user;

    if (!agentUser?._id) {
      return res.status(401).json({
        success: false,
        message: "Login required.",
      });
    }

    /***************************************************
     * NON-AGENT LIMIT
     ***************************************************/

    if (!agentUser.isAgent) {
      const addedCount =
        await Join.countDocuments({
          addedBy: agentUser._id,
        });

      if (
        addedCount >=
        MEMBER_LIMIT_WITHOUT_AGENT
      ) {
        return res.status(403).json({
          success: false,
          code:
            "AGENT_VERIFICATION_REQUIRED",
          message:
            `You've added ${MEMBER_LIMIT_WITHOUT_AGENT} members. Please request agent verification to add more.`,
        });
      }
    }

    /***************************************************
     * FORM DATA
     ***************************************************/

    const {
      fullName,
      mobile,
      state,
      district,
    } = req.body;

    if (!fullName?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Full name is required.",
      });
    }

    if (
      !/^[6-9]\d{9}$/.test(
        mobile || ""
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Enter a valid 10-digit mobile number.",
      });
    }

    /***************************************************
     * DUPLICATE MOBILE
     ***************************************************/

    const existing =
      await Join.findOne({
        mobile: mobile.trim(),
      });

    if (existing) {
      return res.status(409).json({
        success: false,
        message:
          "A member with this mobile number already exists.",
        memberId:
          existing.memberId,
      });
    }

    /***************************************************
     * PHOTO
     ***************************************************/

    let photoPath = "";

    if (req.file) {
      const result =
        await uploadToCloudinary(
          req.file.buffer
        );

      photoPath =
        result.secure_url;
    }

    /***************************************************
     * MEMBER ID
     ***************************************************/

    const memberId =
      await generateMemberId();

    /***************************************************
     * CREATE
     ***************************************************/

    const application =
      await Join.create({
        mode: "quick",
        type: "quick_member",
        memberId,
        profilePhoto: photoPath,
        fullName:
          fullName.trim(),
        mobile:
          mobile.trim(),
        state: state || "",
        district:
          district || "",
        declarationAccepted:
          true,
        addedBy:
          agentUser._id,
      });

    return res.status(201).json({
      success: true,
      message:
        "Member added successfully.",
      memberId:
        application.memberId,
      data:
        application,
    });
  } catch (err) {
    console.error(
      "addMemberByAgent error:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong.",
    });
  }
};


/*******************************************************
 * MY ADDED MEMBERS
 *
 * GET /api/join/my-added-members
 *
 * IMPORTANT:
 *
 * Only 10 records are returned per request.
 *
 * Example:
 *
 * page=1 -> 10 records
 * page=2 -> next 10
 * page=3 -> next 10
 *
 * Search happens directly in MongoDB.
 *******************************************************/

export const getMyAddedMembers = async (
  req,
  res
) => {
  try {
    const agentId =
      req.user?._id;

    if (!agentId) {
      return res.status(401).json({
        success: false,
        message:
          "Login required.",
      });
    }

    let {
      search = "",
      page = 1,
      limit = 10,
    } = req.query;

    /***************************************************
     * PAGE
     ***************************************************/

    const pageNum = Math.max(
      parseInt(page, 10) || 1,
      1
    );

    /***************************************************
     * LIMIT
     *
     * Maximum is always 10.
     ***************************************************/

    const requestedLimit =
      parseInt(limit, 10) || 10;

    const limitNum = Math.min(
      Math.max(
        requestedLimit,
        1
      ),
      MAX_PAGE_LIMIT
    );

    /***************************************************
     * SEARCH
     *
     * Trim + maximum 50 characters.
     ***************************************************/

    const cleanSearch =
      String(search || "")
        .trim()
        .slice(
          0,
          MAX_SEARCH_LENGTH
        );

    /***************************************************
     * BASE QUERY
     ***************************************************/

    const query = {
      addedBy: agentId,
    };

    /***************************************************
     * SEARCH QUERY
     ***************************************************/

    if (cleanSearch) {
      const escapedSearch =
        escapeRegex(
          cleanSearch
        );

      const regex =
        new RegExp(
          escapedSearch,
          "i"
        );

      query.$or = [
        {
          fullName: regex,
        },
        {
          mobile: regex,
        },
        {
          memberId: regex,
        },
        {
          district: regex,
        },
        {
          state: regex,
        },
      ];
    }

    /***************************************************
     * SKIP
     ***************************************************/

    const skip =
      (pageNum - 1) *
      limitNum;

    /***************************************************
     * ONLY LIST FIELDS
     *
     * Don't return the entire MongoDB document.
     ***************************************************/

    const listProjection = {
      _id: 0,
      memberId: 1,
      fullName: 1,
      mobile: 1,
      state: 1,
      district: 1,
      profilePhoto: 1,
      createdAt: 1,
    };

    /***************************************************
     * DATABASE REQUEST
     ***************************************************/

    const [
      members,
      total,
    ] = await Promise.all([
      Join.find(query)
        .select(
          listProjection
        )
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limitNum)
        .lean(),

      Join.countDocuments(
        query
      ),
    ]);

    /***************************************************
     * PAGINATION
     ***************************************************/

    const totalPages =
      Math.ceil(
        total / limitNum
      );

    const hasNextPage =
      pageNum < totalPages;

    /***************************************************
     * RESPONSE
     ***************************************************/

    return res.status(200).json({
      success: true,

      data: members,

      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,

        hasNextPage,

        hasPreviousPage:
          pageNum > 1,
      },

      isAgent:
        !!req.user.isAgent,

      remainingSlots:
        req.user.isAgent
          ? null
          : Math.max(
              MEMBER_LIMIT_WITHOUT_AGENT -
                total,
              0
            ),

      referralCode:
        req.user.referralCode ||
        null,
    });
  } catch (err) {
    console.error(
      "getMyAddedMembers error:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch members.",
    });
  }
};


/*******************************************************
 * ADMIN — LIST
 *******************************************************/

export const getAllJoinApplications =
  async (
    req,
    res
  ) => {
    try {
      const {
        search = "",
        page = 1,
        limit = 20,
      } = req.query;

      const query = {};

      const cleanSearch =
        String(search || "")
          .trim()
          .slice(
            0,
            MAX_SEARCH_LENGTH
          );

      if (cleanSearch) {
        const escapedSearch =
          escapeRegex(
            cleanSearch
          );

        const regex =
          new RegExp(
            escapedSearch,
            "i"
          );

        query.$or = [
          {
            fullName: regex,
          },
          {
            mobile: regex,
          },
          {
            memberId: regex,
          },
          {
            district: regex,
          },
          {
            state: regex,
          },
        ];
      }

      const pageNum =
        Math.max(
          parseInt(
            page,
            10
          ) || 1,
          1
        );

      const limitNum =
        Math.min(
          Math.max(
            parseInt(
              limit,
              10
            ) || 20,
            1
          ),
          100
        );

      const skip =
        (pageNum - 1) *
        limitNum;

      const [
        applications,
        total,
      ] = await Promise.all([
        Join.find(query)
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limitNum)
          .lean(),

        Join.countDocuments(
          query
        ),
      ]);

      return res.status(200).json({
        success: true,

        data: applications,

        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages:
            Math.ceil(
              total /
                limitNum
            ),
        },
      });
    } catch (err) {
      console.error(
        "getAllJoinApplications error:",
        err
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch applications.",
      });
    }
  };


/*******************************************************
 * ADMIN — GET BY ID
 *******************************************************/

export const getJoinApplicationById =
  async (
    req,
    res
  ) => {
    try {
      const application =
        await Join.findById(
          req.params.id
        );

      if (!application) {
        return res.status(404).json({
          success: false,
          message:
            "Application not found.",
        });
      }

      return res.status(200).json({
        success: true,
        data: application,
      });
    } catch (err) {
      console.error(
        "getJoinApplicationById error:",
        err
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch application.",
      });
    }
  };


/*******************************************************
 * ADMIN — DELETE
 *******************************************************/

export const deleteJoinApplication =
  async (
    req,
    res
  ) => {
    try {
      const application =
        await Join.findByIdAndDelete(
          req.params.id
        );

      if (!application) {
        return res.status(404).json({
          success: false,
          message:
            "Application not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Application deleted successfully.",
      });
    } catch (err) {
      console.error(
        "deleteJoinApplication error:",
        err
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete application.",
      });
    }
  };


/*******************************************************
 * ADMIN — RENDER PAGE
 *******************************************************/

export const renderJoinAdminPage =
  async (
    req,
    res
  ) => {
    try {
      const applications =
        await Join.find({})
          .sort({
            createdAt: -1,
          })
          .limit(20)
          .lean();

      const total =
        await Join.countDocuments(
          {}
        );

      res.render(
        "joinmember",
        {
          applications,
          total,
          pageTitle:
            "Membership Applications",
        }
      );
    } catch (err) {
      console.error(
        "renderJoinAdminPage error:",
        err
      );

      res.status(500).send(
        "Failed to load join requests page."
      );
    }
  };


export const getCardByMemberId = async (
  req,
  res
) => {
  try {

    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Login required.",
      });
    }

    /*
     * Read member ID from URL.
     */
    const memberId = String(
      req.params.memberId || ""
    ).trim();

    if (!memberId) {
      return res.status(400).json({
        success: false,
        message: "Member ID is required.",
      });
    }

    /*
     * SECURITY:
     *
     * Do NOT search only by memberId.
     *
     * Search by BOTH:
     *
     *   memberId
     *   addedBy
     *
     * This means the logged-in user can only
     * access members that THEY added.
     */
    const application = await Join.findOne({
      memberId,
      addedBy: userId,
    })
      .select({
        _id: 0,
        memberId: 1,
        fullName: 1,
        profilePhoto: 1,
        type: 1,
        state: 1,
        district: 1,
        createdAt: 1,
      })
      .lean();

    /*
     * Same response for:
     *
     * - invalid member
     * - another user's member
     *
     * This avoids revealing whether another user's
     * member ID exists.
     */
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Card not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: application,
    });
  } catch (err) {
    console.error(
      "getCardByMemberId error:",
      err
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch card.",
    });
  }
};