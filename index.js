import express from 'express';
import { Client, middleware } from '@line/bot-sdk';
import axios from 'axios';

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};
const bot = new Client(config);

const app = express();
app.use(express.json());
app.post('/webhook', middleware(config));  // ← ミドルウェア登録忘れずに！

async function getGptResponse(message) {
  // ここは今のままでOK
}

// イベント処理
bot.on('message', async (event) => {
  const userMessage = event.message.text;
  const reply = await getGptResponse(userMessage);
  await event.reply(reply);
});

// GPTテスト用
app.post('/chat', async (req, res) => {
  const { message } = req.body;
  const reply = await getGptResponse(message);
  res.json({ reply });
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Server is running');
});
