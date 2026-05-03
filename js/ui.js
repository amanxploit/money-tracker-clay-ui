// ============================================================
// ui.js — All DOM rendering & event binding
// Handles page-specific UI for Dashboard, Add, and History.
// ============================================================

const UI = {

  // ==================== Dashboard ====================
  async renderDashboard() {
    await App.reload();

    // Balance card
    const balEl = document.getElementById("total-balance");
    if (balEl) {
      const balance = App.getTotalBalance();
      balEl.textContent = App.formatCurrency(balance);
      balEl.className = balance >= 0 ? "amount positive" : "amount negative";
    }

    // Today spending
    const todayEl = document.getElementById("today-spending");
    if (todayEl) {
      todayEl.textContent = App.formatCurrency(App.getTodaySpending());
    }

    // Totals
    const incEl = document.getElementById("total-income");
    if (incEl) incEl.textContent = App.formatCurrency(App.getTotalIncome());

    const expEl = document.getElementById("total-expense");
    if (expEl) expEl.textContent = App.formatCurrency(App.getTotalExpense());

    // Recent transactions
    const listEl = document.getElementById("recent-list");
    if (listEl) {
      const recent = App.transactions.slice(0, 5);
      listEl.innerHTML = recent.length
        ? recent.map((t) => UI.transactionCard(t)).join("")
        : '<p class="empty-state">No transactions yet. Start adding!</p>';
    }

    // Daily summary
    const summaryEl = document.getElementById("daily-summary");
    if (summaryEl) {
      const summary = App.getDailySummary().slice(0, 7);
      summaryEl.innerHTML = summary.length
        ? summary.map((d) => UI.dailySummaryCard(d)).join("")
        : '<p class="empty-state">No data to summarise.</p>';
    }
  },

  // ==================== Transaction Card ====================
  transactionCard(t) {
    const isIncome = t.type === "income";
    return `
      <div class="clay-card transaction-item" data-id="${t.id}">
        <div class="transaction-icon">${App.categoryEmoji(t.category)}</div>
        <div class="transaction-info">
          <span class="transaction-category">${t.category}${t.person ? " · " + t.person : ""}</span>
          <span class="transaction-date">${App.formatDate(t.date)} · ${App.formatTime(t.timestamp)}</span>
          ${t.notes ? `<span class="transaction-notes">${t.notes}</span>` : ""}
        </div>
        <span class="transaction-amount ${isIncome ? "positive" : "negative"}">
          ${isIncome ? "+" : "-"}${App.formatCurrency(t.amount).replace("-", "")}
        </span>
      </div>`;
  },

  // ==================== Daily Summary Card ====================
  dailySummaryCard(d) {
    const net = d.income - d.expense;
    return `
      <div class="clay-card summary-item">
        <div class="summary-date">${App.formatDate(d.date)}</div>
        <div class="summary-figures">
          <span class="positive">+${App.formatCurrency(d.income).replace("-", "")}</span>
          <span class="separator">·</span>
          <span class="negative">-${App.formatCurrency(d.expense).replace("-", "")}</span>
          <span class="separator">·</span>
          <span class="${net >= 0 ? "positive" : "negative"}">
            Net: ${App.formatCurrency(net)}
          </span>
        </div>
      </div>`;
  },

  // ==================== Add Transaction Page ====================
  initAddPage() {
    const form = document.getElementById("add-form");
    const amountInput = document.getElementById("amount");
    const quickBtns = document.querySelectorAll(".quick-btn");
    const typeRadios = document.querySelectorAll('input[name="type"]');
    const dateInput = document.getElementById("date");

    // Auto-fill today's date
    if (dateInput) dateInput.value = App.getTodayString();

    // Quick add buttons
    quickBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const current = parseFloat(amountInput.value) || 0;
        const add = parseFloat(btn.dataset.amount);
        amountInput.value = (current + add).toFixed(0);
      });
    });

    // Type toggle changes category options
    typeRadios.forEach((radio) => {
      radio.addEventListener("change", () => {
        UI.updateCategoryOptions(radio.value);
      });
    });

    // Form submit
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const type = document.querySelector('input[name="type"]:checked').value;
        const data = {
          amount: amountInput.value,
          type,
          category: document.getElementById("category").value,
          person: document.getElementById("person").value.trim(),
          notes: document.getElementById("notes").value.trim(),
          date: document.getElementById("date").value,
        };

        if (!data.amount || parseFloat(data.amount) <= 0) {
          UI.showToast("Please enter a valid amount", "error");
          return;
        }

        await App.saveTransaction(data);
        UI.showToast(`${type === "income" ? "Income" : "Expense"} added!`, "success");
        form.reset();
        if (dateInput) dateInput.value = App.getTodayString();
        document.getElementById("amount").focus();
      });
    }

    // Set default type
    UI.updateCategoryOptions("expense");
  },

  // Category lists
  updateCategoryOptions(type) {
    const select = document.getElementById("category");
    if (!select) return;
    const categories = {
      income: ["Salary", "Freelance", "Gift", "Investment", "Other"],
      expense: ["Food", "Transport", "Shopping", "Bills", "Health", "Education", "Entertainment", "Other"],
    };
    select.innerHTML = categories[type]
      .map((c) => `<option value="${c}">${App.categoryEmoji(c)} ${c}</option>`)
      .join("");
  },

  // ==================== History Page ====================
  async renderHistory(startDate, endDate) {
    await App.reload();

    const listEl = document.getElementById("history-list");
    if (!listEl) return;

    let transactions = App.transactions;
    if (startDate && endDate) {
      transactions = App.filterByDate(startDate, endDate);
    }

    if (transactions.length === 0) {
      listEl.innerHTML = '<p class="empty-state">No transactions found.</p>';
      return;
    }

    listEl.innerHTML = transactions.map((t) => UI.historyCard(t)).join("");

    // Bind edit & delete buttons
    listEl.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = parseInt(btn.dataset.id);
        if (confirm("Delete this transaction?")) {
          await App.removeTransaction(id);
          UI.showToast("Transaction deleted", "success");
          await UI.renderHistory(
            document.getElementById("start-date")?.value,
            document.getElementById("end-date")?.value
          );
        }
      });
    });

    listEl.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.dataset.id);
        UI.openEditModal(id);
      });
    });
  },

  historyCard(t) {
    const isIncome = t.type === "income";
    return `
      <div class="clay-card history-item" data-id="${t.id}">
        <div class="history-left">
          <span class="history-emoji">${App.categoryEmoji(t.category)}</span>
          <div class="history-info">
            <strong>${t.category}${t.person ? " · " + t.person : ""}</strong>
            <small>${App.formatDate(t.date)} · ${App.formatTime(t.timestamp)}</small>
            ${t.notes ? `<small class="muted">${t.notes}</small>` : ""}
          </div>
        </div>
        <div class="history-right">
          <span class="transaction-amount ${isIncome ? "positive" : "negative"}">
            ${isIncome ? "+" : "-"}${App.formatCurrency(t.amount).replace("-", "")}
          </span>
          <div class="history-actions">
            <button class="edit-btn clay-btn-sm" data-id="${t.id}" title="Edit">✏️</button>
            <button class="delete-btn clay-btn-sm" data-id="${t.id}" title="Delete">🗑️</button>
          </div>
        </div>
      </div>`;
  },

  // ==================== Edit Modal ====================
  async openEditModal(id) {
    const t = await getTransaction(id);
    if (!t) return;

    const modal = document.getElementById("edit-modal");
    const overlay = document.getElementById("modal-overlay");

    document.getElementById("edit-amount").value = t.amount;
    document.getElementById("edit-type").value = t.type;
    UI.updateEditCategories(t.type);
    document.getElementById("edit-category").value = t.category;
    document.getElementById("edit-person").value = t.person;
    document.getElementById("edit-notes").value = t.notes;
    document.getElementById("edit-date").value = t.date;
    document.getElementById("edit-id").value = t.id;

    // Listen for type change to update categories
    document.getElementById("edit-type").addEventListener("change", function () {
      UI.updateEditCategories(this.value);
    });

    modal.classList.add("active");
    overlay.classList.add("active");
  },

  updateEditCategories(type) {
    const select = document.getElementById("edit-category");
    const categories = {
      income: ["Salary", "Freelance", "Gift", "Investment", "Other"],
      expense: ["Food", "Transport", "Shopping", "Bills", "Health", "Education", "Entertainment", "Other"],
    };
    select.innerHTML = categories[type]
      .map((c) => `<option value="${c}">${App.categoryEmoji(c)} ${c}</option>`)
      .join("");
  },

  closeEditModal() {
    document.getElementById("edit-modal").classList.remove("active");
    document.getElementById("modal-overlay").classList.remove("active");
  },

  async submitEdit() {
    const data = {
      amount: document.getElementById("edit-amount").value,
      type: document.getElementById("edit-type").value,
      category: document.getElementById("edit-category").value,
      person: document.getElementById("edit-person").value.trim(),
      notes: document.getElementById("edit-notes").value.trim(),
      date: document.getElementById("edit-date").value,
    };
    const id = parseInt(document.getElementById("edit-id").value);

    if (!data.amount || parseFloat(data.amount) <= 0) {
      UI.showToast("Enter a valid amount", "error");
      return;
    }

    await App.editTransaction(id, data);
    UI.closeEditModal();
    UI.showToast("Transaction updated!", "success");
    await UI.renderHistory(
      document.getElementById("start-date")?.value,
      document.getElementById("end-date")?.value
    );
  },

  // ==================== History Filter ====================
  initHistoryFilters() {
    const startInput = document.getElementById("start-date");
    const endInput = document.getElementById("end-date");
    const filterBtn = document.getElementById("filter-btn");
    const clearBtn = document.getElementById("clear-filter-btn");

    if (filterBtn) {
      filterBtn.addEventListener("click", async () => {
        await UI.renderHistory(startInput.value, endInput.value);
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", async () => {
        startInput.value = "";
        endInput.value = "";
        await UI.renderHistory();
      });
    }
  },

  // ==================== Toast Notification ====================
  showToast(message, type = "success") {
    const container = document.getElementById("toast-container") || (() => {
      const c = document.createElement("div");
      c.id = "toast-container";
      document.body.appendChild(c);
      return c;
    })();

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  },
};