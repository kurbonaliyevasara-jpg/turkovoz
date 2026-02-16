// Admin Panel - JWT Version with CONFIG
let allUsers = [];
let currentEditUserId = null;

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Admin panel loaded');
    checkAdminAuth();
    loadAllUsers();
    
    // Setup search with null check and retry
    setTimeout(() => {
        const searchInput = document.getElementById('searchInput');
        console.log('🔎 Search input element:', searchInput);
        if (searchInput) {
            searchInput.addEventListener('input', handleSearch);
            console.log('✅ Search listener attached');
        } else {
            console.error('❌ Search input element not found!');
        }
    }, 100);
    
    // Setup form handlers with null check
    const createUserForm = document.getElementById('createUserForm');
    if (createUserForm) {
        createUserForm.addEventListener('submit', handleCreateUser);
    }
});

// ========== AUTH CHECK ==========
function checkAdminAuth() {
    const admin = localStorage.getItem('adminAuth');
    if (admin !== 'true') {
        // Show login modal instead of prompt
        showAdminLoginModal();
    }
}

function showAdminLoginModal() {
    // Check if already showing modal
    if (document.getElementById('adminLoginOverlay')) return;
    
    const html = `
        <div id="adminLoginOverlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center;">
            <div style="background: white; padding: 40px; border-radius: 12px; max-width: 400px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                <h2 style="margin-bottom: 20px; text-align: center; color: #667eea;">🔐 Admin Panel</h2>
                <p style="text-align: center; color: #666; margin-bottom: 20px;">Parolni kiriting</p>
                <input type="password" id="adminPasswordInput" placeholder="Admin parol" style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 6px; margin-bottom: 15px; font-size: 16px; box-sizing: border-box;">
                <button id="adminLoginBtn" style="width: 100%; padding: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 600; margin-bottom: 10px;">Kirish</button>
                <div id="adminLoginError" style="color: #f44336; text-align: center; font-size: 14px; display: none;"></div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
    
    const passwordInput = document.getElementById('adminPasswordInput');
    const loginBtn = document.getElementById('adminLoginBtn');
    const errorDiv = document.getElementById('adminLoginError');
    
    function handleLogin() {
        const password = passwordInput.value.trim();
        
        if (password === 'muomila123') {
            localStorage.setItem('adminAuth', 'true');
            document.getElementById('adminLoginOverlay').remove();
            location.reload();
        } else {
            errorDiv.textContent = '❌ Parol xato!';
            errorDiv.style.display = 'block';
            passwordInput.value = '';
            passwordInput.focus();
        }
    }
    
    loginBtn.addEventListener('click', handleLogin);
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    
    passwordInput.focus();
}

function adminLogout() {
    if (confirm('Admin akkauntdan chiqishga ishonchingiz komilmi?')) {
        localStorage.removeItem('adminAuth');
        window.location.href = 'index.html';
    }
}

// ========== TAB SWITCHING ==========
function switchTab(tabName) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active from all buttons
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(tabName).classList.add('active');
    
    // Mark button as active
    event.target.classList.add('active');
    
    // Load stats if settings tab
    if (tabName === 'settings') {
        loadStats();
    }
    
    // Populate users if notifications tab
    if (tabName === 'notifications') {
        populateUserSelectForNotification();
    }
}

// ========== USERS LOADING & DISPLAY ==========
async function loadAllUsers() {
    try {
        const response = await fetch(`${CONFIG.API_URL}/all-users`);
        const result = await response.json();
        const users = result.users || result;
        
        if (Array.isArray(users)) {
            allUsers = users || [];
            renderUsers(allUsers);
            updateStats();
        } else {
            showError('usersError', 'Foydalanuvchilar yuklanmadi');
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showError('usersError', 'Server bilan bog\'lanishda xatolik!');
    }
}

function renderUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="no-data">Hech qanday foydalanuvchi topilmadi</td></tr>';
        updateHeaderStats();
        return;
    }
    
    tbody.innerHTML = users.map((user, index) => `
        <tr>
            <td>${index + 1}</td>
            <td><strong>${user.name} ${user.surname}</strong></td>
            <td>${user.email}</td>
            <td>${user.phone || '-'}</td>
            <td><strong>${(user.balance || 0).toLocaleString('uz-UZ')} so'm</strong></td>
            <td>${user.trustPercentage || 100}%</td>
            <td>
                <span style="background: #4CAF50; color: white; padding: 3px 8px; border-radius: 3px; font-size: 12px;">
                    ✓ Faol
                </span>
            </td>
            <td>
                <button class="admin-action-btn btn-edit" onclick="openEditUserModal(${user.id})">✏️ Tahrir</button>
                <button class="admin-action-btn btn-add-balance" onclick="openEditBalanceModal(${user.id})">💰 Balans</button>
                <button class="admin-action-btn btn-reset" onclick="openChangePasswordModal(${user.id})">🔐 Parol</button>
                <button class="admin-action-btn btn-delete" onclick="deleteUser(${user.id})">🗑️ O'chir</button>
            </td>
        </tr>
    `).join('');
    
    updateHeaderStats();
}

function updateHeaderStats() {
    const totalUsers = allUsers.length;
    const totalBalance = allUsers.reduce((sum, u) => sum + (u.balance || 0), 0);
    
    document.getElementById('totalUsers').textContent = totalUsers;
    document.getElementById('totalBalance').textContent = totalBalance.toLocaleString('uz-UZ');
}

// ========== SEARCH ==========
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    console.log('🔍 Search:', searchTerm, 'allUsers:', allUsers.length);
    
    if (searchTerm.trim() === '') {
        renderUsers(allUsers);
        return;
    }
    
    const filtered = allUsers.filter(user => 
        (user.name && user.name.toLowerCase().includes(searchTerm)) ||
        (user.surname && user.surname.toLowerCase().includes(searchTerm)) ||
        (user.email && user.email.toLowerCase().includes(searchTerm))
    );
    
    console.log('✅ Filtered:', filtered.length);
    renderUsers(filtered);
}

// ========== CREATE USER ==========

async function handleCreateUser(e) {
    e.preventDefault();
    
    const data = {
        email: document.getElementById('createEmail').value,
        password: document.getElementById('createPassword').value,
        name: document.getElementById('createName').value,
        surname: document.getElementById('createSurname').value,
        phone: document.getElementById('createPhone').value,
        age: parseInt(document.getElementById('createAge').value),
        gender: document.getElementById('createGender').value,
        gmail: document.getElementById('createEmail').value,
        balance: parseInt(document.getElementById('createBalance').value) || 0
    };
    
    try {
        const response = await fetch(`${CONFIG.API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess('createSuccess', '✅ Akkount muvaffaqiyatli yaratildi!');
            document.getElementById('createUserForm').reset();
            setTimeout(() => loadAllUsers(), 1000);
        } else {
            showError('createError', result.message || 'Xatolik yuz berdi');
        }
    } catch (error) {
        showError('createError', 'Server bilan bog\'lanishda xatolik!');
    }
}

