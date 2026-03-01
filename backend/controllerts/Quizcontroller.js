import db from "../config/db.js";

// ─────────────────────────────────────────────
// GET /api/quiz/questions  (Protected)
// Returns 10 questions WITHOUT correct_option
// ─────────────────────────────────────────────
export const getQuestions = async (req, res) => {
  try {
    const [questions] = await db.query(
      `SELECT id, question_text, option_a, option_b, option_c, option_d, marks, order_no
       FROM questions
       ORDER BY order_no ASC
       LIMIT 10`
    );

    if (questions.length === 0) {
      return res.status(404).json({ success: false, message: 'No questions found.' });
    }

    // Map to cleaner format for frontend
    const formatted = questions.map((q) => ({
      id: q.id,
      question: q.question_text,
      options: {
        A: q.option_a,
        B: q.option_b,
        C: q.option_c,
        D: q.option_d,
      },
      marks: q.marks,
      order: q.order_no,
    }));

    res.status(200).json({
      success: true,
      total: formatted.length,
      questions: formatted,
    });

  } catch (err) {
    console.error('getQuestions Error:', err.message);
    res.status(500).json({ success: false, message: 'Error fetching questions.' });
  }
};