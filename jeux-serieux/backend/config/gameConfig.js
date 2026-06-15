module.exports = {
  POINTS_PER_CORRECT:  20,   // 5 questions → 100 pts max par assignment
  LEVEL_UNLOCK_RATIO:  0.6,  // 60 % des points disponibles d'un niveau pour débloquer le suivant
  SECOND_ATTEMPT_PENALTY: 0.5, // en 2e tentative, chaque bonne réponse vaut la moitié
  // Barème étoiles (score sur 5, fonctionne aussi avec des scores fractionnaires)
  STARS_THRESHOLDS: [
    { min: 5, stars: 3 },
    { min: 4, stars: 2 },
    { min: 2, stars: 1 },
    { min: 0, stars: 0 },
  ],
};