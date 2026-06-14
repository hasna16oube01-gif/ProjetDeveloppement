const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Consignes spécifiques selon l'objectif pédagogique choisi par le prof ─────
const OBJECTIVE_GUIDANCE = {
  comprehension:
    "Cible la COMPRÉHENSION de l'histoire : les personnages, ce qui se passe, l'ordre des événements, le lieu, la morale. Les questions portent sur le SENS du récit.",
  lexique:
    "Cible le LEXIQUE / VOCABULAIRE : le sens des mots difficiles du texte, synonymes, contraires, familles de mots. Pour 'odd_one_out', l'intrus est un mot qui n'appartient pas au même champ lexical.",
  conjugaison:
    "Cible la CONJUGAISON : reconnaître le bon temps et la bonne forme d'un verbe. Pour 'fill_blank', fais choisir la forme conjuguée correcte d'un verbe tiré du texte.",
  grammaire:
    "Cible la GRAMMAIRE : nature et fonction des mots, accords (sujet-verbe, nom-adjectif), structure de la phrase. 'fill_blank' et 'mcq' portent sur des choix grammaticaux.",
  orthographe:
    "Cible l'ORTHOGRAPHE : choisir le mot correctement orthographié, repérer la faute. Pour 'odd_one_out', l'intrus est le mot mal orthographié ; pour 'fill_blank', propose plusieurs graphies d'un même mot.",
  mixte:
    "Mélange les objectifs : si possible, un objectif différent par question (compréhension, lexique, conjugaison, grammaire, orthographe).",
};

// ── 1) NARRATION : réécrit l'histoire ENTIÈRE façon conteur (pas de résumé) ───
async function narrateStory(originalText, title) {
  const prompt = `Tu es un conteur expert pour enfants de 6 à 11 ans.

Histoire originale intitulée "${title}" :
---
${originalText}
---

TÂCHE — Réécris l'histoire COMPLÈTE de manière captivante :
- Raconte TOUTE l'histoire du début à la fin (NE résume PAS, ne coupe aucun moment clé)
- Ton de conteur immersif, vivant, qui donne envie d'écouter
- Vocabulaire simple et phrases courtes (max 15 mots par phrase) pour être compris à l'oral
- Adapté à des enfants de 6-11 ans, en français
- Reste fidèle à l'intrigue, aux personnages et à la fin de l'histoire originale
- Longueur cible : 200 à 350 mots (assez bref pour une écoute agréable, mais l'histoire reste entière)
- Ce texte sera LU À VOIX HAUTE : pas de titres, pas de listes, juste le récit

Retourne UNIQUEMENT ce JSON :
{ "narratedText": "..." }`;

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content:
          'Tu es un conteur pour enfants. Tu réponds UNIQUEMENT en JSON pur et valide, sans markdown, sans texte introductif.',
      },
      { role: 'user', content: prompt },
    ],
    model:           'llama-3.3-70b-versatile',
    response_format: { type: 'json_object' },
    temperature:     0.8,
  });

  const parsed = JSON.parse(completion.choices[0].message.content);

  if (!parsed.narratedText || typeof parsed.narratedText !== 'string') {
    throw new Error('Structure JSON invalide retournée par Groq (narratedText manquant)');
  }

  return parsed; // { narratedText }
}

// ── 2) DÉFIS : génère 5 défis ORIENTÉS selon l'objectif du prof ───────────────
async function generateChallenges(narratedText, title, objective = 'comprehension') {
  const guidance = OBJECTIVE_GUIDANCE[objective] || OBJECTIVE_GUIDANCE.comprehension;

  const prompt = `Tu es un expert en pédagogie pour enfants de 6 à 11 ans.

Histoire "${title}" (c'est CE texte que l'enfant a écouté/lu) :
---
${narratedText}
---

OBJECTIF PÉDAGOGIQUE CHOISI PAR LE PROFESSEUR : "${objective}"
CONSIGNE D'OBJECTIF : ${guidance}

TÂCHE — Génère exactement 5 défis variés, UN de chaque type, et oriente leur CONTENU vers l'objectif ci-dessus.

TYPE 1 "mcq" — QCM classique :
{ "type": "mcq", "question": "...", "options": ["A","B","C","D"], "correctAnswer": 0, "explanation": "..." }

TYPE 2 "true_false" — Vrai ou Faux :
{ "type": "true_false", "question": "...", "correctAnswer": true, "explanation": "..." }

TYPE 3 "fill_blank" — Texte à trous (UN mot manquant = ___) :
{ "type": "fill_blank", "question": "Le héros traversa la ___ pour rentrer.", "options": ["forêt","mer","montagne","ville"], "correctAnswer": 0, "explanation": "..." }

TYPE 4 "order_events" — Ordre chronologique (4 événements MÉLANGÉS) :
{ "type": "order_events", "question": "Remets ces événements dans le bon ordre.", "events": ["Evt B","Evt D","Evt A","Evt C"], "correctOrder": [2,0,3,1], "explanation": "..." }

TYPE 5 "odd_one_out" — L'intrus :
{ "type": "odd_one_out", "question": "Quel mot n'a aucun rapport avec cette histoire ?", "options": ["mot1","mot2","mot3","intrus"], "correctAnswer": 3, "explanation": "..." }

RÈGLES IMPORTANTES :
- Le CONTENU des questions doit refléter l'objectif "${objective}" (voir la consigne d'objectif)
- Les 'events' de order_events doivent être mélangés (PAS dans l'ordre chronologique)
- correctOrder contient les indices du tableau events dans le bon ordre chronologique
- Tous les textes en français, adaptés à des enfants de 6-11 ans
- Retourne UNIQUEMENT le JSON, sans texte autour

Format de retour :
{
  "questions": [ ...5 défis dans l'ordre mcq, true_false, fill_blank, order_events, odd_one_out... ]
}`;

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content:
          'Tu es un assistant pédagogique. Tu réponds UNIQUEMENT en JSON pur et valide, sans markdown, sans texte introductif.',
      },
      { role: 'user', content: prompt },
    ],
    model:           'llama-3.3-70b-versatile',
    response_format: { type: 'json_object' },
    temperature:     0.7,
  });

  const parsed = JSON.parse(completion.choices[0].message.content);

  if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
    throw new Error('Structure JSON invalide retournée par Groq (questions manquantes)');
  }

  return parsed; // { questions }
}

// ── Audio : géré côté client via Web Speech API ───────────────────────────────
async function generateAudio(text, storyId) {
  console.log(`ℹ️  Audio non généré côté backend pour l'histoire ${storyId} (Web Speech API côté client)`);
  return null;
}

module.exports = { narrateStory, generateChallenges, generateAudio };