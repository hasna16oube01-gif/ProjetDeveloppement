const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');

// Initialisation de Groq avec ta nouvelle clé API
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Création du dossier audio s'il n'existe pas
const audioDir = path.join(__dirname, '../audio');
if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

/**
 * Simplifie une histoire et génère un quiz via Groq (Llama 3)
 */
async function processStoryWithAI(originalText, title) {
  const prompt = `Tu es un expert en pédagogie pour enfants de 6 à 11 ans.

Voici une histoire originale intitulée "${title}":
---
${originalText}
---

Effectue les deux tâches suivantes :
1. Réécris l'histoire en la simplifiant (vocabulaire simple, phrases courtes).
2. Génère exactement 4 questions de compréhension QCM avec 4 options.

Retourne UNIQUEMENT un objet JSON valide avec cette structure exacte :
{
  "simplifiedText": "...",
  "questions": [
    {
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explanation": "..."
    }
  ]
}`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Tu es un assistant qui répond uniquement en JSON pur."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.3-70b-versatile", // Modèle ultra-rapide et performant
      response_format: { type: "json_object" } // Force Groq à renvoyer du JSON propre
    });

    const responseText = chatCompletion.choices[0].message.content;
    
    // Nettoyage de sécurité
    const clean = responseText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    // Validation pour MongoDB
    if (!parsed.simplifiedText || !Array.isArray(parsed.questions)) {
      throw new Error('Structure JSON incorrecte reçue de Groq');
    }

    return parsed;
  } catch (error) {
    console.error("❌ Erreur Groq :", error.message);
    throw error;
  }
}

/**
 * Génération audio — Retourne null proprement.
 */
async function generateAudio(text, storyId) {
  console.log(`ℹ️ Audio non généré pour l'histoire ${storyId}`);
  return null;
}

module.exports = { processStoryWithAI, generateAudio };