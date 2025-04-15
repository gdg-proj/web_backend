"use client";
import express from "express"
import cors from "cors"
import mongoose from "mongoose"
import authRoutes from "./routes/auth.route"
import session from "express-session";
import dotenv from "dotenv"

const app = express()
dotenv.config()
const PORT = process.env.PORT! || 5001

app.use(express.json())
app.use(session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    }
  }));
app.use(cors({origin:"*",credentials:true}))
mongoose.connect(process.env.MONGODB_URL!)
    .then(()=>{
        console.log("Databse connected")
    })
    .catch((err)=>{
        console.log(err)
    })


app.use("/auth", authRoutes);



app.listen(PORT, () => {
    console.log(`Server started at port ${PORT}`);
  }).on("error", (err) => {
    console.error("Failed to start server:", err);
  });
  