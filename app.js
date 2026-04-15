/**
 * DocSafe Brasil - Ultra-Stable App Logic
 * Designed for reliability and instant feedback.
 */

const API_URL = `${window.location.origin}/api`; // Automatic IP detection
let masterPassword = '';
let currentView = 'home-view';

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    // --- SW REGISTRATION ---
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(() => console.log('Service Worker Registrado'))
            .catch(err => console.error('Erro no SW:', err));
    }

    const unlockBtn = document.getElementById('unlock-btn');
    const passwordInput = document.getElementById('vault-pass');
    const lockScreen = document.getElementById('lock-screen');
    const mainApp = document.getElementById('main-app');
    const errorMsg = document.getElementById('error-msg');

    // --- ULTIMATE UNLOCK ---
    window.handleUnlock = async () => {
        const pass = passwordInput.value;
        if (!pass) return;

        console.log("Tentando desbloquear vault...");
        unlockBtn.innerHTML = '<div class="spinner"></div>'; // Feedback visual

        try {
            const response = await fetch(`${API_URL}/unlock`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: pass })
            });

            if (response.ok) {
                const data = await response.json();
                masterPassword = pass;
                
                console.log("Vault Aberto. Carregando UI...");
                
                // 1. Injetar documentos
                renderVault(data.docs || []);
                
                // 2. Liberar visualmente (Apple Transition)
                lockScreen.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
                lockScreen.style.opacity = '0';
                lockScreen.style.pointerEvents = 'none';

                setTimeout(() => {
                    lockScreen.style.display = 'none';
                    mainApp.style.display = 'flex';
                    mainApp.style.opacity = '1';
                    document.body.classList.remove('locked');
                    staggerAnimateItems();
                }, 400);

            } else {
                showError("Senha incorreta");
            }
        } catch (err) {
            showError("Erro de conexão com o servidor de segurança");
            console.error(err);
        } finally {
            unlockBtn.innerHTML = '<i data-lucide="key"></i>';
            lucide.createIcons();
        }
    };

    function showError(msg) {
        errorMsg.innerText = msg;
        errorMsg.classList.remove('hidden');
        passwordInput.classList.add('shake');
        setTimeout(() => passwordInput.classList.remove('shake'), 400);
    }

    unlockBtn.onclick = handleUnlock;
    passwordInput.onkeypress = (e) => { if (e.key === 'Enter') handleUnlock(); };

    // --- NAVIGATION ---
    window.switchView = (viewId) => {
        if (viewId === currentView) return;
        const oldView = document.getElementById(currentView);
        const newView = document.getElementById(viewId);
        
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        const activeLink = document.querySelector(`.nav-link[onclick*="${viewId}"]`);
        if (activeLink) activeLink.classList.add('active');

        oldView.style.opacity = '0';
        setTimeout(() => {
            oldView.classList.add('hidden');
            oldView.style.display = 'none';
            newView.classList.remove('hidden');
            newView.style.display = 'flex';
            setTimeout(() => {
                newView.style.opacity = '1';
                currentView = viewId;
                lucide.createIcons();
            }, 50);
        }, 300);
    };

    // --- RENDERING ---
    function renderVault(docs) {
        const walletScroll = document.querySelector('.wallet-scroll');
        const activityList = document.querySelector('.activity-list');
        const count = docs.length;
        const goal = 5;
        const percent = Math.min(Math.round((count / goal) * 100), 100);

        // Update Dashboard Stats
        document.getElementById('overall-progress-text').innerText = `${percent}%`;
        document.getElementById('doc-count-tag').innerText = `${count} / ${goal} Docs`;
        document.getElementById('progress-percentage-info').innerText = `${percent}%`;
        document.getElementById('overall-progress-bar').style.width = `${percent}%`;

        // Wallet
        const addBtn = document.getElementById('add-doc-trigger');
        walletScroll.innerHTML = '';
        docs.forEach(doc => {
            const card = document.createElement('div');
            card.className = `doc-card glass ${doc.category === 'CNH' ? 'primary' : 'secondary'}`;
            card.onclick = () => showModal('doc-detail', doc);
            card.innerHTML = `
                <div class="card-logo"><i data-lucide="shield-check"></i> <span>${doc.category}</span></div>
                <div class="card-number">•••• •••• •••• ${doc.id.substring(0, 4)}</div>
                <div class="card-footer"><span>${doc.original_name}</span></div>
            `;
            walletScroll.appendChild(card);
        });
        walletScroll.appendChild(addBtn);

        // Activity
        activityList.innerHTML = docs.reverse().slice(0, 3).map(doc => `
            <div class="activity-item glass">
                <div class="activity-icon blue"><i data-lucide="lock"></i></div>
                <div class="activity-info"><h4>Seguro: ${doc.original_name}</h4><span>Ingerido com sucesso</span></div>
            </div>
        `).join('');
        lucide.createIcons();
    }

    function staggerAnimateItems() {
        const items = document.querySelectorAll('.main-card, .section-title, .doc-card, .action-item, .activity-item');
        items.forEach((item, index) => {
            item.style.opacity = '0';
            setTimeout(() => {
                item.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, 100 + (index * 60));
        });
    }

    // --- PWA INSTALLATION ---
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        console.log("PWA can be installed!");
        // We could show a specific install button here if we wanted
    });

    window.installPWA = async () => {
        if (!deferredPrompt) {
            alert("O app já está instalado ou seu navegador não suporta instalação direta.");
            return;
        }
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to install prompt: ${outcome}`);
        deferredPrompt = null;
    };

    // --- UTILS ---
    window.showModal = (type, data = null) => {
        const modal = document.getElementById('global-modal');
        const body = document.getElementById('modal-body');
        modal.classList.remove('hidden');
        if (type === 'doc-detail') {
            body.innerHTML = `<div class="glass primary" style="padding:20px"><p>Documento: ${data.original_name}</p><button class="glass" style="margin-top:10px; padding:10px; width:100%" onclick="downloadDoc('${data.id}', '${data.original_name}')">BAIXAR</button></div>`;
        }
    };
    window.hideModal = () => document.getElementById('global-modal').classList.add('hidden');
});
