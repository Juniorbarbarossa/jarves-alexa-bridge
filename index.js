const express = require('express');
const app = express();
app.use(express.json());

const OPENCLAW_WEBHOOK = process.env.OPENCLAW_WEBHOOK || '';
const SECRET = process.env.ALEXA_SECRET || 'jarves2026';

app.get('/', (req, res) => res.send('Jarves Alexa Bridge - OK'));

app.post('/alexa', async (req, res) => {
  try {
    const body = req.body;
    const requestType = body?.request?.type;

    // Launch request
    if (requestType === 'LaunchRequest') {
      return res.json(speak('Oi! Sou o Jarves. O que você precisa?'));
    }

    // Intent request
    if (requestType === 'IntentRequest') {
      const intentName = body.request.intent.name;
      const slots = body.request.intent.slots || {};

      if (intentName === 'JarvesIntent') {
        const comando = slots?.Comando?.value || '';

        // Envia pro Jarves via webhook OpenClaw
        if (OPENCLAW_WEBHOOK && comando) {
          await fetch(OPENCLAW_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: `[Alexa] ${comando}` })
          });
          return res.json(speak(`Recebi! Passando pro Jarves: ${comando}`));
        }

        return res.json(speak('Comando recebido, mas o webhook não está configurado.'));
      }

      if (intentName === 'AMAZON.HelpIntent') {
        return res.json(speak('Diga: Jarves, seguido do seu comando. Por exemplo: Jarves, agenda uma reunião amanhã às 10h.'));
      }

      if (intentName === 'AMAZON.CancelIntent' || intentName === 'AMAZON.StopIntent') {
        return res.json(speak('Ok! Até mais.', true));
      }
    }

    res.json(speak('Não entendi. Pode repetir?'));
  } catch (err) {
    console.error(err);
    res.json(speak('Ocorreu um erro. Tente novamente.'));
  }
});

function speak(text, end = false) {
  return {
    version: '1.0',
    response: {
      outputSpeech: { type: 'PlainText', text },
      shouldEndSession: end
    }
  };
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Jarves Alexa Bridge rodando na porta ${PORT}`));
