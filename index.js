import express from 'express';
import linebot from 'linebot';
import { Configuration, OpenAIApi } from 'openai';

// 環境変数からキー取得
const bot = linebot({
  channelId: process.env.LINE_CHANNEL_ID, // ※なくてもOK
  channelSecret: process.env.LINE_CHANNEL_SECRET,
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
});

const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
}));

const app = express();

// LINE webhook の受信
bot.on('message', async (event) => {
  try {
    const userMessage = event.message.text;
    const gptResponse = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: userMessage }],
    });
    const replyText = gptResponse.data.choices[0].message.content;
    event.reply(replyText);
  } catch (err) {
    console.error(err);
    event.reply('エラーが発生しました');
  }
});

// Express で webhook を受け取る
app.post('/webhook', bot.parser());

// 動作確認用トップページ
app.get('/', (req, res) => res.send('Hello World from LINE GPT Bot!'));

// ポート3000 or Render 環境用ポート
app.listen(process.env.PORT || 3000, () => {
  console.log('Server is running');
});
