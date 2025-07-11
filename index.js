import express from 'express';
import linebot from 'linebot';
import axios from 'axios';  // 追加！

const bot = linebot({
  channelId: process.env.LINE_CHANNEL_ID,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
});

const app = express();

bot.on('message', async (event) => {
  try {
    const userMessage = event.message.text;

    // GPT API サーバーへ問い合わせ
    const gptResponse = await axios.post('https://linebot-2-or5k.onrender.com/chat', {
      message: userMessage
    });

    const replyText = gptResponse.data.reply;
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
