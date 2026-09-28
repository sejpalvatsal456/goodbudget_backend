import { Router } from "express";
import { getAllCategories } from "../controllers/categoryController.js";

const categoryRoute = Router();
categoryRoute.get('/all/', getAllCategories);

export default categoryRoute;