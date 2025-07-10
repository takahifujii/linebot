const express = require('express');
const { Configuration, OpenAIApi } = require('openai');

const app = express();
app.use(express.json());

// OpenAI APIキー
const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
}));

// Webhook
app.post('/webhook', async (req, res) => {
  const userMessage = req.body.message || 'こんにちは';

  try {
    const gptResponse = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: userMessage }],
    });

    const replyText = gptResponse.data.choices[0].message.content;
    console.log('GPT返信:', replyText);

    // 今は console.log だけ。LINE返信はまだ
    res.json({ reply: replyText });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error');
  }
});

app.listen(3000, () => {
  console.log('Server is running');
});
