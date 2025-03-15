// אתחול Firebase (הספריות יוטענו ב-HTML)
const firebaseConfig = {
    apiKey: "AIzaSyBYFuD-wxJZ6AXQjheCY_224reflu2pS",
    authDomain: "constructionsalesinterface.firebaseapp.com",
    projectId: "constructionsalesinterface",
    storageBucket: "constructionsalesinterface.appspot.com",
    messagingSenderId: "938357842695",
    appId: "1:938357842695:web:03ac6e8646528896b78582",
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
    console.log('מעדכן את ה-Dashboard עם לקוחות:', customers);
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
        console.log(`עודכן: מכירות: $${totalSales}, פרויקטים: ${totalProjects}, עמלה: $${totalCommission}`);
    } else {
        console.error('אלמנטים ב-Dashboard לא נמצאו, מנסה שוב בעוד 100ms');
        setTimeout(() => updateDashboardStats(customers), 100);
    }
}

// הצגת לקוחות ב-Customers
function renderCustomers(customers) {
    console.log('מציג לקוחות:', customers);
    const container = document.getElementById('customersList');
    if (!container) {
        console.error('קונטיינר לקוחות לא נמצא, מנסה שוב בעוד 100ms');
        setTimeout(() => renderCustomers(customers), 100);
        return;
    }

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
    console.log(`הצגתי ${customers.length} לקוחות`);
}

// התנתקות
function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isLoggedIn');
    window.location.href = 'index.html';
}

// טעינה ראשונית
document.addEventListener('DOMContentLoaded', async function() {
    console.log('דף נטען:', window.location.pathname);
    await loadCustomers();

    if (window.location.pathname.includes('dashboard.html')) {
        updateDashboardStats(customers);
    }
    if (window.location.pathname.includes('customers.html')) {
        renderCustomers(customers);
    }

    // ניהול התחברות
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const validUsers = { 'matan': '123456', 'almog': '12345' };

            if (validUsers[username] && validUsers[username] === password) {
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('currentUser', username);
                await loadCustomers();
                window.location.href = 'dashboard.html';
            } else {
                document.getElementById('loginMessage').textContent = 'שם משתמש או סיסמה שגויים';
                document.getElementById('loginMessage').style.display = 'block';
            }
        });
    }

    // ניהול התנתקות
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // ניהול הוספת לקוח
    const addCustomerBtn = document.getElementById('addCustomerBtn');
    if (addCustomerBtn) {
        addCustomerBtn.addEventListener('click', () => {
            window.location.href = 'add-customer.html';
        });
    }
});