// ========== EDIT USER ==========
function openEditUserModal(userId) {
    const user = allUsers.find(u => u.id == userId);
    if (!user) return;
    
    currentEditUserId = userId;
    document.getElementById('editUserName').value = user.name;
    document.getElementById('editUserSurname').value = user.surname;
    document.getElementById('editUserEmail').value = user.email;
    document.getElementById('editUserPhone').value = user.phone || '';
    document.getElementById('editUserAge').value = user.age || '';
    document.getElementById('editUserGender').value = user.gender || 'Erkak';
    
    document.getElementById('editUserModal').classList.add('active');
}

function closeEditUserModal() {
    document.getElementById('editUserModal').classList.remove('active');
    document.getElementById('editUserError').style.display = 'none';
}

async function handleEditUser(e) {
    e.preventDefault();
    
    const data = {
        name: document.getElementById('editUserName').value,
        surname: document.getElementById('editUserSurname').value,
        email: document.getElementById('editUserEmail').value,
        phone: document.getElementById('editUserPhone').value,
        age: parseInt(document.getElementById('editUserAge').value),
        gender: document.getElementById('editUserGender').value
    };
    
    try {
        const response = await fetch(`${CONFIG.API_URL}/user/${currentEditUserId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            closeEditUserModal();
            showSuccess('usersSuccess', '✅ Ma\'lumotlar yangilandi!');
            setTimeout(() => loadAllUsers(), 500);
        } else {
            showError('editUserError', result.message || 'Xatolik yuz berdi');
        }
    } catch (error) {
        showError('editUserError', 'Server bilan bog\'lanishda xatolik!');
    }
}

// ========== EDIT BALANCE ==========
function openEditBalanceModal(userId) {
    currentEditUserId = userId;
    const user = allUsers.find(u => u.id == userId);
    if (user) {
        document.getElementById('editBalanceAmount').value = user.balance || 0;
    }
    document.getElementById('editBalanceModal').classList.add('active');
}

function closeEditBalanceModal() {
    document.getElementById('editBalanceModal').classList.remove('active');
    document.getElementById('editBalanceError').style.display = 'none';
}

async function handleEditBalance(e) {
    e.preventDefault();
    
    const amount = parseInt(document.getElementById('editBalanceAmount').value);
    
    if (isNaN(amount) || amount < 0) {
        showError('editBalanceError', 'To\'g\'ri miqdor kiriting!');
        return;
    }
    
    try {
        const response = await fetch(`${CONFIG.API_URL}/user/${currentEditUserId}/balance`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ balance: amount })
        });
        
        const result = await response.json();
        
        if (result.success) {
            closeEditBalanceModal();
            showSuccess('usersSuccess', '✅ Balans yangilandi!');
            setTimeout(() => loadAllUsers(), 500);
        } else {
            showError('editBalanceError', result.message || 'Xatolik yuz berdi');
        }
    } catch (error) {
        showError('editBalanceError', 'Server bilan bog\'lanishda xatolik!');
    }
}

// ========== CHANGE PASSWORD ==========
function openChangePasswordModal(userId) {
    currentEditUserId = userId;
    document.getElementById('changePasswordModal').classList.add('active');
    document.getElementById('changePasswordNew').value = '';
}

function closeChangePasswordModal() {
    document.getElementById('changePasswordModal').classList.remove('active');
    document.getElementById('changePasswordError').style.display = 'none';
}

async function handleChangePassword(e) {
    e.preventDefault();
    
    const newPassword = document.getElementById('changePasswordNew').value;
    
    if (newPassword.length < 6) {
        showError('changePasswordError', 'Parol minimalda 6 ta belgidan iborat bo\'lishi kerak!');
        return;
    }
    
    try {
        const response = await fetch(`${CONFIG.API_URL}/user/${currentEditUserId}/password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: newPassword })
        });
        
        const result = await response.json();
        
        if (result.success) {
            closeChangePasswordModal();
            showSuccess('usersSuccess', '✅ Parol yangilandi!');
            setTimeout(() => loadAllUsers(), 500);
        } else {
            showError('changePasswordError', result.message || 'Xatolik yuz berdi');
        }
    } catch (error) {
        showError('changePasswordError', 'Server bilan bog\'lanishda xatolik!');
    }
}

