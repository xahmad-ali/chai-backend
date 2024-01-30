import { Router } from "express";
import { registerUser } from "../controllers/user.controllers.js";
import {upload} from "../middleware/multer.middleware.js"

const router = Router();

console.log("debug");


 router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
           name: "coverImage",
           maxCount: 1 
        }
    ]),
    registerUser) ;   

    /*
router.post("/register", registerUser);
router.post("/register",upload.fields([
    {
        name: "avatar",
        maxCount: "1"
    },
    {
        name: "coverImage",
        maxCount:1
    }
]));
*/

export default router;
