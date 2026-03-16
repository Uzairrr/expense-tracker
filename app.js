const EXPENSE_CATS = ["Food", "Transport", "Housing", "Entertainment", "Health", "Other"];
const INCOME_CATS  = ["Salary", "Freelance", "Investment", "Gift", "Other"];

const CAT_COLORS = {
  Food: "#f59e0b", Transport: "#38bdf8", Housing: "#a78bfa",
  Entertainment: "#f472b6", Health: "#34d399", Other: "#64748b",
  Salary: "#22c55e", Freelance: "#06b6d4", Investment: "#8b5cf6", Gift: "#fb923c",
};

const SAMPLE_ENTRIES = [
  { id: "e1", label: "Monthly salary",    amount: 2400, type: "income",  category: "Salary" },
  { id: "e2", label: "Freelance project", amount: 350,  type: "income",  category: "Freelance" },
  { id: "e3", label: "Rent",              amount: 850,  type: "expense", category: "Housing" },
  { id: "e4", label: "Groceries",         amount: 120,  type: "expense", category: "Food" },
  { id: "e5", label: "Netflix",           amount: 15,   type: "expense", category: "Entertainment" },
  { id: "e6", label: "Bus pass",          amount: 65,   type: "expense", category: "Transport" },
];

let entries = loadEntries();
let filter  = "all";

// ─── Init ────────────────────────────────────────────────────────────────────

function loadEntries() {
  try {
    return JSON.parse(localStorage.getItem("expense-entries")) || SAMPLE_ENTRIES;
  } catch {
    return SAMPLE_ENTRIES;
  }
}

function saveEntries() {
  localStorage.setItem("expense-entries", JSON.stringify(entries));
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// ─── Event listeners ─────────────────────────────────────────────────────────

document.getElementById("fType").addEventListener("change", syncCategories);
document.getElementById("addBtn").addEventListener("click", addEntry);

document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => setFilter(btn.dataset.filter));
});

document.getElementById("fLabel").addEventListener("keydown", (e) => {
  if (e.key === "Enter") addEntry();
});

// ─── Form ─────────────────────────────────────────────────────────────────────

function syncCategories() {
  const type = document.getElementById("fType").value;
  const cats = type === "income" ? INCOME_CATS : EXPENSE_CATS;
  document.getElementById("fCat").innerHTML = cats
    .map((c) => `<option value="${c}">${c}</option>`)
    .join("");
}

function addEntry() {
  const label    = document.getElementById("fLabel").value.trim();
  const amount   = parseFloat(document.getElementById("fAmount").value);
  const type     = document.getElementById("fType").value;
  const category = document.getElementById("fCat").value;
  const errorEl  = document.getElementById("formError");

  if (!label)                    { errorEl.textContent = "Enter a description."; return; }
  if (isNaN(amount) || amount <= 0) { errorEl.textContent = "Enter a valid amount."; return; }

  errorEl.textContent = "";
  entries.unshift({ id: uid(), label, amount, type, category });
  saveEntries();
  render();

  document.getElementById("fLabel").value  = "";
  document.getElementById("fAmount").value = "";
}

function deleteEntry(id) {
  entries = entries.filter((e) => e.id !== id);
  saveEntries();
  render();
}

function setFilter(f) {
  filter = f;
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.filter === f);
  });
  render();
}

// ─── Render ───────────────────────────────────────────────────────────────────

function render() {
  renderSummary();
  renderChart();
  renderList();
}

function renderSummary() {
  const totalIncome  = entries.filter((e) => e.type === "income").reduce((s, e)  => s + e.amount, 0);
  const totalExpense = entries.filter((e) => e.type === "expense").reduce((s, e) => s + e.amount, 0);
  const balance      = totalIncome - totalExpense;

  const balEl = document.getElementById("sumBalance");
  balEl.textContent  = "£" + Math.abs(balance).toFixed(2);
  balEl.style.color  = balance >= 0 ? "#22c55e" : "#f87171";

  document.getElementById("sumIncome").textContent  = "£" + totalIncome.toFixed(2);
  document.getElementById("sumExpense").textContent = "£" + totalExpense.toFixed(2);
}

function renderChart() {
  const catTotals = {};
  entries
    .filter((e) => e.type === "expense")
    .forEach((e) => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount; });

  const sorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
  const chartCard = document.getElementById("chartCard");

  if (!sorted.length) {
    chartCard.hidden = true;
    return;
  }

  chartCard.hidden = false;
  const maxVal = sorted[0][1];

  document.getElementById("chart").innerHTML = sorted
    .map(([cat, total]) => `
      <div class="bar-row">
        <div class="bar-top">
          <span class="bar-cat">${cat}</span>
          <span class="bar-amt">£${total.toFixed(2)}</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${(total / maxVal) * 100}%; background:${CAT_COLORS[cat] || "#64748b"}"></div>
        </div>
      </div>`)
    .join("");
}

function renderList() {
  const displayed = filter === "all" ? entries : entries.filter((e) => e.type === filter);
  const listEl    = document.getElementById("list");

  if (!displayed.length) {
    listEl.innerHTML = '<div class="empty">No entries yet</div>';
    return;
  }

  listEl.innerHTML = displayed
    .map((e) => `
      <div class="entry">
        <span class="entry-dot" style="background:${CAT_COLORS[e.category] || "#64748b"}"></span>
        <div class="entry-info">
          <div class="entry-name">${e.label}</div>
          <div class="entry-cat">${e.category}</div>
        </div>
        <span class="entry-amount" style="color:${e.type === "income" ? "#22c55e" : "#f87171"}">
          ${e.type === "income" ? "+" : "−"}£${e.amount.toFixed(2)}
        </span>
        <button class="entry-del" data-id="${e.id}">×</button>
      </div>`)
    .join("");

  listEl.querySelectorAll(".entry-del").forEach((btn) => {
    btn.addEventListener("click", () => deleteEntry(btn.dataset.id));
  });
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

syncCategories();
render();
