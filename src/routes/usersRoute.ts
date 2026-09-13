import { Router } from "express";
import { createUserController, deleteUserontroller, getSpecificUserController, getUsersController, updateUserController } from "../controllers/usersController.js";


const usersRouter = Router();

usersRouter.get("/", getUsersController);
usersRouter.get("/:id", getSpecificUserController);
usersRouter.post('/', createUserController);
usersRouter.patch('/', updateUserController);
usersRouter.delete('/', deleteUserontroller);

export default usersRouter;