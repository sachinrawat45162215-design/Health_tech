document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegisterLink = document.getElementById('showRegister');
    const showLoginLink = document.getElementById('showLogin');

    // User data storage helpers (persisted to localStorage for demo purposes)
    function getUsers() {
        return JSON.parse(localStorage.getItem('users') || '[]');
    }

    function saveUsers(users) {
        localStorage.setItem('users', JSON.stringify(users || []));
    }

    // Helper Functions
    function showMessage(message, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.textContent = message;
        messageDiv.className = `message ${isError ? 'error' : 'success'}`;
        document.body.appendChild(messageDiv);
        setTimeout(() => messageDiv.remove(), 3000);
    }

    function validatePassword(password) {
        return password.length >= 8;
    }

    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // Show Register Form
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
    });

    // Show Login Form
    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.classList.remove('active');
        loginForm.classList.add('active');
    });

    // Handle Login Form Submit
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (!validateEmail(email)) {
            showMessage('Please enter a valid email address', true);
            return;
        }

        // In a real application, this would be an API call to authenticate
        const usersNow = getUsers();
        const user = usersNow.find(u => u.email === email && u.password === password);

        if (user) {
            // persist current user
            localStorage.setItem('currentUser', email);
            showMessage('Login successful! Showing your records...');
            // Hide auth section and show records
            const authSection = document.getElementById('auth');
            if (authSection) authSection.style.display = 'none';
            // do not auto-render records on login; user should navigate to the Digital Records section to view them
            // update nav and bottom info for logged-in user
            if (typeof updateNavUser === 'function') updateNavUser();
            if (typeof updateBottomInfo === 'function') updateBottomInfo();
            // show main content now user is logged in
            if (typeof showMainContent === 'function') showMainContent();
            const recordsSection = document.getElementById('digital-records');
            if (recordsSection) recordsSection.scrollIntoView({ behavior: 'smooth' });
        } else {
            showMessage('Invalid email or password', true);
        }
    });

    // Handle Register Form Submit
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-confirm-password').value;
        const userType = document.getElementById('reg-type').value;

        if (!validateEmail(email)) {
            showMessage('Please enter a valid email address', true);
            return;
        }

        if (!validatePassword(password)) {
            showMessage('Password must be at least 8 characters long', true);
            return;
        }

        if (password !== confirmPassword) {
            showMessage('Passwords do not match!', true);
            return;
        }

        // In a real application, this would be an API call to register
        const usersNow = getUsers();
        if (usersNow.some(u => u.email === email)) {
            showMessage('Email already registered', true);
            return;
        }

        usersNow.push({
            name,
            email,
            password,
            userType,
            records: []
        });

        // persist users to localStorage so login survives page reloads
        saveUsers(usersNow);

        // Auto-login and show home page
        localStorage.setItem('currentUser', email);
        showMessage('Registration successful! Welcome aboard!');
        registerForm.reset();
        
        // Hide auth section and show main content
        const authSection = document.getElementById('auth');
        if (authSection) authSection.style.display = 'none';
        // update nav and bottom info for logged-in user
        if (typeof updateNavUser === 'function') updateNavUser();
        if (typeof updateBottomInfo === 'function') updateBottomInfo();
        // show main content now user is logged in
        if (typeof showMainContent === 'function') showMainContent();
        // scroll to home
        const heroSection = document.querySelector('.hero');
        if (heroSection) heroSection.scrollIntoView({ behavior: 'smooth' });
    });

    // Record modal handling (Get Started)
    const getStartedBtn = document.querySelector('.cta-button');
    const recordModal = document.getElementById('recordModal');
    const recordForm = document.getElementById('recordForm');
    const closeBtn = recordModal ? recordModal.querySelector('.close-btn') : null;

    function openRecordModal() {
        if (recordModal) recordModal.classList.add('open');
    }

    function closeRecordModal() {
        if (recordModal) recordModal.classList.remove('open');
    }

    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openRecordModal();
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeRecordModal();
        });
    }

    // Close modal when clicking outside content
    if (recordModal) {
        recordModal.addEventListener('click', (e) => {
            if (e.target === recordModal) closeRecordModal();
        });
    }

    if (recordForm) {
        recordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const imageFile = document.getElementById('rec-image').files[0];
            
            // Helper function to read file as base64
            function readFileAsBase64(file) {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            }

            // If image is selected, convert to base64, otherwise proceed without image
            if (imageFile) {
                readFileAsBase64(imageFile).then(imageData => {
                    const data = {
                        disease: document.getElementById('rec-disease').value.trim(),
                        date: document.getElementById('rec-date').value,
                        hospital: document.getElementById('rec-hospital').value.trim(),
                        doctor: document.getElementById('rec-doctor').value.trim(),
                        duration: document.getElementById('rec-duration').value.trim(),
                        notes: document.getElementById('rec-notes').value.trim(),
                        image: imageData,
                        owner: localStorage.getItem('currentUser') || 'guest',
                        id: Date.now()
                    };

                    if (!data.disease || !data.date) {
                        showMessage('Please provide at least disease and date.', true);
                        return;
                    }

                    const existing = JSON.parse(localStorage.getItem('records') || '[]');
                    existing.unshift(data);
                    localStorage.setItem('records', JSON.stringify(existing));

                    showMessage('Record with image saved successfully!');
                    closeRecordModal();
                    recordForm.reset();
                    const dr = document.getElementById('digitalRecordsList');
                    if (dr) renderRecordsTo(dr);
                }).catch(err => {
                    showMessage('Error reading image file', true);
                    console.error(err);
                });
            } else {
                // No image selected, save without image
                const data = {
                    disease: document.getElementById('rec-disease').value.trim(),
                    date: document.getElementById('rec-date').value,
                    hospital: document.getElementById('rec-hospital').value.trim(),
                    doctor: document.getElementById('rec-doctor').value.trim(),
                    duration: document.getElementById('rec-duration').value.trim(),
                    notes: document.getElementById('rec-notes').value.trim(),
                    image: null,
                    owner: localStorage.getItem('currentUser') || 'guest',
                    id: Date.now()
                };

                if (!data.disease || !data.date) {
                    showMessage('Please provide at least disease and date.', true);
                    return;
                }

                const existing = JSON.parse(localStorage.getItem('records') || '[]');
                existing.unshift(data);
                localStorage.setItem('records', JSON.stringify(existing));

                showMessage('Record saved successfully!');
                closeRecordModal();
                recordForm.reset();
                const dr = document.getElementById('digitalRecordsList');
                if (dr) renderRecordsTo(dr);
            }
        });
    }

    // Render saved records into the Digital Records section (only for current user)
    function renderRecords() {
        const listEl = document.getElementById('digitalRecordsList');
        if (!listEl) return renderRecordsTo(null);
        renderRecordsTo(listEl);
    }

    // Render records into any provided element (filtered by current user)
    function renderRecordsTo(listEl) {
        if (!listEl) return;
        const stored = JSON.parse(localStorage.getItem('records') || '[]');
        const currentUser = localStorage.getItem('currentUser');
        // Only show records to logged-in users. If not logged in, prompt to login.
        if (!currentUser) {
            listEl.innerHTML = '<p class="record-meta">Please log in to view your records.</p>';
            return;
        }

        const filtered = stored.filter(r => r.owner === currentUser);
        listEl.innerHTML = '';
        if (filtered.length === 0) {
            listEl.innerHTML = '<p class="record-meta">No records saved yet.</p>';
            return;
        }
        filtered.forEach(rec => {
            const card = document.createElement('div');
            card.className = 'record-card';
            let imageHtml = '';
            if (rec.image) {
                imageHtml = `<img src="${rec.image}" alt="Medical record image" class="record-thumbnail" />`;
            }
            card.innerHTML = `
                ${imageHtml}
                <h4>${escapeHtml(rec.disease)}</h4>
                <p class="record-meta">Date: ${escapeHtml(rec.date)} &nbsp;•&nbsp; Duration: ${escapeHtml(rec.duration || '-')}</p>
                <p class="record-meta">Hospital: ${escapeHtml(rec.hospital || '-')} &nbsp;•&nbsp; Doctor: ${escapeHtml(rec.doctor || '-')}</p>
                <p>${escapeHtml(rec.notes || '')}</p>
                <div class="record-actions"><button class="delete-record" data-id="${rec.id}" title="Delete record">Delete</button></div>
            `;
            listEl.appendChild(card);
        });
    }

    // Delete record by id (only for current user)
    function deleteRecordById(id) {
        const stored = JSON.parse(localStorage.getItem('records') || '[]');
        const currentUser = localStorage.getItem('currentUser');
        const idx = stored.findIndex(r => String(r.id) === String(id) && r.owner === currentUser);
        if (idx === -1) {
            showMessage('Record not found or you do not have permission to delete it.', true);
            return;
        }
        stored.splice(idx, 1);
        localStorage.setItem('records', JSON.stringify(stored));
        showMessage('Record deleted');
        // Re-render lists and bottom info
        const dr = document.getElementById('digitalRecordsList');
        if (dr) renderRecordsTo(dr);
        if (viewRecordsList) renderRecordsTo(viewRecordsList);
        updateBottomInfo();
    }

    // Global click handler for delete buttons (delegation)
    document.addEventListener('click', (e) => {
        const btn = e.target.closest && e.target.closest('.delete-record');
        if (btn) {
            const id = btn.getAttribute('data-id');
            if (!id) return;
            if (!confirm('Delete this record?')) return;
            deleteRecordById(id);
        }
    });

    // Simple HTML escape to prevent injection when displaying local data
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Records are rendered when user navigates to the Digital Records section

    // Bottom info: populate user basic details and location
    const biName = document.getElementById('bi-name');
    const biEmail = document.getElementById('bi-email');
    const biCount = document.getElementById('bi-count');
    const biLast = document.getElementById('bi-last');

    function updateBottomInfo() {
        const currentUser = localStorage.getItem('currentUser');
        const usersList = JSON.parse(localStorage.getItem('users') || '[]');
        const stored = JSON.parse(localStorage.getItem('records') || '[]');
        const userObj = usersList.find(u => u.email === currentUser) || null;

        if (userObj) {
            biName.textContent = userObj.name || 'User';
            biEmail.textContent = userObj.email;
        } else {
            biName.textContent = 'Guest';
            biEmail.textContent = 'Not signed in';
        }

        const filtered = currentUser ? stored.filter(r => r.owner === currentUser) : stored;
        biCount.textContent = `Records: ${filtered.length}`;
        if (filtered.length > 0) {
            const last = filtered[0];
            biLast.textContent = `Last: ${escapeHtml(last.date)}`;
        } else {
            biLast.textContent = 'Last: -';
        }

        // No location info displayed (removed per user request)
    }

    // Update bottom info on load
    updateBottomInfo();

    // If the page was opened with #login hash, ensure the login form is shown and scrolled to
    function showLoginFromHash() {
        if (location.hash === '#login') {
            registerForm.classList.remove('active');
            loginForm.classList.add('active');
            const authSection = document.getElementById('auth');
            if (authSection) authSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // Run once on load and on hash changes
    showLoginFromHash();
    window.addEventListener('hashchange', showLoginFromHash);

    // Hide or show main site content depending on authentication
    const mainSelectors = ['nav', '.hero', '.features', '#hospitals', 'footer', '#bottomInfo'];
    function hideMainContent() {
        mainSelectors.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => el.style.display = 'none');
        });
        // make sure auth is visible
        const authSection = document.getElementById('auth');
        if (authSection) authSection.style.display = '';
    }

    function showMainContent() {
        mainSelectors.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => el.style.display = '');
        });
        const authSection = document.getElementById('auth');
        if (authSection) authSection.style.display = 'none';
    }

    // On initial load, if not logged in, hide main content and show auth
    if (!localStorage.getItem('currentUser')) {
        hideMainContent();
    } else {
        showMainContent();
    }

    // Show register form when #register is used and focus first field
    function showRegisterFromHash() {
        if (location.hash === '#register') {
            loginForm.classList.remove('active');
            registerForm.classList.add('active');
            const authSection = document.getElementById('auth');
            if (authSection) authSection.scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => {
                const regName = document.getElementById('reg-name');
                if (regName) regName.focus();
            }, 450);
        }
    }

    // Update nav user display (show name + logout when logged in)
    function updateNavUser() {
        const navUser = document.getElementById('navUser');
        if (!navUser) return;
        const currentUser = localStorage.getItem('currentUser');
        const usersList = JSON.parse(localStorage.getItem('users') || '[]');
        const userObj = usersList.find(u => u.email === currentUser) || null;
        if (userObj) {
            navUser.innerHTML = `
                <span class="nav-greeting">Hi, ${escapeHtml(userObj.name || 'User')}</span>
                <button id="logoutBtn" class="logout-btn">Logout</button>
            `;
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    localStorage.removeItem('currentUser');
                    showMessage('Logged out');
                    // show login form again
                    registerForm.classList.remove('active');
                    loginForm.classList.add('active');
                    const authSection = document.getElementById('auth');
                    if (authSection) authSection.style.display = '';
                    updateBottomInfo();
                    const dr = document.getElementById('digitalRecordsList');
                    if (dr) renderRecordsTo(dr);
                    updateNavUser();
                    // hide main content since user logged out
                    if (typeof hideMainContent === 'function') hideMainContent();
                    // scroll to auth
                    if (authSection) authSection.scrollIntoView({ behavior: 'smooth' });
                });
            }
        } else {
            navUser.innerHTML = '';
        }
    }

    // Subscribe handling for newsletter
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('newsletterEmail');
            const email = emailInput ? emailInput.value.trim() : '';
            if (!validateEmail(email)) {
                showMessage('Please provide a valid email for newsletter', true);
                return;
            }
            const subs = JSON.parse(localStorage.getItem('subscribers') || '[]');
            if (!subs.includes(email)) {
                subs.push(email);
                localStorage.setItem('subscribers', JSON.stringify(subs));
            }
            showMessage('Thanks — you are subscribed!');
            if (emailInput) emailInput.value = '';
        });
    }

    // Intercept nav link clicks to provide SPA-like smooth navigation and focusing
    document.querySelectorAll('.nav-links a').forEach(a => {
        a.addEventListener('click', (e) => {
            const href = a.getAttribute('href');
            if (!href || !href.startsWith('#')) return;
            e.preventDefault();
            const id = href.slice(1);
            if (id === 'login') {
                registerForm.classList.remove('active');
                loginForm.classList.add('active');
                setTimeout(() => { const input = document.getElementById('email'); if (input) input.focus(); }, 450);
            }
            if (id === 'register') {
                loginForm.classList.remove('active');
                registerForm.classList.add('active');
                setTimeout(() => { const input = document.getElementById('reg-name'); if (input) input.focus(); }, 450);
            }
            if (id === 'digital-records') {
                const dr = document.getElementById('digitalRecordsList');
                if (dr) renderRecordsTo(dr);
            }
            const el = document.getElementById(id);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
            // update hash without jumping
            history.pushState(null, '', href);
        });
    });

    // run register hash handler once and update nav user
    showRegisterFromHash();
    updateNavUser();

    // Open records overlay when clicking the Digital Records feature card
    const digitalFeatureCard = document.getElementById('digitalFeatureCard');
    const viewRecordsModal = document.getElementById('viewRecordsModal');
    const viewRecordsList = document.getElementById('viewRecordsList');
    const viewCloseBtn = viewRecordsModal ? viewRecordsModal.querySelector('.close-btn') : null;

    function openViewModal() {
        if (viewRecordsModal) viewRecordsModal.classList.add('open');
        if (viewRecordsList) renderRecordsTo(viewRecordsList);
    }

    function closeViewModal() {
        if (viewRecordsModal) viewRecordsModal.classList.remove('open');
    }

    if (digitalFeatureCard) {
        digitalFeatureCard.style.cursor = 'pointer';
        digitalFeatureCard.addEventListener('click', (e) => {
            e.preventDefault();
            openViewModal();
        });
    }

    if (viewCloseBtn) {
        viewCloseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeViewModal();
        });
    }

    if (viewRecordsModal) {
        viewRecordsModal.addEventListener('click', (e) => {
            if (e.target === viewRecordsModal) closeViewModal();
        });
    }

    // --- Hospitals Directory logic ---
    const hospitalsData = [
        { id: 'h1', name: 'City General Hospital', specialties: ['Cardiology','Emergency'], address: '123 Main St, Mumbai', phone: '022-555-0101', lat: 19.0760, lon: 72.8777, info: '24/7 Emergency, multi-specialty hospital.' },
        { id: 'h2', name: 'Green Valley Clinic', specialties: ['Pediatrics','General'], address: '45 Green Rd, Pune', phone: '020-444-0202', lat: 18.5204, lon: 73.8567, info: 'Friendly clinicians focused on family care.' },
        { id: 'h3', name: 'Sunrise Medical Centre', specialties: ['Orthopedics','Physiotherapy'], address: '9 Sunrise Ave, Bangalore', phone: '080-333-0303', lat: 12.9716, lon: 77.5946, info: 'Advanced orthopedics and rehab services.' }
    ];

    const hospitalsListEl = document.getElementById('hospitalsList');
    const hospitalSearch = document.getElementById('hospitalSearch');
    const hospitalModal = document.getElementById('hospitalModal');
    const hospitalDetail = document.getElementById('hospitalDetail');
    const appointmentModal = document.getElementById('appointmentModal');
    const appointmentForm = document.getElementById('appointmentForm');
    const chatWindow = document.getElementById('chatWindow');
    const chatBody = document.getElementById('chatBody');
    const chatTitle = document.getElementById('chatTitle');
    const chatInput = document.getElementById('chatInput');
    const sendChatBtn = document.getElementById('sendChat');
    const closeChatBtn = document.getElementById('closeChat');

    function renderHospitals(list, targetEl) {
        if (!targetEl) return;
        targetEl.innerHTML = '';
        list.forEach(h => {
            const card = document.createElement('div');
            card.className = 'hospital-card';
            card.innerHTML = `
                <h4>${escapeHtml(h.name)}</h4>
                <div class="hospital-meta">${escapeHtml(h.specialties.join(', '))} &middot; ${escapeHtml(h.address)}</div>
                <div class="hospital-actions">
                    <button class="btn-primary" data-action="view" data-id="${h.id}">View</button>
                    <button class="btn-ghost" data-action="appt" data-id="${h.id}">Book</button>
                    <button class="btn-ghost" data-action="chat" data-id="${h.id}">Chat</button>
                    <a class="btn-ghost" href="https://www.google.com/maps/search/?api=1&query=${h.lat},${h.lon}" target="_blank">Map</a>
                </div>
            `;
            targetEl.appendChild(card);
        });
    }

    // initial render
    renderHospitals(hospitalsData, hospitalsListEl);

    // search
    if (hospitalSearch) {
        hospitalSearch.addEventListener('input', (e) => {
            const q = (e.target.value || '').toLowerCase().trim();
            const filtered = hospitalsData.filter(h => (h.name + ' ' + h.specialties.join(' ')).toLowerCase().includes(q));
            renderHospitals(filtered, hospitalsListEl);
        });
    }

    // Delegated actions for hospital cards
    document.addEventListener('click', (e) => {
        const btn = e.target.closest && e.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');
        const hospital = hospitalsData.find(h => h.id === id);
        if (!hospital) return;
        if (action === 'view') {
            // show modal with detail
            hospitalDetail.innerHTML = `
                <h3>${escapeHtml(hospital.name)}</h3>
                <p class="hospital-meta">${escapeHtml(hospital.specialties.join(', '))} &middot; ${escapeHtml(hospital.address)}</p>
                <p>${escapeHtml(hospital.info)}</p>
                <p><strong>Phone:</strong> ${escapeHtml(hospital.phone)}</p>
                <div style="margin-top:0.8rem;"><button class="btn-primary" id="detailBook" data-id="${hospital.id}">Book Appointment</button>
                <button class="btn-ghost" id="detailChat" data-id="${hospital.id}">Chat with Doctor</button>
                <a class="btn-ghost" href="https://www.google.com/maps/search/?api=1&query=${hospital.lat},${hospital.lon}" target="_blank">Live Location</a></div>
            `;
            if (hospitalModal) hospitalModal.classList.add('open');
        }
        if (action === 'appt') {
            // open appointment modal and set hospital id
            const hid = hospital.id;
            const hidInput = document.getElementById('appt-hospital-id');
            if (hidInput) hidInput.value = hid;
            if (appointmentModal) appointmentModal.classList.add('open');
        }
        if (action === 'chat') {
            // open chat window and set title
            chatTitle.textContent = `Chat — ${hospital.name}`;
            chatBody.innerHTML = `<div class="record-meta">Connected to ${escapeHtml(hospital.name)}. This is a demo chat.</div>`;
            if (chatWindow) { chatWindow.style.display = 'block'; chatWindow.setAttribute('aria-hidden','false'); }
        }
    });

    // hospital modal close
    if (hospitalModal) {
        hospitalModal.addEventListener('click', (e) => { if (e.target === hospitalModal) hospitalModal.classList.remove('open'); });
        const btn = hospitalModal.querySelector('.close-btn'); if (btn) btn.addEventListener('click', ()=> hospitalModal.classList.remove('open'));
    }
    if (appointmentModal) {
        appointmentModal.addEventListener('click', (e) => { if (e.target === appointmentModal) appointmentModal.classList.remove('open'); });
        const btn = appointmentModal.querySelector('.close-btn'); if (btn) btn.addEventListener('click', ()=> appointmentModal.classList.remove('open'));
    }

    // appointment form submit (store in localStorage as demo)
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('appt-name').value.trim();
            const email = document.getElementById('appt-email').value.trim();
            const date = document.getElementById('appt-date').value;
            const time = document.getElementById('appt-time').value;
            const hid = document.getElementById('appt-hospital-id').value;
            const appts = JSON.parse(localStorage.getItem('appointments') || '[]');
            appts.push({ id: Date.now(), name, email, date, time, hospital: hid });
            localStorage.setItem('appointments', JSON.stringify(appts));
            showMessage('Appointment requested — check your email for confirmation (demo).');
            appointmentForm.reset();
            if (appointmentModal) appointmentModal.classList.remove('open');
        });
    }

    // Chat handlers
    if (sendChatBtn) {
        sendChatBtn.addEventListener('click', () => {
            const text = (chatInput.value || '').trim();
            if (!text) return;
            const p = document.createElement('div'); p.textContent = `You: ${text}`; p.style.margin='0.35rem 0'; chatBody.appendChild(p); chatInput.value = '';
            // demo auto-reply
            setTimeout(()=>{ const r = document.createElement('div'); r.textContent = `Dr: Thanks, we'll review your message — (demo reply).`; r.style.margin='0.35rem 0'; chatBody.appendChild(r); chatBody.scrollTop = chatBody.scrollHeight; }, 700);
        });
    }
    if (closeChatBtn) {
        closeChatBtn.addEventListener('click', ()=>{ if (chatWindow) { chatWindow.style.display='none'; chatWindow.setAttribute('aria-hidden','true'); } });
    }
});

// Mobile Navigation
document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelector('.nav-links');
    const hamburger = document.createElement('button');
    hamburger.className = 'hamburger';
    hamburger.innerHTML = '<i class="fas fa-bars"></i>';
    
    document.querySelector('.nav-container').appendChild(hamburger);
    
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('show');
    });
});