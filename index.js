import express from 'express';
import axios from 'axios'; // そのままでOK

const app = express();
app.use(express.json()); // ← JSONボディ受信のために追加

// GPT API処理（仮で OpenAI API を使う例）
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

// LINE Bot用 webhook
bot.on('message', async (event) => {
  try {
    const userMessage = event.message.text;
    const reply = await getGptResponse(userMessage);
    event.reply(reply);
  } catch (err) {
    console.error(err);
    event.reply('エラーが発生したじ～');
  }
});

// GPT API 直叩き用 (開発/テスト用エンドポイント)
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

// その他
app.post('/webhook', bot.parser());
app.get('/', (req, res) => res.send('Hello World from LINE GPT Bot!'));
app.listen(process.env.PORT || 3000, () => {
  console.log('Server is running');
});
