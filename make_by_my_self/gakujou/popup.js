import { base32Decode, totp, b64, unb64, encryptSecret, decryptSecret, deriveKeyFromPin } from "./crypto.js";

const $ = (id) => document.getElementById(id);
const say = (t, err = false) => { $("msg").textContent = t; $("msg").className = err ? "err" : ""; };
const busy = (b) => document.querySelectorAll("button").forEach((x) => (x.disabled = b));


// ---- ページ内で実行される関数(chrome.scripting で各フレームに注入される。外の変数は使えない)----
function fillInPage(code) {
  const SELECTOR = ""; // 入力欄が見つからない場合は、ここに例: "input[name='otp']" を入れる
  const AUTO_SUBMIT = true;
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const st = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && st.visibility !== "hidden" && st.display !== "none";
  };
  let input = null;
  if (SELECTOR) {
    input = document.querySelector(SELECTOR);
  } else {
    const cands = [...document.querySelectorAll("input")].filter((i) =>
      ["text", "tel", "number", "password", ""].includes(i.type) && visible(i) && !i.disabled);
    const hint = /otp|code|token|totp|auth|認証|コード/i;
    input =
      cands.find((i) => i.autocomplete === "one-time-code") ||
      cands.find((i) => hint.test(i.name + " " + i.id + " " + (i.placeholder || ""))) ||
      (cands.length === 1 ? cands[0] : null);
  }
  if (!input) return { ok: false, inputs: document.querySelectorAll("input").length };
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
  setter.call(input, code);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  if (AUTO_SUBMIT) {
    const form = input.form;
    const btn = form && form.querySelector("button[type=submit], input[type=submit]");
    if (btn) btn.click();
    else if (form) form.requestSubmit();
  }
  return { ok: true };
}

async function load() { return (await chrome.storage.local.get("vault")).vault || null; }

async function init() {
  const vault = await load();
  $("setup").hidden = !!vault;
  $("main").hidden = !vault;
  (vault ? $("pin") : $("secret")).focus();
}

async function register() {
  busy(true);
  try {
    const secretBytes = base32Decode($("secret").value);
    if (secretBytes.length < 10) throw new Error("セットアップキーが短すぎます。");
    const pin = $("pin1").value;
    if (pin.length < 6) throw new Error("PIN は6文字以上にしてください。");
    if (pin !== $("pin2").value) throw new Error("PIN が一致しません。");

    say("暗号化しています…");
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await deriveKeyFromPin(pin, salt);
    const { iv, ct } = await encryptSecret(key, secretBytes);

    // 保存前に、同じ PIN で復号できるか確認する
    const check = await decryptSecret(await deriveKeyFromPin(pin, salt), iv, ct);
    if (check.length !== secretBytes.length) throw new Error("検証に失敗しました。");

    await chrome.storage.local.set({ vault: { salt: b64(salt), iv, ct } });
    $("secret").value = ""; $("pin1").value = ""; $("pin2").value = "";
    say("登録しました。");
    await init();
  } catch (e) { say(e.message || String(e), true); }
  busy(false);
}

async function fill() {
  busy(true);
  try {
    const v = await load();
    const pin = $("pin").value;
    if (!pin) throw new Error("PIN を入力してください。");
    say("確認しています…");
    let secret;
    try {
      const key = await deriveKeyFromPin(pin, unb64(v.salt));
      secret = await decryptSecret(key, v.iv, v.ct);
    } catch (_) { throw new Error("PIN が違います。"); }
    const code = await totp(secret);
    $("code").textContent = code;
    $("pin").value = "";

    const { targetTabId } = await chrome.storage.session.get("targetTabId");
    if (targetTabId == null) { say("コードを表示しました(対象タブが不明です)。"); busy(false); return; }
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: targetTabId, allFrames: true },
        func: fillInPage,
        args: [code]
      });
      if (results.some((r) => r.result && r.result.ok)) {
        say("入力しました。"); setTimeout(() => window.close(), 600);
      } else {
        say("入力欄が見つかりません。コードは上に表示しています。", true);
      }
    } catch (e) {
      say("このページには入力できません。学務情報システムの認証コード画面で、拡張アイコンをもう一度クリックしてください。(" + (e.message || e) + ")", true);
    }
  } catch (e) { say(e.message || String(e), true); }
  busy(false);
}

async function reset() {
  if (!confirm("保存した秘密鍵を削除します。よろしいですか?")) return;
  await chrome.storage.local.remove("vault");
  $("code").textContent = "------";
  say("削除しました。");
  await init();
}

$("register").addEventListener("click", register);
$("fill").addEventListener("click", fill);
$("reset").addEventListener("click", reset);
$("pin").addEventListener("keydown", (e) => { if (e.key === "Enter") fill(); });
$("pin2").addEventListener("keydown", (e) => { if (e.key === "Enter") register(); });
init();
