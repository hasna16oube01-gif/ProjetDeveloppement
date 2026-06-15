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
async function generateChallenges(narratedText, title, objective = 'comprehension', options = {}) {
  const guidance = OBJECTIVE_GUIDANCE[objective] || OBJECTIVE_GUIDANCE.comprehension;
  const ALL_TYPES = ['mcq', 'true_false', 'fill_blank', 'order_events', 'odd_one_out'];

  const count = Math.min(Math.max(parseInt(options.count) || 5, 1), 10);
  let types = Array.isArray(options.types) ? options.types.filter((t) => ALL_TYPES.includes(t)) : [];
  if (types.length === 0) types = ALL_TYPES;

  const TYPE_TEMPLATES = {
    mcq:          `"mcq" — QCM : { "type": "mcq", "question": "...", "options": ["A","B","C","D"], "correctAnswer": 0, "hint": "...", "explanation": "..." }`,
    true_false:   `"true_false" — Vrai/Faux : { "type": "true_false", "question": "...", "correctAnswer": true, "hint": "...", "explanation": "..." }`,
    fill_blank:   `"fill_blank" — Texte à trous (UN mot = ___) : { "type": "fill_blank", "question": "... ___ ...", "options": ["a","b","c","d"], "correctAnswer": 0, "hint": "...", "explanation": "..." }`,
    order_events: `"order_events" — Ordre (4 événements MÉLANGÉS) : { "type": "order_events", "question": "Remets dans l'ordre.", "events": ["B","D","A","C"], "correctOrder": [2,0,3,1], "hint": "...", "explanation": "..." }`,
    odd_one_out:  `"odd_one_out" — L'intrus : { "type": "odd_one_out", "question": "Quel mot est l'intrus ?", "options": ["m1","m2","m3","intrus"], "correctAnswer": 3, "hint": "...", "explanation": "..." }`,
  };
  const templates = types.map((t) => '- ' + TYPE_TEMPLATES[t]).join('\n');

  const prompt = `Tu es un expert en pédagogie pour enfants de 6 à 11 ans.

Histoire "${title}" (texte écouté par l'enfant) :
---
${narratedText}
---

OBJECTIF PÉDAGOGIQUE : "${objective}"
CONSIGNE D'OBJECTIF : ${guidance}

TÂCHE — Génère EXACTEMENT ${count} défis, en utilisant UNIQUEMENT ces types (tu peux répéter un type pour atteindre ${count}, en variant les questions) :
${templates}

CHAQUE défi DOIT inclure un champ "hint" : un indice COURT (1 phrase) qui aide sans donner la réponse.

RÈGLES :
- Le contenu des questions ET des indices reflète l'objectif "${objective}".
- Pour order_events : 'events' mélangés, correctOrder = indices dans l'ordre chronologique.
- Tout en français, pour enfants de 6-11 ans. Retourne UNIQUEMENT le JSON.

Format : { "questions": [ ...${count} défis... ] }`;

  const completion = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: 'Tu es un assistant pédagogique. Tu réponds UNIQUEMENT en JSON pur et valide, sans markdown.' },
      { role: 'user', content: prompt },
    ],
    model: 'llama-3.3-70b-versatile',
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  const parsed = JSON.parse(completion.choices[0].message.content);
  if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
    throw new Error('Structure JSON invalide retournée par Groq (questions manquantes)');
  }
  return parsed;
}

// ── Audio : géré côté client via Web Speech API ───────────────────────────────
async function generateAudio(text, storyId) {
  console.log(`ℹ️  Audio non généré côté backend pour l'histoire ${storyId} (Web Speech API côté client)`);
  return null;
}

module.exports = { narrateStory, generateChallenges, generateAudio };