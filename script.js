// אתחול Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBFfuD-wxjz6AXqjeHIsCV_2Z4reflu2ps",
    authDomain: "constructionsalesinterface.firebaseapp.com",
    projectId: "constructionsalesinterface",
    storageBucket: "constructionsalesinterface.firebasestorage.app",
    messagingSenderId: "938358742695",
    appId: "1:938358742695:web:03ac6e8646528896b78582",
    measurementId: "G-4D1H3P382N"
  };
  
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// בדיקת התחברות
const currentUser = localStorage.getItem('currentUser');
if (!currentUser && !window.location.pathname.includes('index.html')) {
    window.location.href = 'index.html';
}

let customers = [];
let expenses = [];

async function loadCustomers() {
    try {
        customers = [];
        const snapshot = await db.collection('customers').get();
        snapshot.forEach(doc => customers.push({ id: doc.id, ...doc.data() }));
        localStorage.setItem(`customers_${currentUser}`, JSON.stringify(customers));
    } catch (error) {
        const storedCustomers = localStorage.getItem(`customers_${currentUser}`);
        if (storedCustomers) customers = JSON.parse(storedCustomers);
    }
    return customers;
}

async function saveCustomers(customersToSave) {
    try {
        localStorage.setItem(`customers_${currentUser}`, JSON.stringify(customersToSave));
        for (const customer of customersToSave) {
            await db.collection('customers').doc(customer.id).set(customer, { merge: true });
        }
    } catch (error) {
        alert('שגיאה בשמירת נתונים: ' + error.message);
    }
}

function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function addCommasToNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function calculateCommission(customer) {
    const projectPrice = parseFloat(customer.projectPrice) || 0;
    const projectExpenses = parseFloat(customer.projectExpenses) || 0;
    const leadCost = (parseFloat(customer.leadCost) || 0) / 100 * projectPrice;
    const dealerFee = (parseFloat(customer.dealerFee) || 0) / 100 * projectPrice;
    const commission = (projectPrice - leadCost - dealerFee - projectExpenses) / 2;
    return commission > 0 ? commission.toFixed(2) : 0;
}

function updateDashboardStats(customers) {
    const totalSales = customers.reduce((sum, c) => sum + (parseFloat(c.projectPrice) || 0), 0).toFixed(2);
    const totalProjects = customers.length;
    const totalCommission = customers.reduce((sum, c) => sum + parseFloat(calculateCommission(c)), 0).toFixed(2);
    document.querySelector('.value.sales').textContent = `$${addCommasToNumber(totalSales)}`;
    document.querySelector('.value.projects').textContent = addCommasToNumber(totalProjects);
    document.querySelector('.value.commission').textContent = `$${addCommasToNumber(totalCommission)}`;
}

function renderCustomers(customers) {
    const container = document.getElementById('customersList');
    if (!container) return;
    container.innerHTML = '';
    customers.forEach((customer, index) => {
        const card = document.createElement('div');
        card.className = 'customer-card';
        card.innerHTML = `
            <h3>${customer.name}</h3>
            <p><span>סוג פרויקט:</span> ${Array.isArray(customer.projectType) ? customer.projectType.join(', ') : customer.projectType}</p>
            <p><span>מחיר פרויקט:</span> $${addCommasToNumber(customer.projectPrice)}</p>
            <p><span>עמלה:</span> $${addCommasToNumber(calculateCommission(customer))}</p>
            <p><span>בנקים:</span> ${Array.isArray(customer.bank) ? customer.bank.join(', ') : customer.bank}</p>
            <span class="status ${customer.status.toLowerCase().replace(' ', '-')}">${customer.status}</span>
        `;
        card.addEventListener('click', () => window.location.href = `customer.html?id=${index}`);
        container.appendChild(card);
    });
}

