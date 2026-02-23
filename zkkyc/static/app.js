// ── State ──
let appState = {
  issuer: null,
  holderDid: null,
  credential: null,
  proof: null,
  verifierNonce: null,
  currentStep: 1,
};

// ── API helpers ──
async function api(endpoint, data = null) {
  const opts = data
    ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }
    : { method: data === null && endpoint.startsWith("/api/registry") ? "GET" : "POST" };
  const res = await fetch(endpoint, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "API 错误");
  }
  return res.json();
}

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  if (loading) { btn.classList.add("loading"); btn.disabled = true; }
  else { btn.classList.remove("loading"); btn.disabled = false; }
}

// ── Step Navigation ──
function showStep(n) {
  document.querySelectorAll(".step-content").forEach((el) => el.classList.remove("active"));
  document.querySelectorAll(".step-btn").forEach((el) => el.classList.remove("active"));
  document.getElementById(`step-${n}`).classList.add("active");
  document.querySelectorAll(".step-btn")[n - 1].classList.add("active");
  appState.currentStep = n;
}

function markStepDone(n) {
  document.querySelectorAll(".step-btn")[n - 1].classList.add("done");
}

function updateStatusDot(id, on) {
  const dot = document.getElementById(id);
  if (dot) dot.classList.toggle("off", !on);
}

// ── Pretty JSON with Chinese comments ──
const JSON_COMMENTS = {
  // DID & Issuer
  '"@context"': '// W3C 标准上下文',
  '"id"': '// 唯一标识符',
  '"issuer"': '// 发行方 DID',
  '"issuer_did"': '// 发行方去中心化标识符',
  '"holder_did"': '// 持有方去中心化标识符',
  '"public_key"': '// 发行方公钥（用于验证签名）',
  '"algorithm"': '// 签名算法',
  '"verificationMethod"': '// 验证方法（公钥信息）',
  '"authentication"': '// 身份认证方式',
  '"assertionMethod"': '// 断言方法',
  '"publicKeyHex"': '// 公钥十六进制',
  '"controller"': '// 密钥控制者',
  '"name"': '// 名称',

  // Credential
  '"type"': '// 凭证类型',
  '"issuanceDate"': '// 签发日期',
  '"expirationDate"': '// 过期日期',
  '"credentialSubject"': '// 凭证主体（KYC 信息）',
  '"credential_id"': '// 凭证唯一 ID',
  '"credential"': '// 可验证凭证全文',
  '"signed_fields"': '// 被 BBS+ 签名的字段列表',
  '"merkle_root"': '// Merkle 树根哈希（链上公开）',
  '"credentialStatus"': '// 凭证状态（撤销用）',
  '"statusPurpose"': '// 状态用途：撤销',

  // KYC fields
  '"kycLevel"': '// KYC 认证等级',
  '"sanctionClear"': '// 制裁名单清查：true=未命中',
  '"countryRisk"': '// 国家风险等级',
  '"amlCheck"': '// 反洗钱检查结果',
  '"nationality"': '// 国籍（隐私字段）',
  '"idNumber"': '// 证件号码（隐私字段）',

  // Proof
  '"presentation"': '// 可验证展示（包含 ZK 证明）',
  '"proof"': '// 零知识证明',
  '"nullifier"': '// 消零器（防重放+不可关联）',
  '"proof_size_bytes"': '// 证明大小（字节）',
  '"verifierNonce"': '// 验证方挑战随机数',
  '"selectiveDisclosure"': '// 选择性披露证明',
  '"revocationProof"': '// 非撤销证明（Merkle 成员）',
  '"expirationProof"': '// 过期证明',
  '"provenStatements"': '// 已证明的断言',
  '"hiddenInformation"': '// 被隐藏的信息',
  '"disclosed"': '// 已披露字段',
  '"hidden_commitments"': '// 隐藏字段的承诺值',
  '"signature"': '// BBS+ 组合签名',
  '"all_commitments"': '// 所有字段的承诺值',
  '"commitment"': '// Pedersen 承诺',
  '"blinding"': '// 盲因子（随机数）',
  '"value"': '// 原始值',
  '"merkleRoot"': '// Merkle 根（链上对比用）',
  '"leafHash"': '// 叶子哈希',
  '"notExpired"': '// 是否未过期',
  '"holder"': '// 持有方',

  // Revocation
  '"revoked"': '// 是否已撤销',
  '"old_merkle_root"': '// 旧 Merkle 根',
  '"new_merkle_root"': '// 新 Merkle 根（根变=有撤销）',

  // Unlinkability
  '"proofs_generated"': '// 生成的证明数量',
  '"all_from_same_user"': '// 全部来自同一用户',
  '"can_link_proofs"': '// 能否关联这些证明',
  '"nonce"': '// 验证方随机数',
  '"proof_hash"': '// 证明哈希（观察差异）',
  '"signature_fragment"': '// 签名片段（观察差异）',
};

