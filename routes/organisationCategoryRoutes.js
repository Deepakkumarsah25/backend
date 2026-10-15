import express from "express";
import { requireAdmin } from "../middlewar/requireAdmin.js";
import {
  getPublicCategories,
  showCategoryList,
  showAddCategory,
  addCategoryPage,
  showEditCategory,
  updateCategoryPage,
  deleteCategoryPage,
} from "../controllers/organisationCategoryController.js";

const router = express.Router();

// App (public) -> /organisation/categories
router.get("/", getPublicCategories);

// Admin panel pages -> /organisation/categories/manage...
router.get("/manage", requireAdmin, showCategoryList);
router.get("/manage/add", requireAdmin, showAddCategory);
router.post("/manage/add", requireAdmin, addCategoryPage);
router.get("/manage/edit/:id", requireAdmin, showEditCategory);
router.post("/manage/update/:id", requireAdmin, updateCategoryPage);
router.delete("/manage/delete/:id", requireAdmin, deleteCategoryPage);

export default router;