//require('dotenv').config({path: './env'})
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path: './env'
})

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () =>{
        console.log(`Server is runnin at port: ${process.env.PORT}`);
        console.log("DB connection established")
    })
})
.catch((err) => {
    console.log("MONGO DB connection failed !!! ",err)
})












/*
import express from "express";
const app = express()


( async () => {
    try {
       await mongoose.connect('${process.env.MONGODB_URL}/${DB_NAME}')
       app.on("error", (error) =>{
        console.log("Error: ", error)
        throw error
       })

       app.listen(process.env.PORT, () => {
            console.log('App is listening on port ${process.env.PORT}');
       })
        
    } catch (error) {
        console.error("Error: ", error)
        throw err
    }

})() */