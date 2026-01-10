// Shared JS for simple pages.
// Intentionally scoped to avoid side effects.

(function () {
  function wireTopbarMenu() {
    const toggle = document.getElementById("menuToggle");
    const menu = document.getElementById("mobileMenu");
    const backdrop = document.getElementById("menuBackdrop");

    if (!toggle || !menu) return;

    const navLinks = menu.querySelectorAll(".nav-link");

    const closeMenu = () => {
      menu.classList.remove("open");
      toggle.classList.remove("active");
      toggle.setAttribute("aria-expanded", "false");
      menu.setAttribute("hidden", "");
      backdrop?.setAttribute("hidden", "");
      document.body.classList.remove("nav-open");
      document.body.classList.remove("nav-locked");
    };

    const openMenu = () => {
      menu.removeAttribute("hidden");
      backdrop?.removeAttribute("hidden");
      menu.classList.add("open");
      toggle.classList.add("active");
      toggle.setAttribute("aria-expanded", "true");
      document.body.classList.add("nav-open");
      document.body.classList.add("nav-locked");
    };

    toggle.addEventListener("click", () => {
      const isOpen = menu.classList.contains("open");
      if (isOpen) closeMenu();
      else openMenu();
    });

    navLinks.forEach((link) => {
      link.addEventListener("click", () => closeMenu());
    });

    backdrop?.addEventListener("click", () => closeMenu());

    document.addEventListener("click", (e) => {
      if (!menu.classList.contains("open")) return;
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (menu.contains(target)) return;
      if (toggle.contains(target)) return;
      closeMenu();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menu.classList.contains("open")) closeMenu();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 980 && menu.classList.contains("open")) {
        closeMenu();
      }
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function getKpiMap(root) {
    const result = {};
    const nodes = root.querySelectorAll(".profile-kpis .kpi");
    for (const node of nodes) {
      const key = node
        .querySelector("strong")
        ?.textContent?.trim()
        ?.toLowerCase();
      const value = node.querySelector("span")?.textContent?.trim();
      if (key && value) result[key] = value;
    }
    return result;
  }

  function pickRiskTips(riskRaw) {
    const risk = (riskRaw || "").toLowerCase();
    if (!risk) {
      return [
        "Name the risk out loud (privately).",
        "Pick a smaller, calmer next step.",
        "Ask for feedback before doubling down.",
      ];
    }

    const tips = [];
    const push = (t) => tips.push(t);

    if (risk.includes("criticism") || risk.includes("overreact")) {
      push("Pause 10 seconds before responding; reread the message once.");
      push("Separate facts from tone: write one sentence of each.");
      push("Choose a proportional reply (shorter than your impulse).");
    } else if (risk.includes("manipulat")) {
      push("State your intent plainly before persuading.");
      push("Ask for consent: ‘Do you want influence or options?’");
      push("Trade control for alignment: share the ‘why’ and let them choose.");
    } else if (
      risk.includes("over-test") ||
      risk.includes("overtest") ||
      risk.includes("test")
    ) {
      push("Timebox experiments: 20 minutes, then decide.");
      push("Define ‘good enough’ before you start iterating.");
      push("Ship a v1 with one metric; improve after real feedback.");
    } else if (
      risk.includes("combative") ||
      risk.includes("de-escalate") ||
      risk.includes("deescalate")
    ) {
      push("Create an exit ramp: ‘I need 10 minutes; I’ll come back.’");
      push("Lower volume + slow speech; your nervous system follows.");
      push("Ask one curiosity question to shift from fight to solve.");
    } else if (risk.includes("overconfiden")) {
      push("Run a 60-second pre-mortem: ‘How could this fail?’");
      push("Invite one critic early (before it’s public).");
      push("Add a ‘stop rule’: what evidence would change your mind?");
    } else if (risk.includes("literal")) {
      push("Confirm intent: ‘Do you mean X, or are you pointing at Y?’");
      push("Summarize in plain language; ask them to correct you.");
      push("Look for the ‘job to be done’ behind the words.");
    } else if (risk.includes("detached") || risk.includes("tone")) {
      push("Lead with one sentence of empathy before facts.");
      push("Name the human impact: ‘That sounds frustrating.’");
      push("Add warmth without over-explaining: shorter, kinder.");
    } else if (risk.includes("guarded")) {
      push("Share one small truth (low risk) to build trust.");
      push("Ask for help on one specific thing (not everything).");
      push("Replace ‘protect’ with ‘clarify’: say what you need.");
    } else if (risk.includes("rigid")) {
      push("Try a reversible experiment instead of a permanent rule.");
      push("Ask: ‘What would I do if I felt 20% safer?’");
      push("Build an exception list: when is flexibility allowed?");
    } else if (risk.includes("isolat")) {
      push("Schedule connection like a task (two short check-ins/week).");
      push("Swap withdrawal for a boundary: ‘I’m offline until 6.’");
      push("Delegate one decision to reduce solo pressure.");
    } else if (risk.includes("naive")) {
      push("Trust—but verify: ask one follow-up question.");
      push("Set a small boundary; see who respects it.");
      push("Make a ‘red flags’ list for patterns you ignore.");
    } else if (risk.includes("inconsisten")) {
      push("Create one non-negotiable daily anchor (5 minutes).");
      push("Reduce choices: turn decisions into defaults.");
      push("Commit in smaller chunks (today > this week > forever).");
    } else if (risk.includes("overwhel")) {
      push("Ask: ‘Do you want intensity or calm right now?’");
      push("Dial your message down 15%—you’ll still be heard.");
      push("Use shorter bursts, then pause for feedback.");
    } else if (risk.includes("authentic")) {
      push("Do a 2-minute values check: ‘What do I actually believe?’");
      push("Say one true thing even if it’s less impressive.");
      push("Pick one audience you never perform for.");
    } else if (risk.includes("confuse") || risk.includes("communication")) {
      push("Use one subject per message; avoid ‘mixed signals’.");
      push("Repeat key points as a checklist.");
      push("Ask for a read-back: ‘What did you hear?’");
    } else if (risk.includes("fixat")) {
      push("Write a ‘stop condition’ before you start.");
      push("Zoom out: what problem are you trying to solve?");
      push("Add a second goal (health/relationships) to balance.");
    } else if (risk.includes("unintended") || risk.includes("consequence")) {
      push("Run an impact check: who gets hit if this goes wrong?");
      push("Do smaller prototypes before big launches.");
      push("Ask a cautious friend: ‘What am I missing?’");
    } else if (risk.includes("impact")) {
      push("Track one win/week so you see your influence.");
      push("Ask others what they noticed you changed.");
      push("Let yourself take up space—quiet impact still counts.");
    } else {
      push("Name the pattern in one sentence.");
      push("Choose one boundary to protect your energy.");
      push("Ask for a second opinion before escalating.");
    }

    return tips.slice(0, 3);
  }

  function pickEdgeUses(edgeRaw) {
    const edge = (edgeRaw || "").toLowerCase();
    const uses = [];
    const push = (t) => uses.push(t);

    if (edge.includes("aware") || edge.includes("observ")) {
      push("Spot the real problem early; say it kindly and clearly.");
      push("Use your read of the room to prevent avoidable conflict.");
      push("Turn intuition into notes: write what you’re seeing.");
    } else if (edge.includes("charis") || edge.includes("memorable")) {
      push("Set the tone: warmth + clarity makes people follow.");
      push("Use influence for alignment, not leverage.");
      push("Build trust by being consistent in public and private.");
    } else if (edge.includes("empath")) {
      push("Name emotions quickly; people calm down when seen.");
      push("Use support strategically: help the bottleneck first.");
      push("Protect your battery: empathy works when it’s bounded.");
    } else if (
      edge.includes("resource") ||
      edge.includes("iterat") ||
      edge.includes("precision")
    ) {
      push("Create a simple process, then improve it with feedback.");
      push("Make the invisible visible: checklists, labels, steps.");
      push("Aim for ‘repeatable’ more than ‘perfect’.");
    } else if (
      edge.includes("resilien") ||
      edge.includes("patience") ||
      edge.includes("reliab") ||
      edge.includes("consisten")
    ) {
      push("Be the anchor: keep promises, keep pace, keep calm.");
      push("Use endurance to outlast chaos—then rest on purpose.");
      push("Stability is power when you pair it with flexibility.");
    } else if (
      edge.includes("strateg") ||
      edge.includes("mission") ||
      edge.includes("follow")
    ) {
      push("Pick a clear objective and cut distractions.");
      push("Plan two moves ahead, but communicate one step at a time.");
      push("Use momentum: finish the smallest next action today.");
    } else if (edge.includes("curios") || edge.includes("creativ")) {
      push("Ask better questions; curiosity is your superpower.");
      push("Prototype quickly: small experiments beat big fantasies.");
      push("Channel creativity into systems, not just sparks.");
    } else {
      push(`Lean into ${edgeRaw}: use it deliberately, not reflexively.`);
      push("Turn your edge into a repeatable habit.");
      push("Teach your edge to someone else—then you own it.");
    }

    return uses.slice(0, 3);
  }

  function buildSkillBars(edgeRaw, riskRaw) {
    const edge = (edgeRaw || "").toLowerCase();
    const risk = (riskRaw || "").toLowerCase();

    const base = {
      "Self-control": 66,
      Awareness: 66,
      Courage: 66,
      Empathy: 66,
      Discipline: 66,
    };

    if (edge.includes("aware") || edge.includes("observ"))
      base["Awareness"] = 86;
    if (edge.includes("charis") || edge.includes("memorable"))
      base["Courage"] = 78;
    if (edge.includes("empath")) base["Empathy"] = 86;
    if (edge.includes("precision")) base["Discipline"] = 82;
    if (edge.includes("iterat") || edge.includes("resource"))
      base["Discipline"] = 78;
    if (
      edge.includes("resilien") ||
      edge.includes("patience") ||
      edge.includes("reliab") ||
      edge.includes("consisten")
    )
      base["Self-control"] = 82;
    if (
      edge.includes("strateg") ||
      edge.includes("mission") ||
      edge.includes("follow")
    )
      base["Courage"] = 82;

    if (
      risk.includes("overreact") ||
      risk.includes("de-escal") ||
      risk.includes("combative")
    )
      base["Self-control"] = Math.max(56, base["Self-control"] - 12);
    if (risk.includes("overanaly") || risk.includes("too literal"))
      base["Courage"] = Math.max(56, base["Courage"] - 10);
    if (risk.includes("avoid conflict") || risk.includes("isolat"))
      base["Courage"] = Math.max(56, base["Courage"] - 8);
    if (
      risk.includes("manipulat") ||
      risk.includes("detached") ||
      risk.includes("tone")
    )
      base["Empathy"] = Math.max(56, base["Empathy"] - 8);

    return base;
  }

  function enhanceScpProfilePages() {
    const root = document.querySelector(".scp-profile");
    if (!root) return;

    // Prevent double-insertion.
    if (root.querySelector("#manual")) return;

    const kpis = getKpiMap(root);
    const coreVibe = kpis["core vibe"] || "";
    const mainEdge = kpis["main edge"] || "";
    const mainRisk = kpis["main risk"] || "";

    const profileTitle =
      root.querySelector(".profile-title")?.textContent?.trim() ||
      "Your SCP profile";
    const roles = coreVibe
      .split("/")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 6);

    const leftColumn = root.querySelector(".profile-layout > div");
    if (!leftColumn) return;

    const insertBefore = leftColumn.querySelector("#faq") || null;

    const edgeUses = pickEdgeUses(mainEdge);
    const riskTips = pickRiskTips(mainRisk);
    const skills = buildSkillBars(mainEdge, mainRisk);

    const manual = document.createElement("div");
    manual.className = "profile-card";
    manual.id = "manual";
    manual.style.marginTop = "16px";
    manual.innerHTML = `
			<div class="section-title"><h3 style="margin:0">Operating manual</h3></div>
			<p class="note" style="margin-top:10px">A practical way to use <strong>${escapeHtml(
        profileTitle
      )}</strong> as a self-coaching page.</p>
			${
        roles.length
          ? `<div class="pill-row" aria-label="Archetype tags">${roles
              .map((r) => `<span class="pill">${escapeHtml(r)}</span>`)
              .join("")}</div>`
          : ""
      }
			<div class="grid-3" style="margin-top:12px">
				<div class="mini-card">
					<p class="note">Do more of</p>
					<ul class="list">${edgeUses
            .map((t) => `<li>${escapeHtml(t)}</li>`)
            .join("")}</ul>
				</div>
				<div class="mini-card">
					<p class="note">Watch for</p>
					<ul class="list">
						<li><strong>${escapeHtml(
              mainRisk || "A predictable stress-pattern"
            )}</strong></li>
						<li>Escalating too fast (speed beats accuracy)</li>
						<li>Making it personal when it’s just a signal</li>
					</ul>
				</div>
				<div class="mini-card">
					<p class="note">Best environments</p>
					<ul class="list">
						<li>Clear rules + freedom inside the rules</li>
						<li>Fast feedback loops (so you can adjust)</li>
						<li>People who value outcomes over ego</li>
					</ul>
				</div>
			</div>
			<div class="callout" style="margin-top:14px"><strong>One-line mantra:</strong> Use your edge (<strong>${escapeHtml(
        mainEdge || "your strength"
      )}</strong>) with intention, and slow your risk (<strong>${escapeHtml(
      mainRisk || "your slip"
    )}</strong>) with a pause.</div>
		`.trim();

    const stress = document.createElement("div");
    stress.className = "profile-card";
    stress.id = "stress";
    stress.style.marginTop = "16px";
    stress.innerHTML = `
			<div class="section-title"><h3 style="margin:0">Stress map (fast reset)</h3></div>
			<p class="note" style="margin-top:10px">When stress hits, your pattern is predictable. That’s good news—you can train the counter-move.</p>
			<div class="grid-3" style="margin-top:12px">
				<div class="mini-card">
					<p class="note">Trigger</p>
					<ul class="list">
						<li>Ambiguity, disrespect, or loss of control</li>
						<li>High stakes with low clarity</li>
						<li>Feeling misunderstood</li>
					</ul>
				</div>
				<div class="mini-card">
					<p class="note">Reflex</p>
					<ul class="list">
						<li>Lean harder into <strong>${escapeHtml(
              mainEdge || "your edge"
            )}</strong></li>
						<li>Protect the ego / protect the plan</li>
						<li>Move fast to end discomfort</li>
					</ul>
				</div>
				<div class="mini-card">
					<p class="note">Counter-move</p>
					<ul class="list">${riskTips
            .map((t) => `<li>${escapeHtml(t)}</li>`)
            .join("")}</ul>
				</div>
			</div>
		`.trim();

    const skillStack = document.createElement("div");
    skillStack.className = "profile-card";
    skillStack.id = "skills";
    skillStack.style.marginTop = "16px";
    skillStack.innerHTML = `
			<div class="section-title"><h3 style="margin:0">Skill stack</h3></div>
			<p class="note" style="margin-top:10px">Not a test score—just a training dashboard. Raise the lowest bar first.</p>
			<div class="bars" aria-label="Skill bars">
				${Object.entries(skills)
          .map(([label, value]) =>
            `
							<div class="bar">
								<div class="label">${escapeHtml(label)}</div>
								<div class="track" role="img" aria-label="${escapeHtml(label)} ${escapeHtml(
              value
            )}%">
									<div class="fill" style="width:${Math.max(8, Math.min(100, value))}%"></div>
								</div>
							</div>
						`.trim()
          )
          .join("")}
			</div>
		`.trim();

    const plan = document.createElement("div");
    plan.className = "profile-card";
    plan.id = "plan";
    plan.style.marginTop = "16px";
    plan.innerHTML = `
			<div class="section-title"><h3 style="margin:0">7-day upgrade plan</h3></div>
			<p class="note" style="margin-top:10px">One week is enough to change a default reaction. Keep it tiny, keep it daily.</p>
			<ul class="list" style="margin-top:10px">
				<li><strong>Day 1:</strong> Write your top trigger and your most common response.</li>
				<li><strong>Day 2:</strong> Practice a 10-second pause before any reply under stress.</li>
				<li><strong>Day 3:</strong> Use your edge (<strong>${escapeHtml(
          mainEdge || "your strength"
        )}</strong>) once on purpose.</li>
				<li><strong>Day 4:</strong> Ask one clarifying question instead of assuming intent.</li>
				<li><strong>Day 5:</strong> Choose one boundary that protects your energy.</li>
				<li><strong>Day 6:</strong> Get feedback from one person you trust.</li>
				<li><strong>Day 7:</strong> Review: where did <strong>${escapeHtml(
          mainRisk || "your risk"
        )}</strong> show up? Adjust one habit.</li>
			</ul>
			<div class="callout" style="margin-top:14px"><strong>Rule:</strong> If you miss a day, don’t restart. Continue.</div>
		`.trim();

    const scripts = document.createElement("div");
    scripts.className = "profile-card";
    scripts.id = "scripts";
    scripts.style.marginTop = "16px";
    scripts.innerHTML = `
			<div class="section-title"><h3 style="margin:0">Scripts (copy/paste)</h3></div>
			<p class="note" style="margin-top:10px">Short phrases you can use when your nervous system is loud.</p>
			<div class="scripts">
				<div class="script"><strong>Buy time:</strong> “I want to respond well. Give me 10 minutes and I’ll come back.”</div>
				<div class="script"><strong>Clarify:</strong> “When you said that, did you mean X, or were you pointing at Y?”</div>
				<div class="script"><strong>Own your edge:</strong> “My strength is ${escapeHtml(
          mainEdge || "this"
        )}. I’m going to use it to help, not to push.”</div>
				<div class="script"><strong>Call out the risk:</strong> “I’m noticing ${escapeHtml(
          mainRisk || "a stress pattern"
        )}. I’m going to slow down before I decide.”</div>
			</div>
		`.trim();

    // Insert in a consistent order across all SCP pages.
    leftColumn.insertBefore(manual, insertBefore);
    leftColumn.insertBefore(stress, insertBefore);
    leftColumn.insertBefore(skillStack, insertBefore);
    leftColumn.insertBefore(plan, insertBefore);
    leftColumn.insertBefore(scripts, insertBefore);

    // Extend the TOC if present.
    const toc = root.querySelector(".aside-sticky .toc");
    if (toc) {
      const insertBeforeToc =
        toc.querySelector('a[href="#faq"]')?.closest("li") ||
        toc.querySelector('a[href="#related"]')?.closest("li") ||
        null;

      const ensureLink = (id, label) => {
        if (toc.querySelector(`a[href="#${id}"]`)) return;
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = `#${id}`;
        a.textContent = label;
        li.appendChild(a);
        toc.insertBefore(li, insertBeforeToc);
      };

      ensureLink("manual", "Operating manual");
      ensureLink("stress", "Stress map");
      ensureLink("skills", "Skill stack");
      ensureLink("plan", "7-day plan");
      ensureLink("scripts", "Scripts");
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    wireTopbarMenu();
  });

  try {
    enhanceScpProfilePages();
  } catch {
    // Silent fail: never break page rendering.
  }
})();
