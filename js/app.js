// ============================================================
// app.js — Core logic for Money Manager
// Handles data processing, calculations, and state.
// ============================================================

const App = {
  transactions: [],

  // ---------- Initialise ----------
  async init() {
    this.transactions = await getAllTransactions();
    this.transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },

  // ---------- Reload from DB ----------
  async reload() {
    await this.init();
  },

  // ---------- Save new transaction ----------
  async saveTransaction(data) {
    const transaction = {
      amount: parseFloat(data.amount),
      type: data.type, // "income" or "expense"
      category: data.category,
      person: data.person || "",
      notes: data.notes || "",
      date: data.date || this.getTodayString(),
      timestamp: new Date().toISOString(),
    };
    await addTransaction(transaction);
    await this.reload();
    return transaction;
  },

  // ---------- Edit existing transaction ----------
  async editTransaction(id, data) {
    const existing = await getTransaction(id);
    if (!existing) return null;

    Object.assign(existing, {
      amount: parseFloat(data.amount),
      type: data.type,
      category: data.category,
      person: data.person || "",
      notes: data.notes || "",
      date: data.date || this.getTodayString(),
    });
    await updateTransaction(existing);
    await this.reload();
    return existing;
  },

  // ---------- Remove transaction ----------
  async removeTransaction(id) {
    await deleteTransaction(id);
    await this.reload();
  },

  // ==================== Calculations ====================

  // Total balance (income - expense)
  getTotalBalance() {
    return this.transactions.reduce((sum, t) => {
      return t.type === "income" ? sum + t.amount : sum - t.amount;
    }, 0);
  },

  // Today's total spending
  getTodaySpending() {
    const today = this.getTodayString();
    return this.transactions
      .filter((t) => t.type === "expense" && t.date === today)
      .reduce((sum, t) => sum + t.amount, 0);
  },

  // Total income
  getTotalIncome() {
    return this.transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
  },

  // Total expense
  getTotalExpense() {
    return this.transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
  },

  // Daily summary — grouped by date
  getDailySummary() {
    const map = {};
    this.transactions.forEach((t) => {
      if (!map[t.date]) {
        map[t.date] = { income: 0, expense: 0, transactions: [] };
      }
      if (t.type === "income") map[t.date].income += t.amount;
      else map[t.date].expense += t.amount;
      map[t.date].transactions.push(t);
    });
    // Sort dates descending
    return Object.entries(map)
      .sort((a, b) => new Date(b[0]) - new Date(a[0]))
      .map(([date, data]) => ({ date, ...data }));
  },

  // Filter transactions by date range
  filterByDate(start, end) {
    return this.transactions.filter((t) => {
      return t.date >= start && t.date <= end;
    });
  },

  // ==================== Helpers ====================

  getTodayString() {
    return new Date().toISOString().split("T")[0];
  },

  formatCurrency(amount) {
    const sign = amount < 0 ? "-" : "";
    const abs = Math.abs(amount);
    const formatted = abs.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${sign}₹${formatted}`;
  },

  formatDate(dateStr) {
    const options = { day: "numeric", month: "short", year: "numeric" };
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", options);
  },

  formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  },

  // Category emoji map
  categoryEmoji(category) {
    const map = {
      Food: "🍔",
      Transport: "🚗",
      Shopping: "🛍️",
      Bills: "📄",
      Health: "🏥",
      Education: "📚",
      Entertainment: "🎬",
      Salary: "💰",
      Freelance: "💻",
      Gift: "🎁",
      Investment: "📈",
      Other: "📌",
    };
    return map[category] || "📌";
  },
};