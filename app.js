// --- DATA ENGINE ---
let transactions = JSON.parse(localStorage.getItem('my_finance_data')) || [];

function saveToDisk() {
    localStorage.setItem('my_finance_data', JSON.stringify(transactions));
}

function calculateBalance() { return transactions.reduce((acc, curr) => acc + curr.amount, 0); }
function calculateTotal(type) {
    return transactions.filter(t => type === 'income' ? t.amount > 0 : t.amount < 0).reduce((acc, curr) => acc + curr.amount, 0);
}

// --- NAVIGATION ---
function navigate(page) {
    const content = document.getElementById('app-content');
    content.style.opacity = '0';
    content.style.transform = 'translateY(10px)';
    setTimeout(() => {
        renderPage(page);
        content.style.opacity = '1';
        content.style.transform = 'translateY(0)';
        updateNavUI(page);
    }, 200);
}

function updateNavUI(page) {
    // Remove 'active' class from all items
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    
    // Add 'active' class to the current page
    const activeBtn = document.getElementById(`nav-${page}`);
    if(activeBtn) activeBtn.classList.add('active');
}

// --- RENDERING ---
function renderPage(page) {
    const content = document.getElementById('app-content');
    const balance = calculateBalance();
    const income = calculateTotal('income');
    const expense = calculateTotal('expense');

    if (page === 'dashboard') {
        content.innerHTML = `
            <div class="text-center mb-10">
                <p class="text-slate-400 text-sm font-medium mb-1">Current Balance</p>
                <h1 class="text-5xl font-bold tracking-tight">₹${balance.toLocaleString(undefined, {minimumFractionDigits: 2})}</h1>
            </div>
            <div class="grid grid-cols-2 gap-4 mb-8">
                <div class="glass-card p-5 rounded-2xl">
                    <p class="text-xs text-slate-400">Total Income</p>
                    <p class="text-lg font-semibold text-emerald-400">₹${income.toLocaleString()}</p>
                </div>
                <div class="glass-card p-5 rounded-2xl">
                    <p class="text-xs text-slate-400">Total Expense</p>
                    <p class="text-lg font-semibold text-rose-400">₹${Math.abs(expense).toLocaleString()}</p>
                </div>
            </div>
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-medium">Recent Activity</h3>
                <button onclick="navigate('history')" class="text-xs text-slate-400 hover:text-white">See all</button>
            </div>
            <div class="space-y-3">
                ${transactions.length === 0 ? '<p class="text-center text-slate-500 py-10">No transactions yet</p>' : 
                  transactions.slice(-5).reverse().map(t => renderTransactionItem(t)).join('')}
            </div>
        `;
    } else if (page === 'add') {
        content.innerHTML = `
            <div class="h-full flex flex-col">
                <h2 class="text-3xl font-bold mb-8 mt-4">New Entry</h2>
                <div class="flex gap-3 mb-8">
                    <button id="type-income" onclick="setType('income')" class="flex-1 py-3 rounded-2xl glass text-sm font-medium transition-all type-btn-active">Income</button>
                    <button id="type-expense" onclick="setType('expense')" class="flex-1 py-3 rounded-2xl glass text-sm font-medium transition-all">Expense</button>
                </div>
                <div class="space-y-6">
                    <input id="amount" type="number" placeholder="Amount" class="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-2xl font-medium focus:outline-none">
                    <input id="desc" type="text" placeholder="Label (e.g. Salary)" class="w-full bg-white/10 border border-white/10 rounded-2xl p-4 focus:outline-none">
                    <select id="cat" class="w-full bg-white/10 border border-white/10 rounded-2xl p-4 appearance-none focus:outline-none">
                        <option class="bg-slate-900" value="Work">Work / Salary</option>
                        <option class="bg-slate-900" value="Food">Food & Drinks</option>
                        <option class="bg-slate-900" value="Shopping">Shopping</option>
                        <option class="bg-slate-900" value="Bills">Bills & Rent</option>
                        <option class="bg-slate-900" value="Other">Other</option>
                    </select>
                </div>
                <button onclick="saveTransaction()" class="mt-auto mb-12 w-full bg-white text-slate-900 font-bold py-4 rounded-2xl shadow-xl active:scale-95 transition-all">Save Transaction</button>
            </div>
        `;
    } else if (page === 'history') {
        content.innerHTML = `
            <h2 class="text-3xl font-bold mb-8 mt-4">History</h2>
            <div class="space-y-3">
                ${transactions.length === 0 ? '<p class="text-center text-slate-500 py-10">No records found</p>' : 
                  transactions.slice().reverse().map(t => renderTransactionItem(t)).join('')}
            </div>
        `;
    } else if (page === 'settings') {
        content.innerHTML = `
            <h2 class="text-3xl font-bold mb-8 mt-4">Settings</h2>
            <div class="space-y-4">
                <div class="glass-card p-6 rounded-2xl">
                    <h3 class="font-semibold mb-2">Backup Data</h3>
                    <p class="text-sm text-slate-400 mb-4">Download your data to a file so you don't lose it.</p>
                    <button onclick="exportData()" class="w-full py-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-medium active:scale-95 transition-all">Download Backup (.json)</button>
                </div>
                <div class="glass-card p-6 rounded-2xl">
                    <h3 class="font-semibold mb-2">Restore Data</h3>
                    <p class="text-sm text-slate-400 mb-4">Upload a backup file to restore your records.</p>
                    <input type="file" id="importFile" class="hidden" onchange="importData(event)">
                    <button onclick="document.getElementById('importFile').click()" class="w-full py-3 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl font-medium active:scale-95 transition-all">Upload Backup File</button>
                </div>
                <div class="glass-card p-6 rounded-2xl">
                    <h3 class="font-semibold mb-2 text-rose-400">Danger Zone</h3>
                    <p class="text-sm text-slate-400 mb-4">Delete all your records forever.</p>
                    <button onclick="clearAllData()" class="w-full py-3 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl font-medium active:scale-95 transition-all">Clear All Data</button>
                </div>
            </div>
        `;
    }
}

