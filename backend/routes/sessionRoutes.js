import express from "express";
const router = express.Router();
import {
  startSession,
  submitAnswer,
  completeSession,
  getMyResult,
  getLeaderboard,
  retakeQuiz,
} from '../controllerts/Sessioncontroller.js';
import auth from "../middleware/auth.js";

// All session routes are protected
router.post('/start', auth, startSession);
router.post('/answer', auth, submitAnswer);
router.post('/complete', auth, completeSession);
router.post('/retake', auth, retakeQuiz);
router.get('/my-result', auth, getMyResult);
router.get('/leaderboard', auth, getLeaderboard);

export default router;