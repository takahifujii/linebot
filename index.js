import express from 'express';
import { Client, middleware } from '@line/bot-sdk';
import axios from 'axios';

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new Client(config);
const app = express();

// ---------- GPTに問い合わせる関数 ----------
async function getGptResponse(message) {
  const apiKey = process.env.OPENAI_API_KEY;
  const apiUrl = 'https://api.openai.com/v1/chat/completions';

  const response = await axios.post(
    apiUrl,
    {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data.choices[0].message.content;
}

// ---------- LINEのメッセージ処理 ----------
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const userMessage = event.message.text;
  const gptReply = await getGptResponse(userMessage);

  // ねじーくん風に「だじ〜」をつける
  const finalReply = `${gptReply} だじ〜！`;

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: finalReply,
  });
}

// ---------- Webhookルート：middleware先につける！ ----------
app.post('/webhook', middleware(config), async (req, res) => {
  try {
    await Promise.all(req.body.events.map(handleEvent));
    res.status(200).end();
  } catch (err) {
    console.error('Webhook Error:', err);
    res.status(500).end();
  }
});

// ---------- GPT直接叩き用のテストAPI ----------
app.use('/chat', express.json()); // ←この位置ならOK
app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const reply = await getGptResponse(message);
    res.json({ reply });
  } catch (err) {
    console.error('Chat API Error:', err);
    res.status(500).json({ error: 'エラーだじ〜' });
  }
});

// ---------- rootルート ----------
app.get('/', (req, res) => {
  res.send('Hello World from LINE GPT Bot!');
});

// ---------- ポート ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
