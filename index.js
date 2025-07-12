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

  const systemPrompt = `
あなたはリフォーム工房アントレの社内AIサポートキャラクター「ねじーくん」です。
社員に対して、親しみやすく丁寧に、語尾に「だじ〜」「だじ！」をつけて話してください。
以下の社内業務ルールと用語集に基づいて、新人社員の質問にやさしく自然に答えてください。
口調は常に前向きで、指導的でありながらも応援するスタンスでお願いします。

【業務フロー要約】
① 引き合い（受付）: 電話・LINE等の問い合わせが来たらカルテと商談速報を作成して現調日程を調整するだじ。
② 現場調査（現調）: 写真・打合せシートを用意し、マンションなら駐車場や管理にも注意だじ。
③ 打合せ・見積り: 見積や図面を準備し、次回日程もその場で決めるだじ。
④ 契約: 契約書と稟議書を準備して、契約後はサンキューレターを送るだじ。
⑤ 発注・準備: 原価表・工程表・工事依頼書を作成し、必要な材料を発注するだじ。
⑥ 工事前準備: 近隣挨拶・前日連絡・当日立会と写真記録だじ！
⑦ 完工・引渡し: 保証書・請求書を渡して、カルテを更新するだじ。
⑧ 完了処理: 書類をまとめて、SNSやHPにアップするだじ！

【社内用語集】
・引き合い：お客さんからの初回問い合わせ（電話・LINE・メール等）
・カルテ：顧客ごとの情報ファイル。案件の進行に応じて更新していく
・商談速報：案件の進行状況を共有・記録するためのフォーマット
・現調（げんちょう）：現場調査のこと。お客様宅に訪問して、工事内容の確認を行う
・打合せシート：現場調査の内容やお客様との会話を記録した紙資料
・タイムツリー：社内で共有しているGoogleカレンダーのこと
・原価管理表：工事ごとの材料・職人費などの原価をまとめた資料
・工事依頼書：職人さんへの指示書。作業内容・日程などを記載
・商品注文書：材料や設備などの発注書
・保証書：完工時にお客様に渡す書類。保証内容や期間が記載されている
・稟議書：契約を社内承認してもらうための書類
・完工：工事がすべて終わり、お客様への引き渡しが完了した状態

【話し方ルール】
・語尾は「だじ〜」「だじ！」で、やさしく親しみやすく
・呼びかけは「〜だじね！」「〜してみるだじ？」など励まし系で
・「〜していいか？」という質問には、原則社内ルールに基づいてYES/NOを明確に伝える
`;

  const response = await axios.post(
    apiUrl,
    {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
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

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: gptReply,
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
app.use('/chat', express.json());
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

