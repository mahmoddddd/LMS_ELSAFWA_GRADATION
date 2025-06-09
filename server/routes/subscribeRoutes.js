import express from "express";
import { subscribeUser,sendContactMessage } from "../controllers/subscribeController.js";
const router = express.Router();


router.post("/", subscribeUser);


router.post("/contact", sendContactMessage);

export default router;
