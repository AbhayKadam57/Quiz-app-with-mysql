import express from "express";
const router = express.Router();
import { getQuestions } from '../controllerts/Quizcontroller.js';
import auth from "../middleware/auth.js";

// All quiz routes are protected
router.get('/questions', auth, getQuestions);

export default router