// ========== DELETE USER ==========
async function deleteUser(userId) {
    const user = allUsers.find(u => u.id == userId);
    if (!user) return;
    
    if (!confirm(`${user.name} ${user.surname} foydalanuvchisini o'chirishga ishonchingiz komilmi?\n\n⚠️ Bu amalni qaytarib bo'lmaydi!`)) {
        return;
    }
    
    try {
        const response = await fetch(`${CONFIG.API_URL}/user/${userId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess('usersSuccess', '✅ Foydalanuvchi o\'chirildi!');
            setTimeout(() => loadAllUsers(), 500);
        } else {
            showError('usersError', result.message || 'Xatolik yuz berdi');
        }
    } catch (error) {
        showError('usersError', 'Server bilan bog\'lanishda xatolik!');
    }
}

// ========== STATS ==========
async function loadStats() {
    try {
        const response = await fetch(`${CONFIG.API_URL}/stats`);
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('statTotalUsers').textContent = data.stats.totalUsers;
            document.getElementById('statTotalDebts').textContent = data.stats.totalDebts;
            document.getElementById('statTotalFirms').textContent = data.stats.totalFirms;
            document.getElementById('statTotalBalance').textContent = (data.stats.totalBalance / 1000000).toFixed(1) + 'M';
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function updateStats() {
    document.getElementById('statTotalUsers').textContent = allUsers.length;
    const totalBalance = allUsers.reduce((sum, u) => sum + (u.balance || 0), 0);
    document.getElementById('statTotalBalance').textContent = (totalBalance / 1000000).toFixed(1) + 'M';
}

// ========== EXPORT & CLEAR ==========
function exportDatabase() {
    if (!confirm('Database\'ni JSON format\'da yuklab olishni xohlaysizmi?')) return;
    
    const dataStr = JSON.stringify(allUsers, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'muomila_backup_' + new Date().getTime() + '.json';
    link.click();
    URL.revokeObjectURL(url);
}

function clearAllData() {
    const warning = prompt('⚠️ BARCHA MA\'LUMOTLAR O\'CHIRILADI! Tasdiqlash uchun "O\'CHIR" so\'zini yozing:');
    
    if (warning === 'O\'CHIR') {
        if (confirm('Haqiqatan ham BARCHA ma\'lumotlarni o\'chirishni xohlaysizmi? BU QAYTARIB BO\'LMA!')) {
            alert('🗑️ Tizim tozalandi!');
            localStorage.removeItem('adminAuth');
            location.reload();
        }
    }
}

// ========== NOTIFICATIONS ==========
function populateUserSelectForNotification() {
    const select = document.getElementById('notificationUserId');
    const searchInput = document.getElementById('notificationUserSearch');
    
    select.innerHTML = '<option value="">Foydalanuvchini tanlang...</option>';
    searchInput.value = '';
    
    allUsers.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = `${user.name} ${user.surname} (${user.email})`;
        select.appendChild(option);
    });
    
    // Add search listener
    if (searchInput) {
        searchInput.addEventListener('input', handleNotificationUserSearch);
    }
}

function handleNotificationUserSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const select = document.getElementById('notificationUserId');
    const options = select.querySelectorAll('option');
    
    console.log('🔍 Notification user search:', searchTerm);
    
    // Always keep the first option visible
    let visibleCount = 0;
    
    options.forEach((option, index) => {
        if (index === 0) return; // Skip the "Choose..." option
        
        const text = option.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            option.style.display = 'block';
            visibleCount++;
        } else {
            option.style.display = 'none';
        }
    });
    
    console.log('✅ Found:', visibleCount, 'users');
}

function handleNotificationTargetChange() {
    const target = document.getElementById('notificationTarget').value;
    const userSelectContainer = document.getElementById('userSelectContainer');
    
    console.log('🔄 Target changed:', target);
    
    if (target === 'specific') {
        userSelectContainer.style.display = 'block';
        populateUserSelectForNotification();
        console.log('✅ Showing user select for specific user');
    } else {
        userSelectContainer.style.display = 'none';
        document.getElementById('notificationUserId').value = '';
        console.log('✅ Hiding user select for broadcast');
    }
}

async function handleSendNotification(event) {
    event.preventDefault();
    
    // Clear previous messages
    document.getElementById('notificationInfo').style.display = 'none';
    document.getElementById('notificationError').style.display = 'none';
    document.getElementById('notificationSuccess').style.display = 'none';
    
    const title = document.getElementById('notificationTitle').value.trim();
    const messageTextarea = document.querySelector('#sendNotificationForm textarea');
    const message = messageTextarea.value.trim();
    const type = document.getElementById('notificationType').value;
    const target = document.getElementById('notificationTarget').value;
    const userIdSelect = document.getElementById('notificationUserId');
    const userId = target === 'specific' ? userIdSelect.value : null;
    
    console.log('🔔 SEND NOTIFICATION DEBUG:');
    console.log('  Target:', target);
    console.log('  Target === "specific"?', target === 'specific');
    console.log('  User ID Element value:', userIdSelect.value);
    console.log('  userId variable:', userId);
    console.log('  Final userId:', userId);
    
    if (!title || !message) {
        showError('notificationError', 'Sarlavha va xabar majburiy!');
        return;
    }
    
    if (target === 'specific' && !userId) {
        showError('notificationError', 'Foydalanuvchini tanlang!');
        return;
    }
    
    try {
        const payload = {
            title: title,
            message: message,
            type: type
        };
        
        // Only add userId if sending to specific user AND user is selected
        if (target === 'specific') {
            if (!userId || userId === '') {
                showError('notificationError', 'Foydalanuvchini tanlang!');
                return;
            }
            payload.userId = userId;
        }
        // NOTE: For broadcast (target === 'all'), we DO NOT include userId property at all
        
        console.log('📤 API Payload:', JSON.stringify(payload));
        
        const response = await fetch(`${CONFIG.API_URL}/notifications/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        console.log('📨 API Response:', data);
        
        if (data.success) {
            showSuccess('notificationSuccess', '✅ Bildirishnoma muvaffaqiyatli yuborildi!');
            // Reset form completely
            document.getElementById('sendNotificationForm').reset();
            // Reset target to "all"
            document.getElementById('notificationTarget').value = 'all';
            // Hide user select container
            document.getElementById('userSelectContainer').style.display = 'none';
            // Clear user select
            document.getElementById('notificationUserId').value = '';
            setTimeout(() => {
                document.getElementById('notificationSuccess').style.display = 'none';
            }, 3000);
        } else {
            showError('notificationError', data.message || 'Bildirishnoma yuborishda xatolik');
        }
    } catch (error) {
        console.error('Error sending notification:', error);
        showError('notificationError', 'Tarmoq xatosi: ' + error.message);
    }
}

// ========== UI HELPERS ==========
function showSuccess(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.style.display = 'block';
    setTimeout(() => {
        element.style.display = 'none';
    }, 4000);
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = '❌ ' + message;
    element.style.display = 'block';
}

// Close modals on overlay click
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
});

// Expose functions globally for inline onclick handlers
window.switchTab = switchTab;
window.handleCreateUser = handleCreateUser;
window.handleSearch = handleSearch;
window.handleNotificationUserSearch = handleNotificationUserSearch;
window.openEditUserModal = openEditUserModal;
window.closeEditUserModal = closeEditUserModal;
window.handleEditUser = handleEditUser;
window.openEditBalanceModal = openEditBalanceModal;
window.closeEditBalanceModal = closeEditBalanceModal;
window.handleEditBalance = handleEditBalance;
window.openChangePasswordModal = openChangePasswordModal;
window.closeChangePasswordModal = closeChangePasswordModal;
window.handleChangePassword = handleChangePassword;
window.deleteUser = deleteUser;
window.handleSendNotification = handleSendNotification;
window.handleNotificationTargetChange = handleNotificationTargetChange;
