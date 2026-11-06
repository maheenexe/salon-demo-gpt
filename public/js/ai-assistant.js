(() => {
  const toggle = document.getElementById("salonAiToggle");
  const panel = document.getElementById("salonAiPanel");
  const close = document.getElementById("salonAiClose");
  const form = document.getElementById("salonAiForm");
  const input = document.getElementById("salonAiInput");
  const log = document.getElementById("salonAiMessages");
  const send = document.getElementById("salonAiSend");
  if (!toggle || !panel || !form) return;
  const history = [];
  function openPanel(open) {
    panel.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    if (open) input.focus();
    else toggle.focus();
  }
  toggle.addEventListener("click", () => openPanel(panel.hidden));
  close.addEventListener("click", () => openPanel(false));
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !panel.hidden) openPanel(false); });
  function bubble(message, who) {
    const el = document.createElement("p");
    el.className = "salon-ai-message " + who;
    el.textContent = message;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  }
  bubble("Welcome to Bhanu's The Hair Studio! Ask me about services, starting prices or booking.", "assistant");
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const question = input.value.trim();
    if (!question || send.disabled) return;
    input.value = "";
    bubble(question, "user");
    history.push({ role: "user", content: question.slice(0, 1200) });
    send.disabled = true;
    const pending = bubble("Thinking…", "assistant");
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.slice(-12) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to answer right now.");
      pending.textContent = data.reply;
      history.push({ role: "assistant", content: data.reply.slice(0, 1200) });
      if (history.length > 12) history.splice(0, history.length - 12);
    } catch (error) {
      pending.textContent = error.message || "Please try again later.";
      history.pop();
    } finally { send.disabled = false; input.focus(); }
  });
})();
