# gakujoの使い方と仕組み

## 使い方
初めにファイルをダウンロードします。
ダウンロードしたら
[edge://extensions/](edge://extensions/)
これにアクセスします。
アクセスしたら上のほうに展開して読み込みがあるので、そこをクリックする。
フォルダーを選んで、おしまい。

## 仕組み

### /background/background.js
```js
// アイコンをクリックしたら、現在のタブを記録して小さなウィンドウで popup.html を開く。
// (通常のポップアップは生体認証ダイアログが出ると閉じてしまうため、別ウィンドウにしている)
let winId = null;

chrome.action.onClicked.addListener(async (tab) => {
  await chrome.storage.session.set({ targetTabId: tab.id });
  if (winId !== null) {
    try { await chrome.windows.update(winId, { focused: true }); return; } catch (_) { winId = null; }
  }
  const w = await chrome.windows.create({
    url: chrome.runtime.getURL("popup.html"),
    type: "popup", width: 380, height: 420
  });
  winId = w.id;
});

chrome.windows.onRemoved.addListener((id) => { if (id === winId) winId = null; });
```

#### 全体の流れ
アイコンをクリックすると、現在のタブを覚えたうえで、小さな独立ウィンドウとして**popup.html**を開く。
コメントにある通り、通常のポップアップは、生体認証ダイアログがでるとフォーカスが外れて閉じてしまいます。そのため、閉じない別ウィンドウで代用します。

### /manifest.json
```json
{
  "manifest_version": 3,
  "name": "gakujo",
  "version": "0.2.0",
  "description": "新潟大学学務情報システムの機能です。",
  "permissions": ["storage", "activeTab", "scripting"],
  "background": { "service_worker": "background/background.js" },
  "action": { "default_title": "認証コードを入力" },
  "options_page": "options/options.html",
  "content_scripts": [
    {
      "matches": ["https://gakujo.iess.niigata-u.ac.jp/campusweb/*"],
      "js": [
        "content/core.js",
        "content/darkmode/darkmode.js",
        "content/darkmode/toggle.js",
        "content/main.js"
      ],
      "css": [
        "content/darkmode/darkmode.css",
        "content/darkmode/toggle.css"
      ],
      "run_at": "document_start",
      "all_frames": false
    }
  ]
}
```

#### 全体の流れ
ブラウザに対する拡張期のの説明書。ブラウザは拡張期のを読み込むとき、まずこのファイルだけを読んで、次のことを判断する。
##### 1.これは何者か
名前、バージョン、説明、アイコン。
##### 2.どのファイルがどの役割か
ブラウザはフォルダ内のファイルを自動で探したりしないため書いてあげる必要がある。
##### 3.何を許可してほしいか
```storage```(保存)、```activaTab```(今のタブの操作)、```scripting```(スクリプト注入)など、拡張機能が使いたい機能を事前に宣言します。ユーザーはインストール時にそれを見て判断でき、宣言していない機能を使おうとするとブラウザが拒否します。セキュリティのための仕組みです。
##### 4.いつ・どこで動かすか
```content_scripts```の```matches```で、このURLのページにだけ、このタイミングでJS/CSSを注入すると指定する。あなたの拡張機能なら学務情報システムのページだけで動くようになっている。

### /crypto.js
```js
// TOTP (RFC 6238) と AES-GCM 暗号化のユーティリティ。外部ライブラリなし。

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Decode(str) {
  const s = str.toUpperCase().replace(/[\s=-]/g, "");
  let bits = 0, value = 0;
  const out = [];
  for (const ch of s) {
    const idx = B32.indexOf(ch);
    if (idx < 0) throw new Error("セットアップキーに使えない文字があります: " + ch);
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

export async function totp(secretBytes, nowMs = Date.now(), digits = 6, period = 30) {
  const counter = Math.floor(nowMs / 1000 / period);
  const buf = new ArrayBuffer(8);
  new DataView(buf).setBigUint64(0, BigInt(counter));
  const key = await crypto.subtle.importKey(
    "raw", secretBytes, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const h = new Uint8Array(await crypto.subtle.sign("HMAC", key, buf));
  const o = h[h.length - 1] & 0x0f;
  const n = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(n % 10 ** digits).padStart(digits, "0");
}

export function b64(bytes) {
  let s = "";
  new Uint8Array(bytes).forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s);
}
export function unb64(str) {
  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
}

// keyBytes: 32バイト(WebAuthn PRF の出力)
export async function encryptSecret(keyBytes, plainBytes) {
  const key = await crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plainBytes);
  return { iv: b64(iv), ct: b64(ct) };
}

export async function decryptSecret(keyBytes, ivB64, ctB64) {
  const key = await crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["decrypt"]);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(ivB64) }, key, unb64(ctB64));
  return new Uint8Array(pt);
}

// PIN から AES 用の鍵(32バイト)を作る。PBKDF2 で、総当たりを遅くする。
export async function deriveKeyFromPin(pin, saltBytes, iterations = 600000) {
  const base = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(pin), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: saltBytes, iterations }, base, 256);
  return new Uint8Array(bits);
}
```

#### 全体の流れ
ワンタイムパスコードの計算と、秘密鍵の暗号化・復号をまとめたもの。外部ライブラリなしで、ブラウザ標準のweb crypto APIだけで書かれています。
