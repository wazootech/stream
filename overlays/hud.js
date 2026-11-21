// @ts-check
(() => {
  const { $, watchState, remainingMs, formatClock } = window.Lab;
  const layout = new URLSearchParams(location.search).get("layout");
  document.body.dataset.layout = layout === "compact" ? "compact" : "sidebar";

  /** @type {import("../src/state.ts").State | null} */
  let state = null;

  function renderStatic() {
    $("goal").textContent = state?.goal || "Warming up the lab";

    const tasks = $("tasks");
    tasks.replaceChildren();
    if (!state || state.tasks.length === 0) {
      const li = document.createElement("li");
      li.className = "empty";
      li.textContent = "No experiments yet.";
      tasks.append(li);
    } else {
      for (const task of state.tasks) {
        const li = document.createElement("li");
        li.className = task.done ? "done" : "";
        const text = document.createElement("span");
        text.textContent = task.text;
        li.append(text);
        tasks.append(li);
      }
    }

    const p = state?.predictions;
    $("prediction").textContent = p?.current || "Nothing on the record yet.";
    $("score").textContent = p && p.total > 0
      ? `Called it ${p.hits} of ${p.total}`
      : "";
  }

  function renderTimer() {
    const timer = state?.timer ?? null;
    const left = remainingMs(timer);
    $("timer").classList.toggle("done", !!timer && left === 0);
    $("timer-label").textContent = timer
      ? (left === 0 ? `${timer.label}: time!` : timer.label)
      : "No timer running";
    $("clock").textContent = timer ? formatClock(left) : "--:--";
    $("bar").style.width = timer
      ? `${(1 - left / timer.durationMs) * 100}%`
      : "0%";
  }

  watchState((next) => {
    state = next;
    renderStatic();
    renderTimer();
  });
  setInterval(renderTimer, 250);
  renderStatic();
  renderTimer();
})();
