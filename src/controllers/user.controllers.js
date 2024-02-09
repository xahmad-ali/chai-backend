import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError} from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import nodeMailer from "nodemailer";


// generating acess ad refresh tokens
const generate_AccessAndRefresh_Tokens = async(userId) =>{
  try {
      const user = await User.findById(userId)
      const accessToken = user.generateAccessToken()
      const refreshToken = user.generateRefreshToken()

      user.refreshToken = refreshToken
      await user.save({ validateBeforeSave: false })

      return {accessToken, refreshToken}


  } catch (error) {
      throw new ApiError(500, "Something went wrong while generating referesh and access token")
  }
}


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

     // sending email to user
     const transporter = nodeMailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'ahmadhashmi152003@gmail.com',
        pass: 'pmmm iutr ecry sstp'
      }
    });

    const mailOptions = {
      from: 'ahmadhashmi152003@gmail.com',
      to: email,
      subject: 'Sending Email from Ahmad ki fisrt website',
      text: `Hi! kesy hyn Dear ${fullname},\n\n Welcome to Ahmad ki fist website.`

    };

    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });

    return res.status(201).json(
      new ApiResponse(200,createdUser,"User registerd Successfuly")
    )
  
});


const loginUser = asyncHandler(async (req, res) =>{
  // req body -> data
  // username or email
  //find the user
  //password check
  //access and referesh token
  //send cookie

  const {email, username, password} = req.body

  if (!(username || email)) {
      throw new ApiError(400, "username or email is required")
  }

  const user = await User.findOne({
      $or: [{username}, {email}]
  })

  if (!user) {
      throw new ApiError(404, "User does not exist")
  }

 const isPasswordValid = await user.isPasswordCorrect(password)

 if (!isPasswordValid) {
  throw new ApiError(401, "Invalid user credentials")
  }

 const {accessToken, refreshToken} = await generate_AccessAndRefresh_Tokens(user._id)
 //console.log(accessToken)
 //console.log(refreshToken)
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken").exec();

  const options = {
      httpOnly: true,
      secure: true
  }

  return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(
      new ApiResponse(
          200, 
          {
              user: loggedInUser, accessToken, refreshToken
          },
          "User logged In Successfully"
      )
  )

});


const logOutUser = asyncHandler(async (req, res) => {
    try {
      // removing tokens
      await User.findByIdAndUpdate(
        req.user._id,
        {
          $set: {
            refreshToken: undefined,
          },
        },
        {
          new: true,
        }
      );
  
      const options = {
        httpOnly: true,
        secure: true,
      };
  
      return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
    } catch (error) {
      // Handle error, possibly log it
      console.error('Logout error:', error);
      return res.status(500).json(new ApiResponse(500, {}, 'Internal Server Error'));
    }
  });
  

  // code  ka ager accesstoken expire hojaye during the use toh, refreshtokens ko bhj ky new access token generate kra lo
const refereshAccessToken = asyncHandler(async(req, res) => {

    const incomingToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingToken){
      throw new ApiError(401,"UnAuthorized Request")
    }

  try {
      const decodedToken= jwt.verify(incomingToken,process.env.REFRESH_TOKEN_SECRET)
  
      const user= await User.findById(decodedToken?._id)
  
      if(!user){
        throw new ApiError(401,"Invalid refresh Token")
      }
  
      if(incomingToken !== user?.refreshToken){
        throw new ApiError(401,"refresh Token is expired or used")
      }
  
      const options = {
        httpOnly: true,
        secure: true
      }
  
      const{new_accessToken,new_refreshToken} =await generate_AccessAndRefresh_Tokens(user._id)
  
      return res
      .status(200)
      .cookie("accessToken",new_accessToken)
      .cookie("refreshToken",new_refreshToken)
      .json(
        new ApiResponse(
          200,
          {accessToken,refreshToken: new_refreshToken},
          "Access token is refreshed"
        )
      )
  } catch (error) {
      throw new ApiError(401,error?.message || "invalid refresh token")
  }


});


// to change user password
const changeUserPassword = asyncHandler(async(req, res) => {

  const {oldPassword, newPassword} = req.body

  const user = User.findById(req.user?._id)
  const isPasswordCorrect= await isPasswordCorrect(oldPassword)
  if(!isPasswordCorrect){
    throw new ApiError(400,"Invalid User password")
  }

  user.password= newPassword
  user.save({validateBeforeSave: false})

  return res.status(200).json(new ApiResponse(200,{},"Password changed Successfuly"))
});

//to fetch current user
const fetchCurrentUser = asyncHandler(async(req, res) =>{

  return res.status(200).json(new ApiResponse(200,req.user,"Current user if fethed Successfuly"))

});

//update user info
const updateUserDetails = asyncHandler(async(req, res) =>{

  const {fullname,email} = req.user
  if(!(fullname,email)){
    throw new ApiError(400,"Atleast one field is required")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        fullname: fullname,
        email: email
      }
    },
    {
      new : true
    }
    ).select("-password")

    return res.status(200).json(new ApiResponse(200,user,"Account updates are done"))
});


const updateUserAvatar = asyncHandler(async(req, res) =>{

  const localAvatarPath = req.file

  if(!localAvatarPath){
    throw new ApiError(400,"Avatar image is not send by User")
  }

  const avatar = await uploadOnCloudinary(localAvatarPath)

  if(!avatar.url){
    throw new ApiError(400,"Error while uploading avatar image")
  }

  const user  = await User.findByIdAndUpdate( 
    req?._id,
    {
      $set:{
        avatar: avatar.url
      }
    },
    { new : true}
    ).select("-password")

    return res.status(200).json(new ApiResponse(200,user,"User avatar is updated successfuly")) 

});


const getUserChannelProfile = asyncHandler(async(req, res) => {

  const {username} =req.params
  if(!username?.trim()){
    throw new ApiError(400,"username not find")
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase()
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscriberedTo"
      }
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers"
        },
        channelsSubscribedToCount: {
          $size: "$subscriberedTo"
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscribers"] },
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1
      }
    }
  ]);
  
  if(!channel?.length){
    throw new ApiError(404,"channel does not exist")
  }

  return res.status(200).json(new ApiResponse(200,channel[0],"User data fetched successfuly"))

});


  export { registerUser, loginUser, logOutUser,
     refereshAccessToken,changeUserPassword,
     fetchCurrentUser,updateUserDetails,updateUserAvatar,getUserChannelProfile };


  
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