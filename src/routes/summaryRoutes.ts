import { Router } from "express";
import { summarizeAllTransaction } from "../controllers/summaryController.js";
import { authMiddleware } from "../middlewares/authMidddleware.js";

const summaryRouter = Router();

summaryRouter.get('/all', authMiddleware, summarizeAllTransaction);

export default summaryRouter;