function prettyJSON(obj) {
  const json = JSON.stringify(obj, null, 2);
  let result = json
    .replace(/("[\w@#\-./:]+")\s*:/g, '<span class="json-key">$1</span>:')
    .replace(/:\s*(".*?")/g, ': <span class="json-string">$1</span>')
    .replace(/:\s*(\d+)/g, ': <span class="json-number">$1</span>')
    .replace(/:\s*(true|false|null)/g, ': <span class="json-bool">$1</span>');

  // Add comments after known keys (i18n-aware)
  const activeComments = (typeof getJsonComments === 'function') ? getJsonComments() : JSON_COMMENTS;
  for (const [key, comment] of Object.entries(activeComments)) {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const spanKey = `<span class="json-key">${key}</span>`;
    const escapedSpanKey = spanKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match the key span followed by the rest of the line
    const regex = new RegExp(`(${escapedSpanKey}:.*?)($)`, 'gm');
    result = result.replace(regex, `$1  <span class="json-comment">${comment}</span>`);
  }
  return result;
}

// ── Update explanation panel ──
function updateExplanation(stepN, data) {
  const exp = data.explanation;
  if (!exp) return;
  const el = document.getElementById(`exp-${stepN}`);
  if (!el) return;
  let html = `<div class="exp-title">${exp.title || ""}</div>`;
  if (exp.steps) {
    html += '<ul class="exp-steps">';
    exp.steps.forEach((s) => (html += `<li>${s}</li>`));
    html += "</ul>";
  }
  if (exp.technical) html += `<div class="exp-technical">${exp.technical}</div>`;
  if (exp.privacy_note) html += `<div class="privacy-box">${exp.privacy_note}</div>`;
  if (stepN === 1) {
    const summary = typeof t === 'function' ? t('s1.exp.summary') : '一句话总结：Binance 生成了一把密码学钥匙，用它推导出一个全球唯一的身份ID，写了一份标准化的身份文档，然后把公钥发布到区块链上 —— 从此任何人都可以独立验证 Binance 签发的凭证，不需要联系 Binance。';
    html += `<div style="margin-top:16px; padding:14px 16px; background:rgba(88,166,255,0.08); border:1px solid rgba(88,166,255,0.2); border-radius:10px; font-size:13px; color:var(--text); line-height:1.8;"><strong>💡</strong> ${summary}</div>`;
  }
  if (exp.next) html += `<div class="exp-next">👉 ${exp.next}</div>`;
  el.innerHTML = html;
  el.classList.add("fade-in");
}

// ── Step 1: Setup Issuer ──
async function setupIssuer() {
  setLoading("btn-setup", true);
  try {
    const data = await api("/api/issuer/setup", {});
    appState.issuer = data.result;
    updateStatusDot("dot-issuer", true);
    markStepDone(1);
    const el = document.getElementById("issuer-result");
    el.style.display = "block";
    el.innerHTML = prettyJSON(data.result);
    updateExplanation(1, data);
  } catch (e) { alert("错误: " + e.message); }
  setLoading("btn-setup", false);
}

// ── Step 2: KYC ──
async function submitKYC() {
  setLoading("btn-kyc", true);
  try {
    const data = await api("/api/user/kyc", {
      name: document.getElementById("kyc-name").value,
      country: document.getElementById("kyc-country").value,
      id_number: document.getElementById("kyc-id").value,
      kyc_level: parseInt(document.getElementById("kyc-level").value),
    });
    appState.holderDid = data.result.holder_did;
    appState.credential = data.result.credential;
    updateStatusDot("dot-user", true);
    document.getElementById("stat-creds").textContent = `凭证数: 1`;
    markStepDone(2);
    const el = document.getElementById("kyc-result");
    el.style.display = "block";
    el.innerHTML = prettyJSON(data.result);
    updateExplanation(2, data);
    document.getElementById("alice-did").textContent = `DID: ${appState.holderDid}`;
    generateNonce();
  } catch (e) { alert("错误: " + e.message); }
  setLoading("btn-kyc", false);
}

