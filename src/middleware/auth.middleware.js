import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";

export const verifyJWT = asyncHandler(async(req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        console.log(token)
        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
console.log(decodedToken)
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

        if (!user) {
            throw new ApiError(401, "Invalid Access Token")
        }

        req.user = user;
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }

})

/*
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
//import { Jwt } from "jsonwebtoken";
import jsonwebtoken from "jsonwebtoken";
import { User } from "../models/user.models.js";

export const verifyJWT = asyncHandler(async(req, _, next) => {

   try {

    console.log("sdadsa")
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");
     console.log("Token:", token);

     if(!token){
         throw new ApiError(401,"Unauthorized Requet")
     }

     console.log("sdadsa")

     const decodedToken = jsonwebtoken.verify(token, process.env.ACCESS_TOKEN_SECRET);

if (!decodedToken) {
  throw new ApiError(401, "Invalid Access Token");
}

if (decodedToken.exp < Date.now() / 1000) {
  throw new ApiError(401, "Access Token has expired");
}

const user = await User.findById(decodedToken?._id).select("-password -refreshToken").exec();

 
   // const decodedToken= jsonwebtoken.verify(token,process.env.ACCESS_TOKEN_SECRET)
 
    //const user = await User.findById(decodedToken?._id).select("-password -refreshToken").exec()
 
    if(!user){
     throw new ApiError(401,"Invalid Access Token")
    }
 
    req.user = user
    next()
   } catch (error) {
    throw new ApiError(401,error?.message || "Invalid access token")
   }

}); 

*/