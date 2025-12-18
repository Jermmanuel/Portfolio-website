// JeromeOS
// Custom desktop-style portfolio OS
// Built with Razor Pages, CSS, and vanilla JS
// Features: window manager, AI assistant, command palette, achievements

(() => {

    // =========================
    // JeromeOS Window Manager
    // =========================

    const desktop = document.querySelector('.os-desktop');
    const taskbarApps = document.querySelector('.taskbar-apps');
    const startBtn = document.querySelector('#startBtn');
    const startMenu = document.querySelector('#startMenu');
    const clockEl = document.querySelector('#clock');

    let z = 20;
    const openWindows = new Map(); // appId -> windowEl

    function updateClock() {
        const now = new Date();
        const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const date = now.toLocaleDateString([], { month: 'short', day: '2-digit' });
        if (clockEl) clockEl.textContent = `${date} • ${time}`;
    }
    updateClock();
    setInterval(updateClock, 1000 * 15);

    function closeStart() { startMenu?.classList.remove('open'); }
    function toggleStart() { startMenu?.classList.toggle('open'); }

    startBtn?.addEventListener('click', (e) => { e.stopPropagation(); toggleStart(); });
    document.addEventListener('click', () => closeStart());
    startMenu?.addEventListener('click', (e) => e.stopPropagation());

    function syncTaskbarActive(appId) {
        document.querySelectorAll('.taskbar-app').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.appId === appId);
        });
    }

    function focusWindow(win) {
        document.querySelectorAll('.window').forEach(w => w.classList.remove('focused'));
        win.classList.add('focused');
        win.style.zIndex = (++z).toString();
        syncTaskbarActive(win.dataset.appId);
    }

    function createTaskbarButton(appId, title) {
        const btn = document.createElement('button');
        btn.className = 'taskbar-app active';
        btn.dataset.appId = appId;
        btn.type = 'button';
        btn.textContent = title;

        btn.addEventListener('click', () => {
            const win = openWindows.get(appId);
            if (!win) return;

            const minimized = win.dataset.minimized === 'true';
            if (minimized) {
                win.dataset.minimized = 'false';
                win.style.display = '';
                focusWindow(win);
            } else {
                if (win.classList.contains('focused')) {
                    win.dataset.minimized = 'true';
                    win.style.display = 'none';
                    btn.classList.remove('active');
                } else {
                    focusWindow(win);
                }
            }
        });

        taskbarApps?.appendChild(btn);
        return btn;
    }

    function removeTaskbarButton(appId) {
        const btn = document.querySelector(`.taskbar-app[data-app-id="${appId}"]`);
        btn?.remove();
    }

    function makeDraggable(win, handle) {
        if (!handle) return;

        let startX = 0, startY = 0;
        let startLeft = 0, startTop = 0;
        let dragging = false;

        const onMove = (e) => {
            if (!dragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            const newLeft = startLeft + dx;
            const newTop = startTop + dy;

            const maxLeft = window.innerWidth - 80;
            const maxTop = window.innerHeight - 80;

            win.style.left = `${Math.max(-20, Math.min(newLeft, maxLeft))}px`;
            win.style.top = `${Math.max(0, Math.min(newTop, maxTop))}px`;
        };

        const onUp = () => {
            dragging = false;
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };

        handle.addEventListener('mousedown', (e) => {
            if (e.target.closest('button')) return;

            e.preventDefault();

            dragging = true;
            focusWindow(win);

            startX = e.clientX;
            startY = e.clientY;

            const rect = win.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;

            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });

    }

    function spawnWindow(appId) {
        if (!desktop) return;

        if (openWindows.has(appId)) {
            const existing = openWindows.get(appId);
            existing.dataset.minimized = 'false';
            existing.style.display = '';
            focusWindow(existing);
            return;
        }

        const tpl = document.querySelector(`.template[data-app-id="${appId}"]`);
        if (!tpl) return;

        const win = tpl.cloneNode(true);
        win.classList.remove('template');
        win.classList.add('window');
        win.dataset.appId = appId;

        const title = win.getAttribute('data-title') || appId;

        const left = 120 + (openWindows.size * 24);
        const top = 70 + (openWindows.size * 18);
        win.style.left = `${Math.min(left, window.innerWidth - 380)}px`;
        win.style.top = `${Math.min(top, window.innerHeight - 280)}px`;
        win.style.zIndex = (++z).toString();

        const btnMin = win.querySelector('[data-action="minimize"]');
        const btnClose = win.querySelector('[data-action="close"]');

        const tbBtn = createTaskbarButton(appId, title);

        btnMin?.addEventListener('click', (e) => {
            e.stopPropagation();
            win.dataset.minimized = 'true';
            win.style.display = 'none';
            tbBtn?.classList.remove('active');
        });

        btnClose?.addEventListener('click', (e) => {
            e.stopPropagation();
            openWindows.delete(appId);
            win.remove();
            removeTaskbarButton(appId);
        });

        win.addEventListener('mousedown', () => focusWindow(win));
        makeDraggable(win, win.querySelector('.titlebar'));

        desktop.appendChild(win);
        openWindows.set(appId, win);
        focusWindow(win);
        closeStart();
    }

    document.querySelectorAll('[data-open-app]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = el.getAttribute('data-open-app');
            spawnWindow(id);
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeStart();
    });

    window.JeromeOS = { open: spawnWindow };

    // =========================
    // Game Tabs 
    // =========================
    document.addEventListener("click", (e) => {
        const tab = e.target.closest(".game-tab");
        if (!tab) return;

        const hub = tab.closest(".game-hub");
        if (!hub) return;

        const gameId = tab.dataset.game;

        hub.querySelectorAll(".game-tab")
            .forEach(b => b.classList.toggle("active", b === tab));

        hub.querySelectorAll(".game-frame")
            .forEach(f => f.classList.toggle("active", f.dataset.game === gameId));
    });


    // =========================
    // Boot + A.U.R.A. Assistant
    // =========================

    const bootOverlay = document.getElementById('bootOverlay');
    const bootLog = document.getElementById('bootLog');
    const bootBar = document.getElementById('bootBar');
    const bootHint = document.getElementById('bootHint');

    const aiOverlay = document.getElementById('aiOverlay');
    const aiBody = document.getElementById('aiBody');
    const aiActions = document.getElementById('aiActions');
    const aiCloseBtn = document.getElementById('aiCloseBtn');
    const aiForm = document.getElementById('aiForm');
    const aiText = document.getElementById('aiText');

    const aiTaskbarBtn = document.getElementById('aiTaskbarBtn');
    const auraVoiceToggle = document.getElementById('auraVoiceToggle');
    const auraAvatar = document.getElementById('auraAvatar');
    const auraDragHandle = document.getElementById('auraDragHandle');

    if (!aiOverlay || !aiBody || !aiActions || !aiForm || !aiText) return;

    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
    function escapeHtml(s) {
        return String(s ?? "").replace(/[&<>"']/g, c => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        }[c]));
    }

    function makePanelDraggable(panel, handle) {
        if (!panel || !handle) return;

        let dragging = false;
        let startX = 0, startY = 0;
        let startLeft = 0, startTop = 0;

        const onMove = (e) => {
            if (!dragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            const newLeft = startLeft + dx;
            const newTop = startTop + dy;

            const maxLeft = window.innerWidth - 120;
            const maxTop = window.innerHeight - 80;

            panel.style.left = `${Math.max(10, Math.min(newLeft, maxLeft))}px`;
            panel.style.top = `${Math.max(10, Math.min(newTop, maxTop))}px`;
            panel.style.transform = 'none'; 
        };

        const onUp = () => {
            dragging = false;
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };

        handle.addEventListener('mousedown', (e) => {
            if (e.target.closest('button, input, select, textarea, a')) return;

            dragging = true;
            startX = e.clientX;
            startY = e.clientY;

            const rect = panel.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;

            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });
    }

    const auraPanel = document.querySelector('.ai-panel.split');
    makePanelDraggable(auraPanel, auraDragHandle);



    // =========================
    // AURA “alive” animations
    // =========================

    const pupils = auraAvatar?.querySelectorAll('.pupil') || [];
    function setPupilOffset(x, y) {
        pupils.forEach(p => {
            p.style.setProperty('--px', `${x}px`);
            p.style.setProperty('--py', `${y}px`);
        });
    }

    function startEyeWander() {
        if (!pupils.length) return;
        setInterval(() => {
            const x = Math.round((Math.random() * 10) - 5);
            const y = Math.round((Math.random() * 8) - 4);
            setPupilOffset(x, y);
        }, 900);
    }
    startEyeWander();

    function startBlinking() {
        if (!auraAvatar) return;
        setInterval(() => {
            if (Math.random() < 0.22) {
                auraAvatar.classList.add('blink');
                setTimeout(() => auraAvatar.classList.remove('blink'), 120);
            }
        }, 650);
    }
    startBlinking();

    function auraGlitch() {
        if (!auraAvatar) return;
        auraAvatar.classList.remove('glitch');
        void auraAvatar.offsetWidth;
        auraAvatar.classList.add('glitch');
    }

    // =========================
    // Voice (TTS)
    // =========================


    const hasTTS = ('speechSynthesis' in window);
    let ttsUnlocked = false;

    let auraSpeakingCount = 0;
    let auraVoice = null;

    let auraQueue = Promise.resolve();

    function unlockTTSOnce() {
        if (!hasTTS || ttsUnlocked) return;
        try {
            const u = new SpeechSynthesisUtterance(" ");
            u.volume = 0;
            window.speechSynthesis.speak(u);
            window.speechSynthesis.cancel();
            ttsUnlocked = true;
        } catch { /* ignore */ }
    }
    document.addEventListener('click', unlockTTSOnce, { once: true });
    document.addEventListener('keydown', unlockTTSOnce, { once: true });

    function pickGoogleUkFemaleVoice() {
        if (!hasTTS) return null;
        const voices = window.speechSynthesis.getVoices();

        return (
            voices.find(v => v.name === "Google UK English Female") ||
            voices.find(v => /google/i.test(v.name) && /uk english/i.test(v.name) && /female/i.test(v.name)) ||
            voices.find(v => /en-GB/i.test(v.lang) && /female/i.test(v.name)) ||
            voices.find(v => /en-GB/i.test(v.lang)) ||
            voices[0] ||
            null
        );
    }

    function refreshAuraVoice() {
        auraVoice = pickGoogleUkFemaleVoice();
    }

    if (hasTTS) {
        refreshAuraVoice();
        window.speechSynthesis.onvoiceschanged = () => refreshAuraVoice();
    }

    function getAuraVoiceProfile({ mode = "normal", shade = false } = {}) {
        let rate = 1.04, pitch = 1.08, volume = 0.95;
        if (mode === "projects") { rate = 1.07; pitch = 1.10; }
        if (mode === "resume") { rate = 1.02; pitch = 1.06; }
        if (mode === "contact") { rate = 1.03; pitch = 1.09; }
        if (mode === "game") { rate = 1.08; pitch = 1.12; }
        if (shade) pitch += 0.03;
        return { rate, pitch, volume };
    }

    function isShadeLine(text) {
        const t = (text || "").toLowerCase();
        return /(bold choice|interesting|main character|try not to break|i’ll allow it|i'm watching|ghost you|cute|meaner|faster|brave|chaos)/i.test(t);
    }

    function startSpeakingAnim() {
        auraSpeakingCount++;
        auraAvatar?.classList.add('speaking');
        if (Math.random() < 0.35 && auraAvatar) {
            auraAvatar.classList.add('blink');
            setTimeout(() => auraAvatar.classList.remove('blink'), 120);
        }
    }

    function stopSpeakingAnim() {
        auraSpeakingCount = Math.max(0, auraSpeakingCount - 1);
        if (auraSpeakingCount === 0) auraAvatar?.classList.remove('speaking');
    }

    function auraCancelAll() {
        if (!hasTTS) return;
        window.speechSynthesis.cancel();
        auraSpeakingCount = 0;
        auraAvatar?.classList.remove('speaking');
        auraQueue = Promise.resolve();
    }

    function auraSpeakChunk(text, opts = {}) {
        if (!auraVoiceToggle?.checked) return;
        if (!hasTTS) return;

        const clean = String(text || "").replace(/\*\*/g, '').trim();
        if (!clean) return;

        const shade = isShadeLine(clean) || !!opts.shade;
        const profile = getAuraVoiceProfile({ mode: opts.mode || "normal", shade });

        if (shade) auraGlitch();

        auraQueue = auraQueue.then(() => new Promise((resolve) => {
            refreshAuraVoice();

            const u = new SpeechSynthesisUtterance(clean);
            u.voice = auraVoice || null;
            u.rate = profile.rate;
            u.pitch = profile.pitch;
            u.volume = profile.volume;

            u.onstart = () => startSpeakingAnim();
            u.onend = () => { stopSpeakingAnim(); resolve(); };
            u.onerror = () => { stopSpeakingAnim(); resolve(); };

            window.speechSynthesis.speak(u);
        }));
    }

    function auraSpeakOnce(fullText, opts = {}) {
        auraCancelAll();
        auraSpeakChunk(fullText, opts);
    }

    function auraSpeakStreamChunk(chunkText, opts = {}) {
        auraSpeakChunk(chunkText, opts);
    }

    // =========================
    // Chat output
    // =========================
    function pushUser(text) {
        const div = document.createElement('div');
        div.className = 'ai-msg user';
        div.innerHTML = `<div class="tag">You</div><div>${escapeHtml(text)}</div>`;
        aiBody.appendChild(div);
        aiBody.scrollTop = aiBody.scrollHeight;
    }

    async function pushAI(text, { type = true, speak = true, streamSpeak = true, mode = "normal" } = {}) {
        const div = document.createElement('div');
        div.className = 'ai-msg';
        div.innerHTML = `<div class="tag">A.U.R.A.</div><div class="content"></div>`;
        aiBody.appendChild(div);

        const content = div.querySelector('.content');
        const plain = String(text ?? "");

        if (!type) {
            content.innerHTML = escapeHtml(plain).replace(/\n/g, '<br/>');
            aiBody.scrollTop = aiBody.scrollHeight;
            if (speak) auraSpeakOnce(plain, { mode });
            return;
        }

        let out = "";
        let pendingSpeak = "";

        for (let i = 0; i < plain.length; i++) {
            const ch = plain[i];
            out += ch;

            content.innerHTML = escapeHtml(out).replace(/\n/g, '<br/>');
            aiBody.scrollTop = aiBody.scrollHeight;

            if (speak && streamSpeak) {
                pendingSpeak += ch;

                const pausePoint =
                    /[.!?]\s$/.test(pendingSpeak) ||
                    (pendingSpeak.length >= 46 && /\s$/.test(pendingSpeak));

                if (pausePoint) {
                    const chunk = pendingSpeak.trim();
                    pendingSpeak = "";
                    if (chunk) auraSpeakStreamChunk(chunk, { mode });
                }
            }

            await sleep(8 + Math.random() * 18);
        }

        if (speak) {
            if (streamSpeak) {
                const chunk = pendingSpeak.trim();
                if (chunk) auraSpeakStreamChunk(chunk, { mode });
            } else {
                auraSpeakOnce(plain, { mode });
            }
        }
    }

    // =========================
    // AI open/close + commands
    // =========================
    function openAI() {
        aiOverlay.classList.add('open');
        aiOverlay.setAttribute('aria-hidden', 'false');
        if (!aiBody.dataset.init) {
            aiBody.dataset.init = "1";
            pushAI(
                "┌─ JeromeOS handshake complete.\n" +
                "│ Status: GREEN • Threat level: minimal.\n" +
                "│ Hi. I’m the Adaptive, User, Routing, Assistant. Also known as Aura.\n" +
                "└─ Don't ask me for anything, I run the tour, but I don't want to.\n\n" +
                "Type or click on the buttons below:\n" +
                "• **tour** — don't touch.\n" +
                "• **freeroam** — do what you want, I'll just watch.\n" +
                "• There are achivements so look around and see what you unlock",
                { type: true, speak: true, streamSpeak: true, mode: "normal" }
            );
        }

        aiText.focus();
    }

    function closeAI() {
        aiOverlay.classList.remove('open');
        aiOverlay.setAttribute('aria-hidden', 'true');
        auraCancelAll();
    }

    aiTaskbarBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        openAI();
    });

    aiCloseBtn?.addEventListener('click', closeAI);

    function openApp(appId) {
        if (window.JeromeOS?.open) {
            window.JeromeOS.open(appId);
            return true;
        }
        return false;
    }

    function normalize(raw) {
        return String(raw ?? "")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .replace(/^please\s+/, '')
            .replace(/^can you\s+/, '')
            .replace(/^could you\s+/, '')
            .replace(/^open\s+/, 'open ')
            .replace(/^launch\s+/, 'open ')
            .replace(/^start\s+/, 'open ');
    }

    function auraSnark() {
        const options = [
            "Wake up to reality! Haha, I love that quote.",
            "Put an M on his head, he's Luigi brother now, J Cole is awesome.",
            "Sure. I guess we’re doing this.",
            "Try not to break anything.",
            "I’m always watching. Respectfully.",
            "Wall-e is a top 5 Disney movie, can't change my mind."
        ];
        return options[Math.floor(Math.random() * options.length)];
    }

    async function runTour() {

        if (auraPanel) {
            auraPanel.style.right = "18px";
            auraPanel.style.top = "90px";
            auraPanel.style.left = "auto";
            auraPanel.style.transform = "none";
        }

        await pushAI("I said don't touch! Whatever, try to keep up.", { type: true, speak: true, streamSpeak: true, mode: "normal" });
        await sleep(450);

        openApp('about');
        await pushAI("Here's the about window, read it or not.", { type: true, speak: true, streamSpeak: true, mode: "normal" });
        await sleep(650);

        openApp('projects');
        await pushAI("Projects open. Jerome has done alittle bit of stuff.", { type: true, speak: true, streamSpeak: true, mode: "projects" });
        await sleep(650);

        openApp('resume');
        await pushAI("Resume loaded. Wow, he actually looks really qualified.", { type: true, speak: true, streamSpeak: true, mode: "resume" });
        await sleep(650);

        openApp('contact');
        await pushAI("Contact module open. If you get in touch with him, remind him to give me a raise.", { type: true, speak: true, streamSpeak: true, mode: "contact" });

        await pushAI("Tour complete. Want the game? Type **open game**.", { type: true, speak: true, streamSpeak: true, mode: "normal" });

        unlockAch && unlockAch("TOUR_DONE");

    }

    function handleCommand(raw) {
        const input = normalize(raw);
        if (!input) return;

        const appMap = {
            about: "about",
            whoami: "about",
            projects: "projects",
            builds: "projects",
            resume: "resume",
            cv: "resume",
            contact: "contact",
            email: "contact",
            game: "game",
            play: "game"
        };

        if (input === "help" || input === "?") {
            pushAI(
                "Commands:\n" +
                "• **tour** — I drive.\n" +
                "• **freeroam** — you drive.\n" +
                "• **open about/projects/resume/contact/game**\n" +
                "• **close** — I disappear (temporarily).",
                { type: true, speak: true, streamSpeak: true, mode: "normal" }
            );
            return;
        }

        if (input === "close" || input === "exit") {
            pushAI("Closing assistant. Go ahead. Free roam.", { type: true, speak: true, streamSpeak: true, mode: "normal" });
            closeAI();
            return;
        }

        if (input === "freeroam" || input === "free roam") {
            pushAI("Free roam enabled. If you get lost, press my button like a responsible adult.", { type: true, speak: true, streamSpeak: true, mode: "normal" });
            closeAI();
            return;
        }

        if (input === "tour") {
            runTour();
            return;
        }

        if (input.startsWith("open ")) {
            const key = input.replace(/^open\s+/, '').trim();
            const appId = appMap[key];

            if (!appId) {
                pushAI(`I don’t have a module called **${key}**. Try **projects** or **help**.`, { type: true, speak: true, streamSpeak: true, mode: "normal" });
                return;
            }

            const ok = openApp(appId);
            const mode =
                appId === "projects" ? "projects" :
                    appId === "resume" ? "resume" :
                        appId === "contact" ? "contact" :
                            appId === "game" ? "game" : "normal";

            if (ok) pushAI(`Opening **${appId}**. ${auraSnark()}`, { type: true, speak: true, streamSpeak: true, mode });
            else pushAI("I tried opening it and the OS stared back at me. Window manager not found.", { type: true, speak: true, streamSpeak: true, mode: "normal" });
            return;
        }

        if (appMap[input]) {
            const appId = appMap[input];
            const ok = openApp(appId);
            pushAI(ok ? `Opening **${appId}**. ${auraSnark()}` : "Nope. Something’s missing.", { type: true, speak: true, streamSpeak: true, mode: "normal" });
            return;
        }

        if (input.includes("matrix")) {
            pushAI("We are absolutely in the Matrix. But like… the stylish version.", { type: true, speak: true, streamSpeak: true, mode: "normal" });
            return;
        }
        if (input.includes("jarvis")) {
            pushAI("Jarvis sucks, so what if he can do all those fancy things? I could too if I wanted too.", { type: true, speak: true, streamSpeak: true, mode: "normal" });
            return;
        }

        pushAI("That command doesn't work, Jerome didn't code that. Try **help** or **open projects**.", { type: true, speak: true, streamSpeak: true, mode: "normal" });

        unlockAch && unlockAch("FREEROAM");

    }

    aiActions.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-ai-action]');
        if (!btn) return;
        const action = btn.getAttribute('data-ai-action');

        if (action === "tour") return handleCommand("tour");
        if (action === "freeroam") return handleCommand("freeroam");
        return handleCommand(`open ${action}`);
    });

    aiForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = aiText.value.trim();
        if (!text) return;

        unlockTTSOnce();

        pushUser(text);
        aiText.value = "";
        handleCommand(text);
    });

    // =========================
    // Boot sequence
    // =========================

    const ranKey = 'jeromeos_boot_ran';
    const shouldRunBoot = sessionStorage.getItem(ranKey) !== '1';

    const bootLines = [
        "establishing secure uplink…",
        "handshake: RSA-4096 OK",
        "spoofing credentials: operator.override",
        "decrypting assets: projects.db … OK",
        "loading modules: about.exe, projects.exe, resume.pdf, contact.app",
        "patching window manager… OK",
        "calibrating sass injector… definitely OK",
        "ACCESS GRANTED // welcome, operator."
    ];

    function appendBoot(text) {
        if (!bootLog) return;
        bootLog.textContent += (bootLog.textContent ? "\n" : "") + text;
        bootLog.scrollTop = bootLog.scrollHeight;
    }

    async function runBoot() {
        if (!bootOverlay || !bootHint || !bootBar || !bootLog) {
            openAI();
            return;
        }

        bootOverlay.style.display = 'flex';
        bootHint.textContent = "Initializing…";
        bootLog.textContent = "";
        bootBar.style.width = "0%";

        for (let i = 0; i < bootLines.length; i++) {
            appendBoot(`> ${bootLines[i]}`);
            bootBar.style.width = `${Math.round(((i + 1) / bootLines.length) * 100)}%`;

            const hints = [
                "Scanning environment…",
                "Authenticating…",
                "Warming up UI shaders…",
                "Syncing modules…",
                "Almost there…",
                "Don’t blink.",
            ];
            bootHint.textContent = hints[i % hints.length];
            await sleep(240 + Math.random() * 260);
        }

        await sleep(450);
        bootOverlay.style.display = 'none';
        sessionStorage.setItem(ranKey, '1');
        openAI();
    }

    if (shouldRunBoot) runBoot();
    else {
        if (bootOverlay) bootOverlay.style.display = 'none';
        openAI();
    }

    // =========================
    // Projects App
    // =========================

