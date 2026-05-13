const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Traitement IA : simplification + génération de 5 défis ───────────────────
async function processStoryWithAI(originalText, title) {
  const prompt = `Tu es un expert en pédagogie pour enfants de 6 à 11 ans.

Histoire originale intitulée "${title}" :
---
${originalText}
---

TÂCHE 1 — Simplifie l'histoire :
- Vocabulaire simple, phrases courtes (max 15 mots par phrase)
- Conserve les éléments essentiels
- Maximum 300 mots

TÂCHE 2 — Génère exactement 5 défis variés, UN de chaque type :

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
- Les events du type order_events doivent être mélangés (PAS dans l'ordre chronologique)
- correctOrder contient les indices du tableau events dans le bon ordre chronologique
- Tous les textes en français, adaptés à des enfants de 6-11 ans
- Retourne UNIQUEMENT le JSON, sans texte autour

Format de retour :
{
  "simplifiedText": "...",
  "questions": [ ...5 défis dans l'ordre mcq, true_false, fill_blank, order_events, odd_one_out... ]
}`;

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'Tu es un assistant pédagogique. Tu réponds UNIQUEMENT en JSON pur et valide, sans markdown, sans texte introductif.',
      },
      { role: 'user', content: prompt },
    ],
    model:           'llama-3.3-70b-versatile',
    response_format: { type: 'json_object' },
    temperature:     0.7,
  });

  const raw    = completion.choices[0].message.content;
  const parsed = JSON.parse(raw);

  if (!parsed.simplifiedText || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
    throw new Error('Structure JSON invalide retournée par Groq');
  }

  return parsed;
}

// ── Audio : géré côté client via Web Speech API ───────────────────────────────
async function generateAudio(text, storyId) {
  console.log(`ℹ️  Audio non généré côté backend pour l'histoire ${storyId} (Web Speech API côté client)`);
  return null;
}

module.exports = { processStoryWithAI, generateAudio };