function renderTransactionItem(t) {
    const isPositive = t.amount > 0;
    return `
        <div class="glass-card p-4 rounded-2xl flex items-center justify-between active:scale-95 transition-all">
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-xl ${isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'} flex items-center justify-center font-bold">${t.name.charAt(0).toUpperCase()}</div>
                <div>
                    <p class="font-medium text-sm">${t.name}</p>
                    <p class="text-xs text-slate-500">${t.category} • ${t.date}</p>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <p class="font-semibold ${isPositive ? 'text-emerald-400' : 'text-white'}">${isPositive ? '+' : ''}${t.amount.toFixed(2)}</p>
                <button onclick="deleteTransaction(${t.id})" class="text-slate-600 hover:text-rose-400"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
            </div>
        </div>
    `;
}

let currentType = 'income';
function setType(type) {
    currentType = type;
    document.getElementById('type-income').classList.toggle('type-btn-active', type === 'income');
    document.getElementById('type-expense').classList.toggle('type-btn-active', type === 'expense');
}

function saveTransaction() {
    const amountVal = parseFloat(document.getElementById('amount').value);
    const desc = document.getElementById('desc').value;
    const cat = document.getElementById('cat').value;
    if (!amountVal || !desc) return alert("Please fill in all fields");
    transactions.push({ id: Date.now(), name: desc, amount: currentType === 'income' ? amountVal : -amountVal, category: cat, date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) });
    saveToDisk();
    navigate('dashboard');
}

function deleteTransaction(id) {
    if(confirm('Delete?')) {
        transactions = transactions.filter(t => t.id !== id);
        saveToDisk();
        navigate('history');
    }
}

function exportData() {
    const dataStr = JSON.stringify(transactions, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lumi_backup_${new Date().toLocaleDateString()}.json`;
    link.click();
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (Array.isArray(imported)) {
                transactions = imported;
                saveToDisk();
                alert("Data restored successfully!");
                navigate('dashboard');
            }
        } catch (err) { alert("Invalid backup file"); }
    };
    reader.readAsText(file);
}

function clearAllData() {
    if(confirm('Delete all records?')) {
        transactions = [];
        saveToDisk();
        navigate('dashboard');
    }
}

window.onload = () => navigate('dashboard');