function updateSelectedProjects() {
    const projectTypeSelect = document.getElementById('projectType');
    const selectedProjectsDiv = document.getElementById('selectedProjects');
    if (projectTypeSelect && selectedProjectsDiv) {
        selectedProjectsDiv.innerHTML = '';
        Array.from(projectTypeSelect.selectedOptions).map(option => option.value).forEach(project => {
            const tag = document.createElement('span');
            tag.className = `project-tag ${project.toLowerCase().replace(' ', '-')}`;
            tag.textContent = project;
            selectedProjectsDiv.appendChild(tag);
        });
    }
}

function updateSelectedBanks() {
    const bankSelect = document.getElementById('bank');
    const selectedBanksDiv = document.getElementById('selectedBanks');
    if (bankSelect && selectedBanksDiv) {
        selectedBanksDiv.innerHTML = '';
        Array.from(bankSelect.selectedOptions).map(option => option.value).forEach(bank => {
            const tag = document.createElement('span');
            tag.className = 'bank-tag';
            tag.textContent = bank;
            selectedBanksDiv.appendChild(tag);
        });
    }
}

function addExpense(amount) {
    expenses.push(parseFloat(amount).toFixed(2));
    updateProjectExpenses();
    renderExpenses();
}

function removeExpense(index) {
    expenses.splice(index, 1);
    updateProjectExpenses();
    renderExpenses();
}

function renderExpenses() {
    const expenseList = document.getElementById('expenseList');
    if (expenseList) {
        expenseList.innerHTML = '';
        expenses.forEach((expense, index) => {
            const expenseItem = document.createElement('div');
            expenseItem.className = 'expense-item';
            expenseItem.innerHTML = `
                $${addCommasToNumber(expense)}
                <button class="remove-expense" onclick="removeExpense(${index})"><i class="fas fa-times"></i></button>
            `;
            expenseList.appendChild(expenseItem);
        });
    }
}

function updateProjectExpenses() {
    const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense), 0);
    document.getElementById('projectExpenses').value = totalExpenses.toFixed(2);
}

function updateMoneyUsed() {
    const projectPrice = parseFloat(document.getElementById('projectPrice').value) || 0;
    document.getElementById('moneyUsed').value = projectPrice.toFixed(2);
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', async function() {
    await loadCustomers();
    if (window.location.pathname.includes('dashboard.html')) updateDashboardStats(customers);
    if (window.location.pathname.includes('customers.html')) renderCustomers(customers);

    const addCustomerForm = document.getElementById('addCustomerForm');
    if (addCustomerForm) {
        addCustomerForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const newCustomer = {
                id: generateUniqueId(),
                name: document.getElementById('customerName').value,
                address: document.getElementById('address').value,
                phone: document.getElementById('phone').value,
                age: document.getElementById('age').value,
                contractDate: document.getElementById('contractDate').value,
                projectType: Array.from(document.getElementById('projectType').selectedOptions).map(option => option.value),
                projectPrice: document.getElementById('projectPrice').value,
                projectExpenses: document.getElementById('projectExpenses').value,
                paymentMethod: document.querySelector('input[name="paymentMethod"]:checked')?.value,
                leadCost: document.getElementById('leadCost').value,
                dealerFee: document.getElementById('dealerFee').value,
                bank: Array.from(document.getElementById('bank').selectedOptions).map(option => option.value),
                terms: document.getElementById('terms').value,
                maxApproved: document.getElementById('maxApproved').value,
                moneyUsed: document.getElementById('moneyUsed').value,
                status: document.getElementById('status').value
            };
            customers.push(newCustomer);
            await saveCustomers(customers);
            window.location.href = 'customers.html';
        });

        document.getElementById('projectPrice')?.addEventListener('input', updateMoneyUsed);
        document.getElementById('addExpenseBtn')?.addEventListener('click', () => {
            const amount = prompt("הזן סכום הוצאה ($):");
            if (amount && !isNaN(amount) && parseFloat(amount) > 0) addExpense(amount);
        });
        document.getElementById('projectType')?.addEventListener('change', updateSelectedProjects);
        document.getElementById('bank')?.addEventListener('change', updateSelectedBanks);
    }

    document.getElementById('logoutBtn')?.addEventListener('click', logout);
});