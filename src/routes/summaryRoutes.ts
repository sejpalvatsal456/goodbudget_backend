import { Router } from "express";
import { summarizeAccountTransaction, summarizeAllTransaction } from "../controllers/summaryController.js";
import { authMiddleware } from "../middlewares/authMidddleware.js";

const summaryRouter = Router();

summaryRouter.get('/all', authMiddleware, summarizeAllTransaction);
summaryRouter.get('/accounts/', authMiddleware, summarizeAccountTransaction);

export default summaryRouter;