(() => {
    const root = document.getElementById('projectsApp');
    if (!root) return;

    const tabs = root.querySelectorAll('.tab');
    const cards = root.querySelectorAll('.proj-card');

    const drawer = document.getElementById('projDrawer');
    const drawerTitle = document.getElementById('drawerTitle');
    const drawerSub = document.getElementById('drawerSub');
    const drawerStack = document.getElementById('drawerStack');
    const drawerDetails = document.getElementById('drawerDetails');
    const drawerLinks = document.getElementById('drawerLinks');
    const drawerClose = document.getElementById('drawerClose');

    function setActiveTab(key) {
        tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === key));
        cards.forEach(c => {
            const cat = c.dataset.cat;
            c.style.display = (key === 'all' || key === cat) ? '' : 'none';
        });
    }

    function parseLinks(linkStr) {
        const parts = (linkStr || '').split('|').map(s => s.trim()).filter(Boolean);
        return parts.map(p => {
            const [label, url] = p.split(':');
            return { label: (label || '').trim(), url: (url || '').trim() };
        }).filter(x => x.label && x.url);
    }

    function openDrawer(card) {
        if (!drawer || !card) return;
        drawer.hidden = false;

        drawerTitle.textContent = card.dataset.title || 'Project';
        drawerSub.textContent = card.dataset.sub || '';
        drawerStack.textContent = card.dataset.stack || '';
        drawerDetails.textContent = card.dataset.details || '';

        drawerLinks.innerHTML = '';
        const links = parseLinks(card.dataset.links);
        links.forEach(l => {
            const a = document.createElement('a');
            a.href = l.url;
            a.target = '_blank';
            a.rel = 'noopener';
            a.textContent = l.label.toUpperCase();
            drawerLinks.appendChild(a);
        });

        drawer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    tabs.forEach(t => t.addEventListener('click', () => setActiveTab(t.dataset.tab)));
    cards.forEach(c => c.addEventListener('click', () => openDrawer(c)));

    drawerClose?.addEventListener('click', () => { if (drawer) drawer.hidden = true; });
    setActiveTab('all');
    })();

    // =========================
    // Contact form (portfolio mode)
    // =========================

