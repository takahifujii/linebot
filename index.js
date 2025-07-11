import express from 'express';
import { Client, middleware as lineMiddleware } from '@line/bot-sdk';
import axios from 'axios';

// LINE BOT の設定
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new Client(config);
const app = express();

// ✅ LINE webhook より前に express.json() を適用しない

// --------------------------
// LINE の Webhook エンドポイント
// --------------------------
app.post('/webhook', lineMiddleware(config), async (req, res) => {
  try {
    const results = await Promise.all(req.body.events.map(handleEvent));
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).end();
  }
});

// --------------------------
// それ以外のルートに JSON ボディパースを適用
// --------------------------
app.use(express.json());

// GPT に問い合わせる処理
async function getGptResponse(message) {
  const apiKey = process.env.OPENAI_API_KEY;
  const apiUrl = 'https://api.openai.com/v1/chat/completions';

  const response = await axios.post(apiUrl, {
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: message }],
  }, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
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

// --------------------------
// 開発・テスト用 GPT 直叩き API
// --------------------------
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

// --------------------------
// テスト用
// --------------------------
app.get('/', (req, res) => res.send('Hello World from LINE GPT Bot!'));

// --------------------------
// 起動
// --------------------------
app.listen(process.env.PORT || 3000, () => {
  console.log('Server is running');
});