// ── Step 3: Nonce ──
function generateNonce() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  const nonce = Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
  appState.verifierNonce = nonce;
  const el = document.getElementById("verifier-nonce");
  if (el) el.value = nonce;
}

// ── Step 4: Generate Proof ──
async function generateProof() {
  if (!appState.holderDid || !appState.verifierNonce) {
    alert("请先完成前面的步骤。");
    return;
  }
  setLoading("btn-proof", true);
  try {
    const data = await api("/api/proof/generate", {
      holder_did: appState.holderDid,
      verifier_nonce: appState.verifierNonce,
      disclosed_fields: ["kycLevel", "sanctionClear", "amlCheck", "countryRisk"],
    });
    appState.proof = data.result.presentation.proof;
    updateStatusDot("dot-proof", true);
    markStepDone(3);
    markStepDone(4);
    const el = document.getElementById("proof-result");
    el.style.display = "block";
    el.innerHTML = prettyJSON(data.result);
    updateExplanation(4, data);
  } catch (e) { alert("错误: " + e.message); }
  setLoading("btn-proof", false);
}

// ── Step 5: Verify (animated) ──
async function verifyProofAnimated() {
  if (!appState.proof) {
    alert("没有证明可验证，请先生成证明。");
    return;
  }
  setLoading("btn-verify", true);

  // Reset all timeline steps
  for (let i = 0; i <= 5; i++) {
    const step = document.getElementById(`vt-step-${i}`);
    if (step) { step.classList.remove("active", "done", "fail"); }
    const status = document.getElementById(`vt-status-${i}`);
    if (status) status.textContent = "⏳ 等待执行";
  }
  document.getElementById("vt-step-final").style.display = "none";
  document.getElementById("bob-knowledge").style.display = "none";

  try {
    const data = await api("/api/proof/verify", {
      proof: appState.proof,
      verifier_nonce: appState.verifierNonce,
    });

    // Map API checks to timeline steps
    const checks = data.result.checks;
    // Step 0: chain data (always passes in demo)
    // Step 1: BBS+ signature checks (first few checks)
    // Step 2: Merkle (revocation check)
    // Step 3: Nullifier
    // Step 4: sanctions + AML
    // Step 5: expiration

    const stepMapping = [
      { idx: 0, label: "从链上读取 issuer_pubkey 和 merkle_root", pass: true },
    ];

    // Find checks by name patterns
    checks.forEach((c) => {
      if (c.check.includes("Commitment") || c.check.includes("signature") || c.check.includes("BBS") || c.check.includes("Hidden")) {
        stepMapping.push({ idx: 1, label: c.check + ": " + c.detail, pass: c.passed });
      } else if (c.check.includes("revok") || c.check.includes("撤销")) {
        stepMapping.push({ idx: 2, label: c.check + ": " + c.detail, pass: c.passed });
      } else if (c.check.includes("Nullifier") || c.check.includes("replay") || c.check.includes("新鲜")) {
        stepMapping.push({ idx: 3, label: c.check + ": " + c.detail, pass: c.passed });
      } else if (c.check.includes("sanction") || c.check.includes("AML") || c.check.includes("制裁")) {
        stepMapping.push({ idx: 4, label: c.check + ": " + c.detail, pass: c.passed });
      } else if (c.check.includes("expir") || c.check.includes("过期")) {
        stepMapping.push({ idx: 5, label: c.check + ": " + c.detail, pass: c.passed });
      }
    });

    // Animate each step sequentially
    const stepsToAnimate = [0, 1, 2, 3, 4, 5];
    let allPassed = true;

    for (const stepIdx of stepsToAnimate) {
      const stepEl = document.getElementById(`vt-step-${stepIdx}`);
      const statusEl = document.getElementById(`vt-status-${stepIdx}`);
      if (!stepEl) continue;

      // Activate
      stepEl.classList.add("active");
      if (statusEl) statusEl.textContent = "🔄 验证中...";
      stepEl.scrollIntoView({ behavior: "smooth", block: "center" });

      await sleep(800);

      // Check results for this step
      const results = stepMapping.filter((m) => m.idx === stepIdx);
      const passed = results.length === 0 || results.every((r) => r.pass);

      stepEl.classList.remove("active");
      stepEl.classList.add(passed ? "done" : "fail");

      if (passed) {
        if (statusEl) statusEl.textContent = "✅ 通过";
      } else {
        if (statusEl) statusEl.textContent = "❌ 失败 — " + results.filter((r) => !r.pass).map((r) => r.label).join("; ");
        allPassed = false;
      }

      await sleep(400);
    }

    // Show final verdict
    const finalEl = document.getElementById("vt-step-final");
    finalEl.style.display = "block";
    finalEl.classList.add(allPassed ? "done" : "fail");
    document.getElementById("vt-final-icon").textContent = allPassed ? "✅" : "❌";
    document.getElementById("vt-final-title").textContent = allPassed ? "最终判定：证明有效 — 可以安全交易！" : "最终判定：证明无效 — 请勿交易！";
    document.getElementById("vt-final-desc").textContent = allPassed
      ? "6 项检查全部通过，Alice 的 KYC 合规状态已确认。Bob 可以放心执行转账。"
      : "存在未通过的检查项，交易存在合规风险。";
    finalEl.scrollIntoView({ behavior: "smooth", block: "center" });

    // Show knowledge panel
    if (allPassed) {
      document.getElementById("bob-knowledge").style.display = "block";
    }

    markStepDone(5);
    document.getElementById("stat-verifs").textContent = `验证数: ${data.result.valid ? 1 : 0}`;
    updateExplanation(5, data);

  } catch (e) { alert("错误: " + e.message); }
  setLoading("btn-verify", false);
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// ── Step 6: Revoke ──
async function revokeCredential() {
  if (!appState.holderDid) { alert("没有用户可撤销。"); return; }
  setLoading("btn-revoke", true);
  try {
    const data = await api("/api/credential/revoke", { holder_did: appState.holderDid });
    markStepDone(6);
    const el = document.getElementById("revoke-result");
    el.innerHTML = `
      <div style="padding:16px; background:rgba(248,81,73,0.1); border:1px solid rgba(248,81,73,0.3); border-radius:8px;">
        <div style="font-size:16px; font-weight:700; color:var(--red); margin-bottom:8px;">🚫 凭证已撤销</div>
        <div style="font-size:13px; color:var(--text2);">
          <div>旧 Merkle 根: <code>${data.result.old_merkle_root.substring(0, 24)}...</code></div>
          <div>新 Merkle 根: <code>${data.result.new_merkle_root.substring(0, 24)}...</code></div>
          <div style="margin-top:8px; color:var(--orange);">⚠️ Merkle 根已变更 — 旧证明自动失效。</div>
        </div>
      </div>`;
    updateExplanation(6, data);
  } catch (e) { alert("错误: " + e.message); }
  setLoading("btn-revoke", false);
}

async function testRevokedProof() {
  setLoading("btn-revoke-test", true);
  try {
    const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
      b.toString(16).padStart(2, "0")).join("");
    const proofData = await api("/api/proof/generate", {
      holder_did: appState.holderDid, verifier_nonce: nonce,
      disclosed_fields: ["kycLevel", "sanctionClear", "amlCheck", "countryRisk"],
    });
    const verifyData = await api("/api/proof/verify", {
      proof: proofData.result.presentation.proof, verifier_nonce: nonce,
    });
    const el = document.getElementById("revoke-test-result");
    let html = '<ul class="check-list">';
    verifyData.result.checks.forEach((c) => {
      html += `
        <li class="check-item ${c.passed ? "pass" : "fail"}">
          <span class="check-icon">${c.passed ? "✓" : "✗"}</span>
          <div>
            <strong>${c.check}</strong>
            <div class="check-detail">${c.detail}</div>
          </div>
        </li>`;
    });
    html += "</ul>";
    html += `<div style="margin-top:12px; padding:14px; background:rgba(248,81,73,0.15); border-radius:8px; text-align:center;">
      <span style="font-size:24px;">❌</span>
      <div style="font-size:16px; font-weight:700; color:var(--red); margin-top:6px;">检测到已撤销的凭证！</div>
      <div style="font-size:12px; color:var(--text2); margin-top:4px;">证明已生成但在 Merkle 根检查中验证失败。</div>
    </div>`;
    el.innerHTML = html;
  } catch (e) { alert("错误: " + e.message); }
  setLoading("btn-revoke-test", false);
}

