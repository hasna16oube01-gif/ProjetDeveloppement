const { STARS_THRESHOLDS, SECOND_ATTEMPT_PENALTY } = require('../config/gameConfig');

function gradeAnswer(question, selectedAnswer) {
  switch (question.type) {
    case 'order_events':
      return (
        Array.isArray(selectedAnswer) &&
        Array.isArray(question.correctOrder) &&
        JSON.stringify(selectedAnswer) === JSON.stringify(question.correctOrder)
      );
    case 'true_false':
      return selectedAnswer === question.correctAnswer;
    // mcq, fill_blank, odd_one_out : selectedAnswer est un index (Number)
    default:
      return Number(selectedAnswer) === Number(question.correctAnswer);
  }
}

// Points d'une question selon l'indice utilisé et le numéro de tentative
function computeQuestionPoints(question, selectedAnswer, hintUsed, attemptNumber) {
  const isCorrect = gradeAnswer(question, selectedAnswer);
  let points = 0;
  if (isCorrect) {
    if (attemptNumber >= 2) points = SECOND_ATTEMPT_PENALTY; // 2e tentative : moitié, pas d'indice
    else points = hintUsed ? 0.5 : 1;                        // 1re tentative : indice -> moitié
  }
  return { isCorrect, points };
}

function computeStars(score) {
  for (const t of STARS_THRESHOLDS) {
    if (score >= t.min) return t.stars;
  }
  return 0;
}

module.exports = { gradeAnswer, computeQuestionPoints, computeStars };