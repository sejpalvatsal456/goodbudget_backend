import { Router } from "express";
import { summarizeAllTransaction } from "../controllers/summaryController.js";

const summaryRouter = Router();

summaryRouter.get('/all', summarizeAllTransaction);

export default summaryRouter;