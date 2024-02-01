import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError} from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import cookieParser from "cookie-parser";


// generating acess ad refresh tokens
const generate_AccessAndRefresh_Tokens = async(userId) => {

  try {
      const user= await User.findById(userId)
      const User_Access_Token = user.generateAccessToken()
      const User_Refresh_Token = user.generateRefreshToken()

      user.refreshToken = User_Refresh_Token
      await user.save({validateBeforeSave: false})

      return {User_Access_Token,User_Refresh_Token}
       
  } catch (error) {
      throw new ApiError(500,"Something went wrong while generating ACCESS and REFRESH TOKEN")
  }


};


// Response design to follow
/* 
return res.status(500).json({
    statusCode: 500,
    status: false,
    message: "Internal Server Error",
    payload: {},
  });
  */



const registerUser = asyncHandler(async (req, res) => {
    const {fullname,email,username ,password} = req.body
    console.log("email: ", email);

    if ([fullname,email,username,password].some((field) => field?.trim() === "")) {
      throw new ApiError(400, "All fields are required ")
    };

    const exitedUser = await User.findOne({
      $or: [{username},{email} ]
    });

    if (exitedUser) {
      throw new ApiError(409, "User with email or user_name already existed")
    }

    const avatarLocalPath= req.files?.avatar[0]?.path;
    //const coverImagePath = req.files?.coverImage[0]?.path;

    //
    let coverImagelocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
      coverImagelocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
      throw new ApiError(400,"Avatar file is required")
    }

    console.log(req.files);

    const avatar =await uploadOnCloudinary(avatarLocalPath);
    const coverImage= await uploadOnCloudinary(coverImagelocalPath);

    if (!avatarLocalPath) {
      throw new ApiError(400,"Avatar file is required")
    }

    const user = await User.create({
      fullname,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      password,
      username: username.toLowerCase()
    });

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    )

    if(!createdUser){
      throw new ApiError(500,"somthing went wrong while creating user on the server")
    }

    return res.status(201).json(
      new ApiResponse(200,createdUser,"User registerd Successfuly")
    )
  
});




const loginUser = asyncHandler( async (req, res) => {

    // req body-> data
    //username base or email base
    //find user 
    // check password -if not-> error 
    // acces token and refresh token 
    // send secure cookies
    // respones of successful

    const {email,username,password}=req.body

    if(!(username || email)){
      throw new ApiError(400,"username or email is required")
    }

   const user=await User.findOne({
      $or: [{username}, {email}]
    })

    if(!user){
      throw new ApiError(404,"User does not exist")
    }

   

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
      throw new ApiError(401,"Password is not valid")
    }

    const {accessToken, refreshToken} = await generate_AccessAndRefresh_Tokens(user._id)

    const logedInUser = User.findById(user._id).select("-password -refreshToken").exec();

    const options = {
      httpOnly: true,
      secure: true
    }
    console.log(email)
    return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json(
      new ApiResponse(200,
        {
          user: logedInUser, accessToken,refreshToken
        },
        "User logedIn successfuly and tokens are sent also"
        )
    )
    
});

const logOutUser= asyncHandler(async(req, res) => {
    // reomoving tokens
    //
    User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          refreshToken: undefined
        },
      },
      {
        new: true
      }
    )

    const options = {
      httpOnly: true,
      secure: true
    }

    return res.status(200).clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
      new ApiResponse(200,{},"User logged out successfuly")
    )




  });

 export { registerUser, loginUser, logOutUser };

//get user details 
// validations -not empty - already exist 
// check for name,email,fullname,avtar
//upload on cloudinary
//multer check
// create db 

/*
 console.log("Register user route hit!");
 var accessToken = "123123123123"
 var refreshToken= "123123123123"
 // Your registration logic here
 //return res.status(200).json({ message: "ok" });
 return res.status(200).json({
     statusCode: 200,
     status: false,
     message: "Server Successfuly connneced!!!",
     payload: {
         accessToken: accessToken,
         refreshToken: refreshToken
     },
   });
   */