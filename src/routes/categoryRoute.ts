import { Router } from "express";
import { createCategory, getAllCategories } from "../controllers/categoryController.js";
import { authMiddleware } from "../middlewares/authMidddleware.js";
import { getSpecificAccountController } from "../controllers/accountsController.js";

const categoryRoute = Router();
categoryRoute.get('/all/', authMiddleware, getAllCategories);
categoryRoute.get('/:cat_id',authMiddleware, getSpecificAccountController);
categoryRoute.post('/', authMiddleware, createCategory);

export default categoryRoute;