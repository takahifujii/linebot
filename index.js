import express from 'express';
import { Client, middleware } from '@line/bot-sdk';
import axios from 'axios';

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new Client(config);
const app = express();
app.use(express.json());

// GPT に問い合わせる処理
async function getGptResponse(message) {
  const apiKey = process.env.OPENAI_API_KEY;
  const apiUrl = 'https://api.openai.com/v1/chat/completions';

  const response = await axios.post(apiUrl, {
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: message }],
  }, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });

  return response.data.choices[0].message.content;
}

// LINE のメッセージ処理
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const userMessage = event.message.text;
  const reply = await getGptResponse(userMessage);

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: reply,
  });
}

// Webhook エンドポイント
app.post('/webhook', middleware(config), async (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// GPT 直叩き用
app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const reply = await getGptResponse(message);
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'エラーだじ～' });
  }
});

app.get('/', (req, res) => res.send('Hello World from LINE GPT Bot!'));

app.listen(process.env.PORT || 3000, () => {
  console.log('Server is running');
});
