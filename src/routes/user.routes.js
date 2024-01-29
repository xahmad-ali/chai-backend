import { Router } from "express";
import { registerUser } from "../controllers/user.controllers.js";

const router = Router();

console.log("debug");
// router.route("/register").post(registerUser) 

router.post("/register", registerUser);
export default router;