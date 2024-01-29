import { asyncHandler } from "../utils/asyncHandler.js";


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
});




 export { registerUser };