(() => {
    const form = document.getElementById('contactForm');
    const status = document.getElementById('contactStatus');
    if (!form || !status) return;

    document.addEventListener('submit', (e) => {
        const form = e.target;
        if (!(form instanceof HTMLFormElement)) return;
        if (form.id !== 'contactForm') return;

        e.preventDefault(); // stops page refresh

        const status = form.querySelector('#contactStatus');
        if (status) {
            status.textContent = "Message received. A.U.R.A. will notifiy Jerome.";
        }

        setTimeout(() => {
            form.reset();
            if (status) status.textContent = "";
        }, 2800);
    });
    })();

    // =========================
    // Achievements (localStorage) + toast
    // =========================

    const ACH_KEY = "jeromeos_ach_v1";
    const ACH = {
        TOUR_DONE: { title: "TOUR_COMPLETE", desc: "You survived the guided tour. Proud of you." },
        FREEROAM: { title: "FREE_ROAM", desc: "Operator chose freedom. Chaos detected." },
        OPEN_ALL: { title: "FULL_ACCESS", desc: "Opened every core module. Overachiever." },
        OPEN_PROJECTS: { title: "BUILD_VIEWER", desc: "Inspected Projects. Taste confirmed." },
        OPEN_RESUME: { title: "CREDENTIAL_CHECK", desc: "Opened Resume. Legally impressive." },
        OPEN_CONTACT: { title: "PING_SENT", desc: "Visited Connect. Networking energy." },
        OPEN_INFRA: { title: "NETRUNNER", desc: "Looked at Infrastructure. Respect." }
    };

    function loadAch() {
        try { return JSON.parse(localStorage.getItem(ACH_KEY) || "{}"); }
        catch { return {}; }
    }
    function saveAch(obj) {
        localStorage.setItem(ACH_KEY, JSON.stringify(obj));
    }

    let toastEl = null;
    function ensureToast() {
        if (toastEl) return toastEl;
        toastEl = document.createElement("div");
        toastEl.className = "toast";
        toastEl.innerHTML = `<div class="title"></div><div class="msg"></div>`;
        document.body.appendChild(toastEl);
        return toastEl;
    }
    let toastQueue = Promise.resolve();

    function showToast(title, msg, durationMs = 6000) {
        toastQueue = toastQueue.then(() => new Promise((resolve) => {
            const t = ensureToast();
            t.querySelector(".title").textContent = `ACHIEVEMENT UNLOCKED // ${title}`;
            t.querySelector(".msg").textContent = msg;

            t.classList.add("show");

            setTimeout(() => {
                t.classList.remove("show");
                setTimeout(resolve, 250);
            }, durationMs);
        }));
    }


    function unlockAch(key) {
        const store = loadAch();
        if (store[key]) return;
        store[key] = Date.now();
        saveAch(store);

        const meta = ACH[key];
        if (meta) showToast(meta.title, meta.desc);

        if (typeof pushAI === "function") {
            const aiOverlay = document.getElementById("aiOverlay");
            if (aiOverlay?.classList.contains("open")) {
                pushAI(`Achievement unlocked: **${meta?.title || key}**. ${meta?.desc || ""}`, { type: true, speak: false });
            }
        }
    }

    function renderAchievements() {
        const list = document.getElementById("achList");
        if (!list) return;
        const store = loadAch();
        const items = Object.entries(ACH).map(([k, v]) => ({ key: k, ...v, unlocked: !!store[k] }));
        items.sort((a, b) => Number(b.unlocked) - Number(a.unlocked));

        list.innerHTML = "";
        items.forEach(it => {
            const div = document.createElement("div");
            div.className = "ach-item";
            div.innerHTML = `
      <div class="t">${it.unlocked ? "✓" : "•"} ${it.title}</div>
      <div class="d">${it.desc}</div>
    `;
            list.appendChild(div);
        });
    }

    const _origOpen = window.JeromeOS?.open;
    if (_origOpen) {
        window.JeromeOS.open = (appId) => {
            _origOpen(appId);

            if (appId === "resume") unlockAch("OPEN_RESUME");
            if (appId === "contact") unlockAch("OPEN_CONTACT");
            if (appId === "achievements") renderAchievements();

            const core = ["about", "projects", "resume", "contact", "game", "achievements"];
            const store = loadAch();
            const hasAll = ["about", "projects", "resume", "contact"].every(id => {
                return store[`OPEN_${id.toUpperCase()}`] || document.querySelector(`.window[data-app-id="${id}"]`);
            });
            if (hasAll) unlockAch("OPEN_ALL");

            if (document.querySelector('.window[data-app-id="achievements"]')) renderAchievements();
        };
        function resetAchievements() {
            localStorage.removeItem(ACH_KEY);
            renderAchievements?.();
            showToast("RESET", "Achievements cleared. Go earn them again.", 2500);
        }

        document.addEventListener("keydown", (e) => {
            // Ctrl+Shift+R 
            if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "r") {
                e.preventDefault();
                resetAchievements();
            }
        });

    }

    // =========================
    // Ctrl+K Command Palette
    // =========================

    (() => {
        const cmdk = document.getElementById("cmdk");
        const input = document.getElementById("cmdkInput");
        if (!cmdk || !input) return;

        function openCmdk() {
            cmdk.classList.add("open");
            cmdk.setAttribute("aria-hidden", "false");
            input.value = "";
            setTimeout(() => input.focus(), 0);
        }
        function closeCmdk() {
            cmdk.classList.remove("open");
            cmdk.setAttribute("aria-hidden", "true");
        }

        document.addEventListener("keydown", (e) => {
            const isK = e.key.toLowerCase() === "k";
            if ((e.ctrlKey || e.metaKey) && isK) {
                e.preventDefault();
                openCmdk();
                return;
            }
            if (e.key === "Escape" && cmdk.classList.contains("open")) {
                e.preventDefault();
                closeCmdk();
            }
        });

        cmdk.addEventListener("click", (e) => {
            if (e.target === cmdk) closeCmdk();
        });

        input.addEventListener("keydown", (e) => {
            if (e.key === "Escape") { closeCmdk(); return; }
            if (e.key !== "Enter") return;

            const cmd = input.value.trim();
            if (!cmd) return;
            if (typeof handleCommand === "function") {
                handleCommand(cmd);
            } else {
                const lower = cmd.toLowerCase();
                const map = { about: "about", projects: "projects", resume: "resume", contact: "contact", game: "game", achievements: "achievements" };
                const m = lower.match(/^open\s+(.+)$/);
                const key = (m ? m[1].trim() : lower);
                const app = map[key];
                if (app && window.JeromeOS?.open) window.JeromeOS.open(app);
            }

            closeCmdk();
        });
    })();
})();