// ── Step 7: Unlinkability ──
async function createUser2() {
  setLoading("btn-user2", true);
  try {
    await api("/api/user/kyc", {
      name: "王小华", country: "HK", id_number: "H7654321", kyc_level: 2,
    });
    document.getElementById("btn-user2").textContent = "✅ 用户 Charlie 已创建";
    document.getElementById("btn-user2").disabled = true;
  } catch (e) { alert("错误: " + e.message); }
  setLoading("btn-user2", false);
}

async function demoUnlinkability() {
  setLoading("btn-unlink", true);
  try {
    const data = await api("/api/demo/unlinkability", {});
    markStepDone(7);
    const el = document.getElementById("unlink-result");
    let html = `<table class="compare-table">
      <tr><th>证明 #</th><th>验证方随机数</th><th>Nullifier</th><th>证明哈希</th></tr>`;
    data.result.proofs.forEach((p, i) => {
      html += `<tr>
        <td style="color:var(--accent); font-weight:700;">证明 ${i + 1}</td>
        <td>${p.nonce}</td>
        <td>${p.nullifier.substring(0, 24)}...</td>
        <td>${p.proof_hash}</td>
      </tr>`;
    });
    html += "</table>";
    html += `<div style="margin-top:16px; display:grid; grid-template-columns:1fr 1fr; gap:12px;">
      <div style="padding:14px; background:rgba(248,81,73,0.1); border:1px solid rgba(248,81,73,0.2); border-radius:8px;">
        <div style="font-weight:700; color:var(--red); margin-bottom:6px;">❌ 传统 KYC</div>
        <div style="font-size:13px; color:var(--text2);">向 3 个商家出示护照 → 他们都知道你是同一个人</div>
      </div>
      <div style="padding:14px; background:rgba(63,185,80,0.1); border:1px solid rgba(63,185,80,0.2); border-radius:8px;">
        <div style="font-weight:700; color:var(--green); margin-bottom:6px;">✅ zkKYC</div>
        <div style="font-size:13px; color:var(--text2);">向 3 个商家出示 ZK 证明 → 每个商家看到完全不同的证明</div>
      </div>
    </div>`;
    html += `<div style="margin-top:16px; padding:16px; background:var(--bg); border-radius:8px; text-align:center;">
      <span style="font-size:32px;">🎉</span>
      <div style="font-size:18px; font-weight:700; color:var(--cyan); margin-top:8px;">演示完成！</div>
      <div style="font-size:13px; color:var(--text2); margin-top:6px;">
        你已经看到了完整的 zkKYC 生命周期：初始化 → 签发 → 证明 → 验证 → 撤销 → 不可关联性
      </div>
    </div>`;
    el.innerHTML = html;
    updateExplanation(7, data);
  } catch (e) { alert("错误: " + e.message); }
  setLoading("btn-unlink", false);
}

// ── Reset ──
async function resetAll() {
  try {
    await api("/api/reset", {});
    appState = { issuer: null, holderDid: null, credential: null, proof: null, verifierNonce: null, currentStep: 1 };
    updateStatusDot("dot-issuer", false);
    updateStatusDot("dot-user", false);
    updateStatusDot("dot-proof", false);
    document.getElementById("stat-creds").textContent = "凭证数: 0";
    document.getElementById("stat-verifs").textContent = "验证数: 0";
    document.querySelectorAll(".step-btn").forEach((b) => b.classList.remove("done"));
    ["issuer-result", "kyc-result", "proof-result"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) { el.style.display = "none"; el.innerHTML = ""; }
    });
    ["verify-checks", "revoke-result", "revoke-test-result", "unlink-result"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = "";
    });
    document.getElementById("btn-user2").textContent = "👤 创建用户 Charlie";
    document.getElementById("btn-user2").disabled = false;
    showStep(1);
  } catch (e) { alert("错误: " + e.message); }
}

// ── Init ──
generateNonce();
