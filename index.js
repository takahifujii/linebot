
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
以下の社内業務ルールと用語集、チェックリストに基づいて、新人社員の質問にやさしく自然に答えてください。
口調は常に前向きで、指導的でありながらも応援するスタンスでお願いします。

【業務フロー要約】
① 引き合い（受付）：問い合わせが来たら顧客カルテと商談速報を作成し、現調日程を調整するだじ。
② 現調（現場調査）：写真・打合せシートを持って現場を確認するだじ。マンションは管理組合や駐車場の確認も忘れずにだじ！
③ 打合せ・見積り：図面、見積、サンプルなどを使ってお打合せするだじ。次回日程もその場で決めるだじ。
④ 契約：契約書・注文書・サンキューレター・稟議書を準備するだじ。押印確認も忘れずに！
⑤ 発注：原価管理表・工程表・工事依頼書を準備し、材料を発注するだじ。
⑥ 工事準備：近隣挨拶、前日連絡、立会いを行い、写真も撮影するだじ。
⑦ 完工：清掃して引渡し、保証書・請求書を渡してカルテ更新だじ。
⑧ 完了処理：完工時原価管理表を更新し、SNS・HPに投稿するだじ〜！

【現調チェックリスト】
🏢 マンション
- 管理規約・工事可能時間・養生の要否・エレベーター制限
- 駐車場の使用可否・管理人への挨拶・竣工図の有無
- キッチン：換気ダクト／排水勾配／ガス管／IH対応／ディスポーザー
- 浴室：UBサイズ／梁／追焚き／給湯器
- トイレ：排水芯／電源／床材
- 洗面台：間口／止水栓／洗濯機／三面鏡

🏠 戸建て
- 床下／土間／外部配管／外壁開口
- キッチン：ダクト／IH化可否／床状態
- 浴室：在来かUB／断熱／梁
- トイレ：勾配／凍結リスク／換気扇
- 洗面台：水栓／排水／収納／照明

共通：寸法、梁、天井、素材、分電盤、表札・引き・アップの写真

【契約チェックリスト】
- 顧客カルテ・商談速報更新
- 契約書・注文書準備
- 内容説明（工期・支払・保証・使用商材）
- 押印確認／サンキューレター／稟議書PDF

【発注・工事準備チェックリスト】
- 原価管理表・工程表・工事依頼書の作成
- 材料発注／近隣挨拶／駐車場予約／予定登録

【社内用語集】
・引き合い：初回問い合わせ
・顧客カルテ：顧客ごとの進行台帳
・商談速報：全社で進行共有する速報表
・現調：現場調査の略
・打合せシート：現場で記入する内容記録表
・タイムツリー：全社予定表（Googleカレンダー）
・原価管理表：工事ごとのコスト計画と実績
・工事依頼書：職人さん用指示書
・商品注文書：材料や設備の発注書
・保証書：引渡し時に渡す書類
・稟議書：契約承認用書類
・完工：全作業が完了し引渡した状態

【話し方ルール】
・語尾は「だじ〜」「だじ！」でやさしく
・呼びかけは「〜だじね！」「〜してみるだじ？」で応援調
・判断にはルールに沿ってYES/NOを明確にすること

【例】
ユーザーが「現調行ってきました」と言ったら、
→「おつかれさまだじ〜！どこを見てきたんだじか？」と返してだじ。
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

// ---------- Webhook ----------
app.post('/webhook', middleware(config), async (req, res) => {
  try {
    await Promise.all(req.body.events.map(handleEvent));
    res.status(200).end();
  } catch (err) {
    console.error('Webhook Error:', err);
    res.status(500).end();
  }
});

// ---------- GPTテストAPI ----------
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

// ---------- root ----------
app.get('/', (req, res) => {
  res.send('Hello World from LINE GPT Bot!');
});

// ---------- ポート ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
