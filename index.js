const express = require('express');
const app = express();
app.use(express.json({ type: '*/*' }));

const OPENCLAW_WEBHOOK = process.env.OPENCLAW_WEBHOOK || '';

app.get('/', (req, res) => res.send('Jarves Alexa Bridge - OK'));

app.post('/alexa', (req, res) => {
  try {
    console.log('Body recebido:', JSON.stringify(req.body));

    const body = req.body || {};
    const request = body.request || {};
    const requestType = request.type || '';

    console.log('Request type:', requestType);

    if (requestType === 'LaunchRequest') {
      return res.json(speak('Oi! Sou o Jarves. O que você precisa?'));
    }

    if (requestType === 'IntentRequest') {
      const intentName = request.intent ? request.intent.name : '';
      const slots = request.intent && request.intent.slots ? request.intent.slots : {};
      const comando = slots.Comando ? (slots.Comando.value || '') : '';

      console.log('Intent:', intentName, '| Comando:', comando);

      if (intentName === 'JarvesIntent') {
        // Forward pro webhook se configurado
        if (OPENCLAW_WEBHOOK && comando) {
          try {
            const https = require('https');
            const url = new URL(OPENCLAW_WEBHOOK);
            const data = JSON.stringify({ text: '[Alexa] ' + comando });
            const options = {
              hostname: url.hostname,
              path: url.pathname,
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
            };
            const req2 = https.request(options);
            req2.write(data);
            req2.end();
          } catch (e) {
            console.error('Erro ao enviar webhook:', e.message);
          }
        }
        const resposta = comando
          ? 'Recebi! Passando pro Jarves: ' + comando
          : 'Pode falar o comando!';
        return res.json(speak(resposta));
      }

      if (intentName === 'AMAZON.HelpIntent') {
        return res.json(speak('Diga: Jarves, seguido do seu comando. Por exemplo: agenda uma reunião amanhã às dez horas.'));
      }

      if (intentName === 'AMAZON.CancelIntent' || intentName === 'AMAZON.StopIntent') {
        return res.json(speak('Ok! Até mais.', true));
      }

      return res.json(speak('Não entendi o comando. Pode repetir?'));
    }

    if (requestType === 'SessionEndedRequest') {
      return res.json({ version: '1.0', response: {} });
    }

    return res.json(speak('Pronto para ajudar!'));

  } catch (err) {
    console.error('Erro geral:', err);
    return res.json(speak('Algo deu errado. Tente novamente.'));
  }
});

function speak(text, end = false) {
  return {
    version: '1.0',
    response: {
      outputSpeech: { type: 'PlainText', text: text },
      reprompt: end ? undefined : {
        outputSpeech: { type: 'PlainText', text: 'Pode falar!' }
      },
      shouldEndSession: end
    }
  };
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Jarves Alexa Bridge na porta ' + PORT));
