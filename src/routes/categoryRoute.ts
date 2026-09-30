import { Router } from "express";
import { getAllCategories } from "../controllers/categoryController.js";
import { authMiddleware } from "../middlewares/authMidddleware.js";

const categoryRoute = Router();
categoryRoute.get('/all/', authMiddleware, getAllCategories);

export default categoryRoute;