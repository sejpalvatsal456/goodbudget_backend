import { Router } from "express";
import { signupController } from "../controllers/authController.js";

const authRouter = Router();
authRouter.post('/signup', signupController);

export default authRouter;