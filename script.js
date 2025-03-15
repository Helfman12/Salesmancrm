// אתחול Firebase (הספריות יוטענו ב-HTML)
const firebaseConfig = {
    apiKey: "AIzaSyBFfuD-wxjz6AXqjeHIsCV_2Z4reflu2ps",
    authDomain: "constructionsalesinterface.firebaseapp.com",
    projectId: "constructionsalesinterface",
    storageBucket: "constructionsalesinterface.firebasestorage.app",
    messagingSenderId: "938358742695",
    appId: "1:938358742695:web:03ac6e8646528896b78582",
    measurementId: "G-4D1H3P382N"
  };
  
// אתחול Firebase ו-Firestore
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// בדיקת התחברות
const currentUser = localStorage.getItem('currentUser');
if (!currentUser && !window.location.pathname.includes('index.html')) {
    window.location.href = 'index.html';
}

let customers = []; // מערך גלובלי ללקוחות
let expenses = []; // מערך זמני להוצאות

// טעינת לקוחות מ-Firestore
async function loadCustomers() {
    try {
        customers = [];
        const snapshot = await db.collection('customers').get();
        snapshot.forEach(doc => {
            customers.push({ id: doc.id, ...doc.data() });
        });
        console.log(`טענתי ${customers.length} לקוחות מ-Firestore:`, customers);
        localStorage.setItem(`customers_${currentUser}`, JSON.stringify(customers));
    } catch (error) {
        console.error('שגיאה בטעינת לקוחות:', error);
        const storedCustomers = localStorage.getItem(`customers_${currentUser}`);
        if (storedCustomers) {
            customers = JSON.parse(storedCustomers);
            console.log(`טענתי ${customers.length} לקוחות מ-Local Storage:`, customers);
        }
    }
    return customers;
}

// שמירת לקוחות
async function saveCustomers(customersToSave) {
    try {
        localStorage.setItem(`customers_${currentUser}`, JSON.stringify(customersToSave));
        console.log(`שמרתי ${customersToSave.length} לקוחות ב-Local Storage`);
        for (const customer of customersToSave) {
            await db.collection('customers').doc(customer.id).set(customer, { merge: true });
        }
        console.log(`סנכרנתי ${customersToSave.length} לקוחות ל-Firestore`);
    } catch (error) {
        console.error('שגיאה בשמירת לקוחות:', error);
        alert('שגיאה בשמירת נתונים: ' + error.message);
    }
}

// יצירת מזהה ייחודי
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// הוספת פסיקים למספרים
function addCommasToNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// חישוב עמלה
function calculateCommission(customer) {
    const projectPrice = parseFloat(customer.projectPrice) || 0;
    const projectExpenses = parseFloat(customer.projectExpenses) || 0;
    const leadCostPercent = parseFloat(customer.leadCost) || 0;
    const dealerFeePercent = parseFloat(customer.dealerFee) || 0;

    const leadCost = (leadCostPercent / 100) * projectPrice;
    const dealerFee = (dealerFeePercent / 100) * projectPrice;
    const commission = (projectPrice - leadCost - dealerFee - projectExpenses) / 2;
    return commission > 0 ? commission.toFixed(2) : 0;
}

// עדכון נתונים ב-Dashboard
function updateDashboardStats(customers) {
    const totalSalesElement = document.querySelector('.value.sales');
    const totalProjectsElement = document.querySelector('.value.projects');
    const totalCommissionElement = document.querySelector('.value.commission');

    if (totalSalesElement && totalProjectsElement && totalCommissionElement) {
        const totalSales = customers.reduce((sum, c) => sum + (parseFloat(c.projectPrice) || 0), 0).toFixed(2);
        const totalProjects = customers.length;
        const totalCommission = customers.reduce((sum, c) => sum + parseFloat(calculateCommission(c)), 0).toFixed(2);

        totalSalesElement.textContent = `$${addCommasToNumber(totalSales)}`;
        totalProjectsElement.textContent = addCommasToNumber(totalProjects);
        totalCommissionElement.textContent = `$${addCommasToNumber(totalCommission)}`;
    }
}

// הצגת לקוחות ב-Customers
function renderCustomers(customers) {
    const container = document.getElementById('customersList');
    if (!container) return;

    container.innerHTML = '';
    if (customers.length === 0) {
        container.innerHTML = '<p>לא נמצאו לקוחות.</p>';
        return;
    }

    customers.forEach((customer, index) => {
        const commission = calculateCommission(customer);
        const card = document.createElement('div');
        card.className = 'customer-card';
        card.innerHTML = `
            <h3>${customer.name}</h3>
            <p><span>סוג פרויקט:</span> ${Array.isArray(customer.projectType) ? customer.projectType.join(', ') : customer.projectType}</p>
            <p><span>מחיר פרויקט:</span> $${addCommasToNumber(customer.projectPrice)}</p>
            <p><span>עמלה:</span> $${addCommasToNumber(commission)}</p>
            <p><span>בנקים:</span> ${Array.isArray(customer.bank) ? customer.bank.join(', ') : customer.bank}</p>
            <span class="status ${customer.status.toLowerCase().replace(' ', '-')}">${customer.status}</span>
        `;
        card.addEventListener('click', () => {
            window.location.href = `customer.html?id=${index}`;
        });
        container.appendChild(card);
    });
}

