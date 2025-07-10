import express from 'express';
import linebot from 'linebot';
import OpenAI from 'openai';  // ← デフォルトインポート

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const bot = linebot({
  channelId: process.env.LINE_CHANNEL_ID,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
});

const app = express();

bot.on('message', async (event) => {
  try {
    const userMessage = event.message.text;
    const gptResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: userMessage }],
    });
    const replyText = gptResponse.choices[0].message.content;
    event.reply(replyText);
  } catch (err) {
    console.error(err);
    event.reply('エラーが発生しました');
  }
});

app.post('/webhook', bot.parser());

app.get('/', (req, res) => res.send('Hello World from LINE GPT Bot!'));

app.listen(process.env.PORT || 3000, () => {
  console.log('Server is running');
});

