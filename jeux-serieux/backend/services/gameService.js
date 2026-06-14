const { STARS_THRESHOLDS } = require('../config/gameConfig');

function gradeAnswer(question, selectedAnswer) {
  switch (question.type) {
    case 'order_events':
      return (
        Array.isArray(selectedAnswer) &&
        Array.isArray(question.correctOrder) &&
        JSON.stringify(selectedAnswer) === JSON.stringify(question.correctOrder)
      );
    case 'true_false':
      // Les deux côtés doivent être booléens (JSON les préserve)
      return selectedAnswer === question.correctAnswer;
    // mcq, fill_blank, odd_one_out : selectedAnswer est un index (Number)
    default:
      return Number(selectedAnswer) === Number(question.correctAnswer);
  }
}

function computeStars(score) {
  for (const t of STARS_THRESHOLDS) {
    if (score >= t.min) return t.stars;
  }
  return 0;
}

module.exports = { gradeAnswer, computeStars };