// עדכון תגיות הפרויקטים
function updateSelectedProjects() {
    const projectTypeSelect = document.getElementById('projectType');
    const selectedProjectsDiv = document.getElementById('selectedProjects');
    if (projectTypeSelect && selectedProjectsDiv) {
        selectedProjectsDiv.innerHTML = '';
        const selectedOptions = Array.from(projectTypeSelect.selectedOptions).map(option => option.value);
        selectedOptions.forEach(project => {
            const tag = document.createElement('span');
            tag.className = `project-tag ${project.toLowerCase().replace(' ', '-')}`;
            tag.textContent = project;
            selectedProjectsDiv.appendChild(tag);
        });
    }
}

// עדכון תגיות הבנקים
function updateSelectedBanks() {
    const bankSelect = document.getElementById('bank');
    const selectedBanksDiv = document.getElementById('selectedBanks');
    if (bankSelect && selectedBanksDiv) {
        selectedBanksDiv.innerHTML = '';
        const selectedOptions = Array.from(bankSelect.selectedOptions).map(option => option.value);
        selectedOptions.forEach(bank => {
            const tag = document.createElement('span');
            tag.className = 'bank-tag';
            tag.textContent = bank;
            selectedBanksDiv.appendChild(tag);
        });
    }
}

// הוספת הוצאה
function addExpense(amount) {
    expenses.push(parseFloat(amount).toFixed(2));
    updateProjectExpenses();
    renderExpenses();
}

// מחיקת הוצאה
function removeExpense(index) {
    expenses.splice(index, 1);
    updateProjectExpenses();
    renderExpenses();
}

// הצגת הוצאות
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

// עדכון סך ההוצאות
function updateProjectExpenses() {
    const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense), 0);
    document.getElementById('projectExpenses').value = totalExpenses.toFixed(2);
}

// עדכון Money Used
function updateMoneyUsed() {
    const projectPrice = parseFloat(document.getElementById('projectPrice').value) || 0;
    document.getElementById('moneyUsed').value = projectPrice.toFixed(2);
}

// ניהול טופס הוספת לקוח
document.addEventListener('DOMContentLoaded', async function() {
    await loadCustomers();

    if (window.location.pathname.includes('dashboard.html')) {
        updateDashboardStats(customers);
    }
    if (window.location.pathname.includes('customers.html')) {
        renderCustomers(customers);
    }

    const addCustomerForm = document.getElementById('addCustomerForm');
    if (addCustomerForm) {
        addCustomerForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            const projectTypeSelect = document.getElementById('projectType');
            const selectedProjects = Array.from(projectTypeSelect.selectedOptions).map(option => option.value);
            if (selectedProjects.length === 0) {
                alert('בחר לפחות סוג פרויקט אחד.');
                return;
            }

            const bankSelect = document.getElementById('bank');
            const selectedBanks = Array.from(bankSelect.selectedOptions).map(option => option.value);
            if (selectedBanks.length === 0) {
                alert('בחר לפחות בנק אחד.');
                return;
            }

            const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked');
            if (!paymentMethod) {
                alert('בחר שיטת תשלום.');
                return;
            }

            const newCustomer = {
                id: generateUniqueId(),
                name: document.getElementById('customerName').value,
                address: document.getElementById('address').value,
                phone: document.getElementById('phone').value,
                age: document.getElementById('age').value,
                contractDate: document.getElementById('contractDate').value,
                projectType: selectedProjects,
                projectPrice: document.getElementById('projectPrice').value,
                projectExpenses: document.getElementById('projectExpenses').value,
                paymentMethod: paymentMethod.value,
                leadCost: document.getElementById('leadCost').value,
                dealerFee: document.getElementById('dealerFee').value,
                bank: selectedBanks,
                terms: document.getElementById('terms').value,
                maxApproved: document.getElementById('maxApproved').value,
                moneyUsed: document.getElementById('moneyUsed').value,
                status: document.getElementById('status').value
            };

            customers.push(newCustomer);
            await saveCustomers(customers);
            window.location.href = 'customers.html';
        });

        // חישוב Money Used
        const projectPriceInput = document.getElementById('projectPrice');
        if (projectPriceInput) {
            projectPriceInput.addEventListener('input', updateMoneyUsed);
            updateMoneyUsed();
        }

        // הוספת הוצאות
        const addExpenseBtn = document.getElementById('addExpenseBtn');
        if (addExpenseBtn) {
            addExpenseBtn.addEventListener('click', () => {
                const amount = prompt("הזן סכום הוצאה ($):");
                if (amount && !isNaN(amount) && parseFloat(amount) > 0) {
                    addExpense(amount);
                } else {
                    alert("הזן סכום הוצאה תקין.");
                }
            });
        }

        // עדכון תגיות
        const projectTypeSelect = document.getElementById('projectType');
        if (projectTypeSelect) projectTypeSelect.addEventListener('change', updateSelectedProjects);
        const bankSelect = document.getElementById('bank');
        if (bankSelect) bankSelect.addEventListener('change', updateSelectedBanks);
    }
});