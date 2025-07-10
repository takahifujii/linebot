import express from 'express';
import linebot from 'linebot';
import { Configuration, OpenAIApi } from 'openai';

// LINE Bot設定
const bot = linebot({
  channelId: process.env.LINE_CHANNEL_ID,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
});

// OpenAI設定
const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
}));

// Expressサーバー
const app = express();
app.use(express.json());
app.post('/webhook', bot.parser());

// メッセージイベント
bot.on('message', async (event) => {
  if (event.message.type !== 'text') return;

  try {
    const gptRes = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: event.message.text }],
    });
    const replyText = gptRes.data.choices[0].message.content;
    await event.reply(replyText);
  } catch (err) {
    console.error(err);
    await event.reply('エラーが発生しました💦');
  }
});

// 簡単な疎通確認
app.get('/', (req, res) => {
  res.send('Hello World from LINE GPT Bot!');
});

// Renderはポート番号を process.env.PORT で受ける
app.listen(process.env.PORT || 3000, () => {
  console.log('Server is running');
});
