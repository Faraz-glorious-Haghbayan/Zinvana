/* Shared quiz shell behavior (based on perfect-country.html)
   - Works with block-question quizzes that already contain .question[data-question]
   - Expects answer buttons with data-option and data-value attributes
*/

(function () {
  "use strict";

  const QUIZ_CONTAINER_ID = "quizContainer";
  const RESULT_CONTAINER_ID = "result";

  const STATE = {
    answers: {},
    currentQuestion: 1,
    totalQuestions: 0,
    resultTemplate: "",
    optionTitles: {},
    answeredCount: 0,
    streak: 0,
    xp: 0,
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function $(sel, root = document) {
    return root.querySelector(sel);
  }

  function $all(sel, root = document) {
    return Array.from(root.querySelectorAll(sel));
  }

  function safeText(value) {
    return String(value ?? "");
  }

  function escapeHtml(str) {
    return safeText(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function trackQuizEvent(eventName, payload) {
    // Keep it compatible with perfect-country.html; no-op if not present.
    try {
      if (typeof window.gtag === "function") {
        window.gtag("event", eventName, payload || {});
      }
    } catch {
      // ignore
    }
  }

  function getTotalQuestions() {
    return $all(".question[data-question]").length;
  }

  function setText(id, text) {
    const node = byId(id);
    if (node) node.textContent = text;
  }

  function isAddictiveShellForButton(button) {
    const shell = button?.closest?.(".quiz-shell");
    return shell?.getAttribute("data-addictive") === "true";
  }

  function updateAddictiveUI() {
    setText("streakValue", `${STATE.streak}`);
    setText("xpValue", `${STATE.xp}`);
  }

  function setMicroFeedback(text) {
    const node = byId("microFeedback");
    if (!node) return;
    node.innerHTML = text;
  }

  function setProgress(percent) {
    const bar = byId("progressBar");
    if (bar) bar.style.width = `${percent}%`;

    const orb = byId("progressOrb");
    if (orb) orb.style.setProperty("--progress", `${percent}%`);

    setText("progressDialValue", `${percent}%`);
    setText("progressLabel", `Progress: ${percent}%`);
  }

  function updateQuestionIndicators() {
    const questionNum = clamp(
      STATE.currentQuestion,
      1,
      STATE.totalQuestions || 1
    );
    setText("questionNumber", `${questionNum}`);
    setText("questionTotal", `${STATE.totalQuestions}`);
    setText("questionNumberTop", `${questionNum}`);
    setText("questionTotalTop", `${STATE.totalQuestions}`);

    const percent = Math.round(
      ((questionNum - 1) / (STATE.totalQuestions || 1)) * 100
    );
    setProgress(percent);
  }

  function setActiveQuestion(questionNum) {
    $all(".question").forEach((q) => q.classList.remove("active"));
    const q = $(`.question[data-question=\"${questionNum}\"]`);
    if (q) q.classList.add("active");

    STATE.currentQuestion = questionNum;
    updateQuestionIndicators();

    // restore selection
    const selectedValue = STATE.answers[questionNum];
    if (selectedValue) {
      $all(".answer-btn", q).forEach((btn) => {
        const v = btn.getAttribute("data-value") || "";
        btn.classList.toggle("selected", v === selectedValue);
      });
    }

    trackQuizEvent("quiz_question_view", { question: questionNum });
  }

  function parseScoresFromValue(dataValue) {
    if (!dataValue) return {};
    try {
      const obj = JSON.parse(dataValue);
      if (obj && typeof obj === "object") return obj;
    } catch {
      // ignore
    }
    // fallback: treat as a single key with +1
    return { [dataValue]: 1 };
  }

  function inferValueFromButton(btn) {
    const dimension = btn.getAttribute("data-dimension");
    const trait = btn.getAttribute("data-trait");
    if (dimension && trait) {
      // MBTI-style scoring: each answer increments a dimension-letter bucket.
      // Example: {"MBTI_EI_E": 1}
      return JSON.stringify({ [`MBTI_${dimension}_${trait}`]: 1 });
    }

    return (
      btn.getAttribute("data-value") ||
      btn.getAttribute("data-country") ||
      btn.getAttribute("data-scientist") ||
      btn.getAttribute("data-character") ||
      btn.getAttribute("data-wojak") ||
      btn.getAttribute("data-player") ||
      btn.getAttribute("data-result") ||
      ""
    );
  }

  function isMbtiQuiz() {
    return Boolean(
      document.querySelector(".answer-btn[data-dimension][data-trait]")
    );
  }

  function normalizeAnswerButtonMarkup(btn) {
    // Convert common existing patterns into the perfect-country button structure.
    // Supported input structures:
    // - <span class="wojak-badge"><img .../></span> + <span class="answer-text">...</span>
    // - Any single text node / span that should become the description
    const existingBadge =
      btn.querySelector(".answer-badge") ||
      btn.querySelector(
        ".wojak-badge, .character-badge, .player-badge, .creator-badge, .option-badge"
      );
    const existingText =
      btn.querySelector(".answer-description") ||
      btn.querySelector(".answer-text");

    // Ensure chevron
    if (!btn.querySelector(".chevron")) {
      const chev = document.createElement("span");
      chev.className = "chevron";
      chev.textContent = "→";
      btn.appendChild(chev);
    }

    // If already normalized, nothing to do.
    if (
      btn.querySelector(".answer-content") &&
      btn.querySelector(".answer-badge")
    )
      return;

    // Badge
    if (existingBadge && !existingBadge.classList.contains("answer-badge")) {
      existingBadge.classList.add("answer-badge");
      existingBadge.classList.remove(
        "wojak-badge",
        "character-badge",
        "player-badge",
        "creator-badge",
        "option-badge"
      );
    }
    if (!btn.querySelector(".answer-badge")) {
      const badge = document.createElement("span");
      badge.className = "answer-badge";
      badge.textContent = "✦";
      btn.insertBefore(badge, btn.firstChild);
    }

    // Content wrapper
    let content = btn.querySelector(".answer-content");
    if (!content) {
      content = document.createElement("span");
      content.className = "answer-content";
      // Insert after badge
      const badge = btn.querySelector(".answer-badge");
      badge?.insertAdjacentElement("afterend", content);
    }

    // Title
    let title = content.querySelector(".answer-title");
    if (!title) {
      title = document.createElement("span");
      title.className = "answer-title";

      const shell = btn.closest(".quiz-shell");
      const hideTitles =
        shell?.getAttribute("data-hide-option-titles") === "true";

      // For character-image quizzes (e.g., Squid Game) we don't want
      // character names to appear in option UI.
      if (hideTitles && btn.hasAttribute("data-wojak")) {
        title.textContent = "";
      } else {
        // Prefer image alt / explicit data-label
        const img = btn.querySelector("img");
        const explicit =
          btn.getAttribute("data-label") ||
          btn.getAttribute("aria-label") ||
          "";
        const alt = img?.getAttribute("alt") || "";
        const fallback = inferValueFromButton(btn);

        const candidate = (explicit || alt || fallback || "Choice").replace(
          /\s*badge\s*$/i,
          ""
        );
        title.textContent = candidate;
      }
      content.appendChild(title);
    }

    // Description
    let desc = content.querySelector(".answer-description");
    if (!desc) {
      desc = document.createElement("span");
      desc.className = "answer-description";
      const textValue = existingText?.textContent?.trim();
      desc.textContent = textValue || "";
      content.appendChild(desc);
    }

    // Remove legacy answer-text node if present
    if (existingText && existingText.classList.contains("answer-text")) {
      existingText.remove();
    }

    // If this quiz uses data-wojak keys, show the character GIF in the badge.
    const wojakKey = btn.getAttribute("data-wojak");
    const shell = btn.closest(".quiz-shell");
    const hideTitles =
      shell?.getAttribute("data-hide-option-titles") === "true";
    if (hideTitles && wojakKey) {
      const badge = btn.querySelector(".answer-badge");
      if (badge) {
        let src = "";
        try {
          // squidgame.html defines a global wojakData object (top-level const).
          // It may not be on window, but it's still accessible as a global binding.
          if (typeof wojakData !== "undefined" && wojakData?.[wojakKey]?.img) {
            src = wojakData[wojakKey].img;
          }
        } catch {
          // ignore
        }

        if (!src) src = `${wojakKey}.gif`;

        // Avoid re-injecting if already an image badge.
        if (!badge.querySelector("img")) {
          badge.textContent = "";
          const img = document.createElement("img");
          img.src = src;
          img.alt = "";
          img.loading = "lazy";
          img.decoding = "async";
          badge.appendChild(img);
        }
      }
    }
  }

  function deterministicPick(keys, seed) {
    if (!keys.length) return "";
    const str = String(seed || "0");
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % keys.length;
    return keys[idx];
  }

  function computeScores() {
    const scores = {};
    for (const questionKey of Object.keys(STATE.answers)) {
      const qNum = Number(questionKey);
      const val = STATE.answers[qNum];
      const delta = parseScoresFromValue(val);
      for (const [k, v] of Object.entries(delta)) {
        scores[k] = (scores[k] || 0) + Number(v || 0);
      }
    }
    return scores;
  }

  function normalizeProfileMap() {
    // Supports common per-quiz names without modifying the quiz data itself.
    // Note: many quizzes declare their data via top-level `const fooData = {...}`.
    // In browsers, those are *not* attached to window, so we also probe global
    // lexical bindings via `typeof`.
    return (
      window.countryData ||
      (typeof countryData !== "undefined" ? countryData : null) ||
      window.wojakData ||
      (typeof wojakData !== "undefined" ? wojakData : null) ||
      window.creatorData ||
      (typeof creatorData !== "undefined" ? creatorData : null) ||
      window.scientistData ||
      (typeof scientistData !== "undefined" ? scientistData : null) ||
      window.characterData ||
      (typeof characterData !== "undefined" ? characterData : null) ||
      window.mbtiData ||
      (typeof mbtiData !== "undefined" ? mbtiData : null) ||
      window.mbtiProfiles ||
      (typeof mbtiProfiles !== "undefined" ? mbtiProfiles : null) ||
      window.profileData ||
      (typeof profileData !== "undefined" ? profileData : null) ||
      null
    );
  }

  function makeShareUrl(resultKey) {
    const url = new URL(window.location.href);
    url.searchParams.set("result", resultKey);
    return url.toString();
  }

  function shareTo(platform, resultKey, title) {
    const shareUrl = encodeURIComponent(makeShareUrl(resultKey));
    const shareText = encodeURIComponent(
      `I got ${title}! Take the quiz and see what you get:`
    );

    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
      twitter: `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
      whatsapp: `https://wa.me/?text=${shareText}%20${shareUrl}`,
    };

    const target = urls[platform];
    if (target) window.open(target, "_blank", "noopener,noreferrer");
  }

  async function copyLink(resultKey) {
    const url = makeShareUrl(resultKey);
    try {
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      alert("Link copied to clipboard!");
    }
  }

  function inferProfileUrl(resultKey) {
    if (!resultKey) return "";
    const slug = String(resultKey).trim().toLowerCase();
    if (!slug.startsWith("scp")) return "";
    const rest = slug.slice(3);
    if (!rest) return "";
    return `/scp-${rest}.html`;
  }

  function resultHtml(profile, scorePercent, resultKey) {
    const name = escapeHtml(profile?.name || profile?.title || resultKey);
    const tagline = escapeHtml(profile?.tagline || profile?.description || "");
    const story = escapeHtml(
      profile?.story ||
        profile?.deepAnalysis ||
        profile?.bio ||
        profile?.longDescription ||
        ""
    );

    const imageUrl =
      profile?.image ||
      profile?.img ||
      profile?.photo ||
      profile?.figure?.portrait ||
      profile?.figure?.image ||
      "";
    const flagEmoji = profile?.flag || profile?.emoji || "";

    const profileUrl =
      profile?.page ||
      profile?.url ||
      profile?.href ||
      profile?.link ||
      inferProfileUrl(resultKey);

    const pillsSource =
      (Array.isArray(profile?.traits) && profile.traits) ||
      (Array.isArray(profile?.keywords) && profile.keywords) ||
      (Array.isArray(profile?.highlights) && profile.highlights) ||
      (Array.isArray(profile?.strengths) && profile.strengths) ||
      [];

    const pills = pillsSource
      ? pillsSource
          .slice(0, 5)
          .map((t) => `<span class=\"result-pill\">${escapeHtml(t)}</span>`)
          .join("")
      : "";

    const highlightCards = [];
    if (Array.isArray(profile?.strengths) && profile.strengths.length) {
      highlightCards.push({
        title: "Superpowers",
        text: profile.strengths.slice(0, 3).join(" • "),
      });
    }
    if (Array.isArray(profile?.challenges) && profile.challenges.length) {
      highlightCards.push({
        title: "Watch outs",
        text: profile.challenges.slice(0, 3).join(" • "),
      });
    }
    if (Array.isArray(profile?.idealProjects) && profile.idealProjects.length) {
      highlightCards.push({
        title: "Best projects",
        text: profile.idealProjects.slice(0, 3).join(" • "),
      });
    }
    if (profile?.growthAdvice) {
      highlightCards.push({
        title: "Growth advice",
        text: profile.growthAdvice,
      });
    }

    const fallbackSvg =
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='640' height='640'>
          <rect width='640' height='640' rx='40' fill='#e2e8f0'/>
          <text x='50%' y='52%' text-anchor='middle' font-family='system-ui, -apple-system, Segoe UI, Roboto, Arial' font-size='42' font-weight='800' fill='#475569'>No image</text>
        </svg>`
      );

    const imageHtml = imageUrl
      ? `<img src=\"${escapeHtml(
          imageUrl
        )}\" alt=\"${name}\" loading=\"lazy\" decoding=\"async\" onerror=\"this.onerror=null;this.src='${fallbackSvg}'\" />`
      : `<img src=\"${fallbackSvg}\" alt=\"${name}\" loading=\"lazy\" decoding=\"async\" />`;

    return `
      <div class="result-shell">
        <div class="result-hero">
          <div class="result-identity">
            <span class="result-label">Your result</span>
            <div class="result-flag">${
              flagEmoji
                ? `<span class=\"flag-emoji\">${escapeHtml(flagEmoji)}</span>`
                : ""
            }</div>
            <div class="result-name">${name}</div>
            <div class="result-tagline">${tagline}</div>
            ${pills ? `<div class=\"result-pills\">${pills}</div>` : ""}
          </div>
          <div class="result-media">
            ${imageHtml}
            <div class="result-score-chip"><span>Match</span><strong>${scorePercent}%</strong></div>
          </div>
        </div>

        <div class="result-body">
          ${story ? `<div class=\"result-story\">${story}</div>` : ""}
          ${
            highlightCards.length
              ? `<div class=\"result-highlights\">${highlightCards
                  .slice(0, 4)
                  .map(
                    (c) =>
                      `<div class=\"highlight-card\"><h4>${escapeHtml(
                        c.title
                      )}</h4><p>${escapeHtml(c.text)}</p></div>`
                  )
                  .join("")}</div>`
              : ""
          }

          <div class="result-actions">
            ${
              profileUrl
                ? `<a class="result-profile-link" href="${escapeHtml(
                    profileUrl
                  )}">Open full SCP profile <span class="arrow">→</span></a>`
                : ""
            }
            <button class="restart-btn" onclick="restartQuiz()">Retake quiz</button>
            <div class="share-buttons">
              <h4>Share your result</h4>
              <div class="share-row">
                <button class="share-btn" onclick="shareResult('facebook')">Facebook</button>
                <button class="share-btn" onclick="shareResult('twitter')">X</button>
                <button class="share-btn" onclick="shareResult('linkedin')">LinkedIn</button>
                <button class="share-btn" onclick="shareResult('whatsapp')">WhatsApp</button>
                <button class="share-btn" onclick="copyResultLink()">Copy link</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function calculateResult() {
    if (isMbtiQuiz()) {
      const scores = computeScores();
      const seed = Object.values(STATE.answers).join("|");

      const dims = [
        ["EI", "E", "I"],
        ["SN", "S", "N"],
        ["TF", "T", "F"],
        ["JP", "J", "P"],
      ];

      function scoreFor(dim, letter) {
        return Number(scores[`MBTI_${dim}_${letter}`] || 0);
      }

      function pickLetter(dim, a, b) {
        const aScore = scoreFor(dim, a);
        const bScore = scoreFor(dim, b);
        if (aScore === bScore) {
          return deterministicPick([a, b], `${seed}|${dim}`) || a;
        }
        return aScore > bScore ? a : b;
      }

      const bestKey = dims.map(([dim, a, b]) => pickLetter(dim, a, b)).join("");

      let sumMax = 0;
      for (const [dim, a, b] of dims) {
        sumMax += Math.max(scoreFor(dim, a), scoreFor(dim, b));
      }

      const maxPossible = Math.max(1, STATE.totalQuestions);
      const percent = clamp(Math.round((sumMax / maxPossible) * 100), 0, 100);
      return { bestKey, percent, scores };
    }

    const scores = computeScores();
    const entries = Object.entries(scores);
    if (!entries.length) return null;

    entries.sort((a, b) => b[1] - a[1]);
    const topScore = entries[0][1];
    const topKeys = entries.filter(([, v]) => v === topScore).map(([k]) => k);

    const seed = Object.values(STATE.answers).join("|");
    const bestKey =
      topKeys.length === 1 ? topKeys[0] : deterministicPick(topKeys, seed);

    const maxPossible = Math.max(1, STATE.totalQuestions);
    const percent = clamp(Math.round((topScore / maxPossible) * 100), 0, 100);

    return { bestKey, percent, scores };
  }

  function showResult() {
    const quizContainer = byId(QUIZ_CONTAINER_ID);
    const resultContainer = byId(RESULT_CONTAINER_ID);
    if (!resultContainer) return;

    const result = calculateResult();
    if (!result) return;

    const profileMap = normalizeProfileMap();
    const profile = profileMap ? profileMap[result.bestKey] : null;

    resultContainer.innerHTML = resultHtml(
      profile,
      result.percent,
      result.bestKey
    );
    resultContainer.classList.add("show");

    if (quizContainer) quizContainer.style.display = "none";

    window.__lastQuizResultKey = result.bestKey;
    window.__lastQuizResultTitle =
      profile?.name || profile?.title || result.bestKey;

    trackQuizEvent("quiz_completed", {
      result: result.bestKey,
      scorePercent: result.percent,
    });

    setProgress(100);
  }

  function selectOption(button) {
    const questionEl = button.closest(".question");
    if (!questionEl) return;
    const questionNum = Number(questionEl.getAttribute("data-question") || "1");

    $all(".answer-btn", questionEl).forEach((b) =>
      b.classList.remove("selected")
    );
    button.classList.add("selected");

    const prevValue = STATE.answers[questionNum];
    const dataValue = button.getAttribute("data-value") || "";
    STATE.answers[questionNum] = dataValue;

    if (isAddictiveShellForButton(button)) {
      const isNewAnswer = !prevValue;
      if (isNewAnswer) {
        STATE.answeredCount += 1;
        STATE.streak += 1;
        STATE.xp += 10;
      }

      updateAddictiveUI();

      const lines = [
        "<span><strong>Locked in.</strong> Keep going.</span>",
        "<span><strong>Nice.</strong> Momentum builds results.</span>",
        "<span><strong>Good pick.</strong> Trust the instinct.</span>",
        "<span><strong>Clean choice.</strong> One step closer.</span>",
      ];
      const idx = Math.max(0, (STATE.answeredCount - 1) % lines.length);
      const isLast = questionNum >= (STATE.totalQuestions || 1);
      setMicroFeedback(
        isLast
          ? "<span><strong>Final answer.</strong> Calculating your hero…</span>"
          : lines[idx]
      );
    }

    trackQuizEvent("quiz_answer", {
      question: questionNum,
      option: button.getAttribute("data-option") || "",
    });

    // auto-advance like perfect-country
    if (questionNum < STATE.totalQuestions) {
      setTimeout(() => setActiveQuestion(questionNum + 1), 220);
    } else {
      setTimeout(showResult, 260);
    }
  }

  function buildOptionTitles() {
    STATE.optionTitles = {};
    $all(".question[data-question]").forEach((q) => {
      const qNum = Number(q.getAttribute("data-question") || "0");
      STATE.optionTitles[qNum] = {};
      $all(".answer-btn", q).forEach((btn) => {
        const option = btn.getAttribute("data-option") || "";
        const title = $(".answer-title", btn)?.textContent?.trim();
        if (option && title) STATE.optionTitles[qNum][option] = title;
      });
    });
  }

  function initQuizShell() {
    const quizContainer = byId(QUIZ_CONTAINER_ID);
    const resultContainer = byId(RESULT_CONTAINER_ID);

    STATE.totalQuestions = getTotalQuestions();

    if (resultContainer) {
      STATE.resultTemplate = resultContainer.innerHTML;
    }

    setText("questionTotal", `${STATE.totalQuestions}`);
    setText("questionTotalTop", `${STATE.totalQuestions}`);

    buildOptionTitles();

    // Normalize buttons and attach handlers
    $all(".answer-btn").forEach((btn) => {
      // Legacy quizzes often use inline onclick="selectAnswer(this)".
      // We remove it to avoid double-invocation (inline + addEventListener).
      if (btn.hasAttribute("onclick")) btn.removeAttribute("onclick");

      // Ensure every button has data-value
      if (!btn.getAttribute("data-value")) {
        const inferred = inferValueFromButton(btn);
        if (inferred) btn.setAttribute("data-value", inferred);
      }
      normalizeAnswerButtonMarkup(btn);
      btn.addEventListener("click", () => selectOption(btn));
    });

    // enable hash anchor for quiz section
    if (window.location.hash === "#quizSection") {
      const section = byId("quizSection");
      if (section)
        section.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // show stored result if result param exists
    const params = new URLSearchParams(window.location.search);
    const resultKey = params.get("result");
    if (resultKey && normalizeProfileMap()?.[resultKey]) {
      // mark finished state
      window.__lastQuizResultKey = resultKey;
      window.__lastQuizResultTitle =
        normalizeProfileMap()?.[resultKey]?.name ||
        normalizeProfileMap()?.[resultKey]?.title ||
        resultKey;

      const resultContainer = byId(RESULT_CONTAINER_ID);
      const profileMap = normalizeProfileMap();
      resultContainer.innerHTML = resultHtml(
        profileMap[resultKey],
        100,
        resultKey
      );
      resultContainer.classList.add("show");
      if (quizContainer) quizContainer.style.display = "none";
      setProgress(100);
      return;
    }

    // default start
    if (quizContainer) quizContainer.style.display = "block";
    if (resultContainer) resultContainer.classList.remove("show");

    STATE.answers = {};
    STATE.answeredCount = 0;
    STATE.streak = 0;
    STATE.xp = 0;
    updateAddictiveUI();
    setMicroFeedback(
      "<span><strong>Tip:</strong> Trust your first instinct.</span>"
    );
    setActiveQuestion(1);
  }

  // Expose a small public API to match perfect-country patterns
  window.selectOption = selectOption;
  // Many existing quizzes call selectAnswer() inline.
  window.selectAnswer = selectOption;
  window.restartQuiz = function restartQuiz() {
    const quizContainer = byId(QUIZ_CONTAINER_ID);
    const resultContainer = byId(RESULT_CONTAINER_ID);

    STATE.answers = {};
    STATE.answeredCount = 0;
    STATE.streak = 0;
    STATE.xp = 0;
    updateAddictiveUI();
    setMicroFeedback(
      "<span><strong>Tip:</strong> Trust your first instinct.</span>"
    );

    if (quizContainer) quizContainer.style.display = "block";
    if (resultContainer) {
      resultContainer.innerHTML =
        STATE.resultTemplate || resultContainer.innerHTML;
      resultContainer.classList.remove("show");
    }

    trackQuizEvent("quiz_restart");
    setActiveQuestion(1);
  };

  window.shareResult = function shareResult(platform) {
    const key = window.__lastQuizResultKey;
    const title = window.__lastQuizResultTitle || key;
    if (!key) return;
    shareTo(platform, key, title);
    trackQuizEvent("quiz_share", { platform });
  };

  window.copyResultLink = function copyResultLink() {
    const key = window.__lastQuizResultKey;
    if (!key) return;
    copyLink(key);
    trackQuizEvent("quiz_copy_link");
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initQuizShell);
  } else {
    initQuizShell();
  }
})();
