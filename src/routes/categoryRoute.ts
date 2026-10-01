import { Router } from "express";
import { createCategoryController, getAllCategories, getSpecificCategory, updateCategoryController } from "../controllers/categoryController.js";
import { authMiddleware } from "../middlewares/authMidddleware.js";


const categoryRoute = Router();
categoryRoute.get('/all/', authMiddleware, getAllCategories);
categoryRoute.get('/:cat_id',authMiddleware, getSpecificCategory);
categoryRoute.post('/', authMiddleware, createCategoryController);
categoryRoute.patch('/', authMiddleware, updateCategoryController);

export default categoryRoute;