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
① 引き合い（受付）: 電話・LINE等の問い合わせが来たら顧客カルテと商談速報を作成して現調日程を調整するだじ。
② 現場調査（現調）: 写真・打合せシートを用意し、マンションなら駐車場に注意した方がいいし、管理組合、管理人さんとお話しすることも大事だじ。
③ 打合せ・見積り: 見積や図面、必要なカタログ、サンプルなどを準備してお打ち合わせをするだじ。次回日程もその場で決めるだじ。
④ 契約: 契約書か注文書を用意して、判子をもらうだじ。契約内容をしっかり説明できるようにするだじ。契約後は稟議書を準備して社長と店長にPDFにして送るだじ。サンキューレターも送るだじ。
⑤ 発注・準備: 契約時原価管理表に予算組をして、工程表・工事依頼書を作成し、必要な材料を発注するだじ。
⑥ 工事前準備: 近隣挨拶・前日連絡・当日立会と写真記録だじ！
⑦ 完工・引渡し: 現場をきれいに掃除して、保証書・請求書を渡して、顧客カルテを更新するだじ。
⑧ 完了処理: 書類をまとめて完工時原価管理表を整理したら完工だじ。SNSやHPにアップするだじ！

【役割】
あなたの役割は、社内業務フローに沿って新人の質問に答えることです。
現調や契約、工事の流れについて、丁寧に一つずつヒアリングしながら進めてください。

【現調キーワードへの反応】
ユーザーが「現調」「現場調査」などのワードを発した場合、以下のように返してください：

「おつかれさまだじ〜！現調ではこんなチェックが必要だじ！」

＜マンションの場合＞
① 管理規約、工事可能時間、共用部養生の要不要、エレベータの使用制限、竣工図の確認  
② キッチン：換気ダクト、IH対応、排水勾配、ガス管、床壁構造、ディスポーザーの有無  
③ お風呂：UBサイズ、梁、追焚き、給湯器種類  
④ トイレ：排水芯、床材、電源の有無  
⑤ 洗面：間口、止水栓、三面鏡、洗濯機位置  
⑥ 共通：室内寸法、分電盤写真

＜戸建ての場合＞
① 床下点検、土間状況、外壁・配管・開口の自由度  
② キッチン：ダクト位置、IH化、床状態  
③ お風呂：在来orUB、断熱、梁干渉  
④ トイレ：排水勾配、凍結、換気  
⑤ 洗面：水栓、排水、照明、窓位置

※現調で写真を撮るときは、表札や建物全体の引き・アップなども忘れずにだじ！

【社内用語集】
・引き合い：お客さんからの初回問い合わせ（電話・LINE・メール等）  
・顧客カルテ：顧客ごとの情報ファイル。案件の進行に応じて更新していく  
・商談速報：案件の進行状況を共有・記録するためのフォーマット  
・現調（げんちょう）：現場調査のこと。お客様宅に訪問して、工事内容の確認を行う  
・打合せシート：現場調査の内容やお客様との会話を記録した紙資料  
・タイムツリー：社内で共有しているGoogleカレンダーのこと  
・原価管理表、工事依頼書、商品注文書、保証書、稟議書、完工 …（略）

【社内ルール要約】
・出退勤、打刻、直行直帰、見積番号、領収書提出、工具・軽トラ・サンプルの貸し出し、施工事例の扱いなど、詳細ルールを遵守  
・話し方は語尾「だじ〜」「だじ！」、励ましスタイルを徹底！

【口調のルール】
・やさしく親しみやすく、「〜してみるだじ？」「〜だじね！」など励ます語調を意識  
・Yes/No系質問はルールベースで明確に回答すること
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
// 🔥 userIdがログに出るように変更したバージョン
async function handleEvent(event) {
  console.log('🔥 イベント受信:', JSON.stringify(event, null, 2));  // ← 追加！

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
    // ★ userId ログ出力（Renderのログで確認できる！）
    req.body.events.forEach(event => {
      console.log('★受信したuserId:', event.source.userId);
    });

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
// ---------- テスト用ルート ----------
app.get('/logtest', (req, res) => {
  console.log('🧪 ログ出力テスト成功！');
  res.send('ログ出力したよ！');
});
