(() => {
  "use strict";
  const endpoint = window.URGENTE_READERS_CONFIG?.endpoint;
  let serviceReady = false;
  try {
    const url = new URL(endpoint);
    serviceReady = url.protocol === "https:" || (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname));
  } catch { /* Forms stay unavailable until configured. */ }
  const fragment = new URLSearchParams(location.hash.slice(1));
  const token = fragment.get("token");
  if (token) history.replaceState(null, "", location.pathname + location.search);
  document.querySelectorAll("[data-reader-form]").forEach((form) => {
    const action = form.dataset.readerForm;
    const button = form.querySelector("button[type=submit]");
    const status = form.querySelector(".form-status");
    let pending = false;
    if (serviceReady && (action !== "unsubscribe" || token)) {
      button.disabled = false;
      status.textContent = "";
    } else if (action === "unsubscribe" && !token) {
      status.textContent = "Abra o link de cancelamento recebido por e-mail. Nenhuma inscrição foi alterada.";
    }
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (pending || button.disabled || !form.reportValidity()) return;
      pending = true;
      button.disabled = true;
      form.setAttribute("aria-busy", "true");
      status.dataset.state = "pending";
      status.textContent = "Enviando…";
      const fields = new FormData(form);
      const payload = { action, nome: fields.get("nome") || "", email: fields.get("email") || "", mensagem: fields.get("mensagem") || "", consent: fields.get("consent") === "on", website: fields.get("website") || "", token: action === "unsubscribe" ? token : undefined };
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: controller.signal, credentials: "omit", referrerPolicy: "no-referrer" });
        const result = await response.json();
        if (!response.ok || result.ok !== true) throw new Error(result.error || "Não foi possível concluir. Tente novamente mais tarde.");
        status.dataset.state = "success";
        status.textContent = result.message;
        form.reset();
      } catch (error) {
        status.dataset.state = "error";
        status.textContent = error.name === "AbortError" ? "O serviço demorou a responder. Seus campos foram preservados. Confira seu e-mail antes de tentar novamente." : "Não foi possível concluir. Seus campos foram preservados. Tente novamente mais tarde.";
      } finally {
        clearTimeout(timeout);
        pending = false;
        button.disabled = action === "unsubscribe" && status.dataset.state === "success";
        form.removeAttribute("aria-busy");
      }
    });
  });
})();