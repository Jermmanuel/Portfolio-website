(() => {
    const canvas = document.getElementById("c");
    const ctx = canvas.getContext("2d");

    // --- Resize to match CSS size (CRITICAL for iframes) ---
    function fitCanvas() {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        const w = Math.max(1, Math.floor(rect.width * dpr));
        const h = Math.max(1, Math.floor(rect.height * dpr));

        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;

            // draw in CSS pixels
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
    }
    window.addEventListener("resize", fitCanvas);

    // --- Game state ---
    const keys = new Set();

    const player = {
        x: 80, y: 200, r: 14,
        speed: 320,
        invuln: 0
    };

    let hazards = [];
    let score = 0;
    let best = Number(localStorage.getItem("dodge_best") || 0);
    let running = true;

    function reset() {
        fitCanvas();
        const W = canvas.getBoundingClientRect().width;
        const H = canvas.getBoundingClientRect().height;

        player.x = Math.max(60, W * 0.15);
        player.y = H * 0.5;
        player.invuln = 0;

        hazards = [];
        score = 0;
        running = true;
    }

    // --- Input ---
    window.addEventListener("keydown", (e) => {
        const k = e.key.toLowerCase();

        // prevent arrow keys from scrolling inside some browsers
        if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k) || e.key.startsWith("Arrow")) {
            e.preventDefault();
        }

        keys.add(k);

        if (k === "r") reset();
    }, { passive: false });

    window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));

    // --- Utility ---
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function rand(a, b) { return a + Math.random() * (b - a); }

    function circleHit(ax, ay, ar, bx, by, br) {
        const dx = ax - bx, dy = ay - by;
        return (dx * dx + dy * dy) <= (ar + br) * (ar + br);
    }

    // --- Spawning ---
    let spawnTimer = 0;

    function spawnHazard(W, H) {
        // spawn from right, travel left with slight vertical drift
        const r = rand(10, 22);
        const y = rand(r + 10, H - r - 10);

        const speed = rand(160, 360) + Math.min(score * 2.2, 220); // scales with score
        const vy = rand(-60, 60);

        hazards.push({
            x: W + r + 10,
            y,
            r,
            vx: -speed,
            vy
        });
    }

    // --- Main loop ---
    let last = performance.now();

    function update(dt) {
        fitCanvas();
        const W = canvas.getBoundingClientRect().width;
        const H = canvas.getBoundingClientRect().height;

        if (!running) return;

        // move player
        let mx = 0, my = 0;
        if (keys.has("w") || keys.has("arrowup")) my -= 1;
        if (keys.has("s") || keys.has("arrowdown")) my += 1;
        if (keys.has("a") || keys.has("arrowleft")) mx -= 1;
        if (keys.has("d") || keys.has("arrowright")) mx += 1;

        if (mx !== 0 || my !== 0) {
            const len = Math.hypot(mx, my);
            mx /= len; my /= len;
        }

        player.x += mx * player.speed * dt;
        player.y += my * player.speed * dt;

        player.x = clamp(player.x, player.r + 10, W - player.r - 10);
        player.y = clamp(player.y, player.r + 10, H - player.r - 10);

        if (player.invuln > 0) player.invuln -= dt;

        // spawn hazards
        spawnTimer -= dt;
        const targetInterval = Math.max(0.28, 0.9 - score / 250); // faster over time
        if (spawnTimer <= 0) {
            spawnHazard(W, H);
            spawnTimer = targetInterval;
        }

        // move hazards
        for (const b of hazards) {
            b.x += b.vx * dt;
            b.y += b.vy * dt;

            // bounce vertically
            if (b.y < b.r + 8) { b.y = b.r + 8; b.vy *= -1; }
            if (b.y > H - b.r - 8) { b.y = H - b.r - 8; b.vy *= -1; }
        }

        // remove offscreen
        hazards = hazards.filter(b => b.x > -b.r - 30);

        // collisions
        if (player.invuln <= 0) {
            for (const b of hazards) {
                if (circleHit(player.x, player.y, player.r, b.x, b.y, b.r)) {
                    running = false;
                    best = Math.max(best, Math.floor(score));
                    localStorage.setItem("dodge_best", String(best));
                    break;
                }
            }
        }

        // score = survival time
        score += dt * 100; // feels arcade-y
    }

    function draw() {
        const W = canvas.getBoundingClientRect().width;
        const H = canvas.getBoundingClientRect().height;

        // clear
        ctx.clearRect(0, 0, W, H);

        // subtle grid
        ctx.globalAlpha = 0.08;
        ctx.strokeStyle = "#00ffae";
        for (let x = 0; x < W; x += 40) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
        }
        for (let y = 0; y < H; y += 40) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // hazards
        for (const b of hazards) {
            ctx.beginPath();
            ctx.fillStyle = "rgba(255,0,110,.85)";
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = 0.25;
            ctx.strokeStyle = "rgba(255,0,110,1)";
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.globalAlpha = 1;
            ctx.lineWidth = 1;
        }

        // player
        const blink = running ? 1 : 0.75;
        ctx.beginPath();
        ctx.fillStyle = `rgba(0,255,174,${blink})`;
        ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 0.25;
        ctx.strokeStyle = "#36ffe6";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.lineWidth = 1;

        // HUD
        const s = Math.floor(score);
        ctx.fillStyle = "rgba(198,255,240,.95)";
        ctx.font = "12px ui-monospace, Menlo, Consolas, monospace";
        ctx.fillText(`Score: ${s}`, 14, 20);
        ctx.fillText(`Best: ${best}`, 14, 38);
        ctx.fillStyle = "rgba(127,218,197,.9)";
        ctx.fillText(`Move: WASD / Arrow Keys  •  Restart: R`, 14, 56);

        if (!running) {
            ctx.fillStyle = "rgba(0,0,0,.55)";
            ctx.fillRect(0, 0, W, H);

            ctx.fillStyle = "#c6fff0";
            ctx.font = "700 26px ui-monospace, Menlo, Consolas, monospace";
            ctx.fillText("YOU DIED", 14, H * 0.46);

            ctx.fillStyle = "#7fdac5";
            ctx.font = "14px ui-monospace, Menlo, Consolas, monospace";
            ctx.fillText("Press R to restart", 14, H * 0.46 + 26);
        }
    }

    function loop(now) {
        const dt = Math.min(0.033, (now - last) / 1000);
        last = now;
        update(dt);
        draw();
        requestAnimationFrame(loop);
    }

    // start
    reset();
    requestAnimationFrame(loop);
})();
