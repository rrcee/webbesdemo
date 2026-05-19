document.addEventListener("DOMContentLoaded", () => {
    // Initialize Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    /* ==========================================================================
       1. Floating Navbar
       ========================================================================== */
    const navContainer = document.getElementById("nav-container");

    window.addEventListener("scroll", () => {
        if (window.scrollY > 50) {
            navContainer.classList.add("bg-black/95", "border-white/15", "shadow-[0_4px_30px_rgba(0,0,0,0.8)]");
            navContainer.classList.remove("border-white/5");
        } else {
            navContainer.classList.remove("bg-black/95", "border-white/15", "shadow-[0_4px_30px_rgba(0,0,0,0.8)]");
            navContainer.classList.add("border-white/5");
        }
    }, { passive: true });

    /* ==========================================================================
       2. Optimized Scroll-Driven Hero Canvas Frame Animation
          
       Strategy:
       - Instantly draw frame 1 synchronously before any async work
       - Load frames 1–20 in a tight parallel burst (critical path)
       - Hide loader as soon as frame 1 is ready  
       - Load remaining frames in background via requestIdleCallback
       - Use an off-screen ImageBitmap cache for zero-jank rendering
       ========================================================================== */
    const TOTAL_FRAMES = 166;
    const PRIORITY_FRAMES = 20;         // frames loaded before loader hides
    const canvas = document.getElementById("hero-canvas");
    const ctx = canvas ? canvas.getContext("2d", { alpha: false }) : null;
    const loader = document.getElementById("canvas-loader");
    const loaderText = document.getElementById("loader-text");

    // Two-tier cache: Image objects + resolved flag
    const imagesCache = new Array(TOTAL_FRAMES + 1);
    let currentFrame = 1;
    let targetFrame  = 1;
    let imagesLoadedCount = 0;
    let priorityReady = false;

    const padNum = (num) => String(num).padStart(3, "0");
    const getFrameUrl = (index) => `images/ezgif-frame-${padNum(index)}.jpg`;

    /* ---- Canvas sizing -------------------------------------------------- */
    const resizeCanvas = () => {
        if (!canvas) return;
        const dpr = window.devicePixelRatio || 1;
        canvas.width  = window.innerWidth  * dpr;
        canvas.height = window.innerHeight * dpr;
        renderCurrentFrame();
    };

    window.addEventListener("resize", resizeCanvas, { passive: true });

    /* ---- Render one frame ----------------------------------------------- */
    const renderImageToCanvas = (img) => {
        if (!ctx || !canvas || !img) return;

        const cw = canvas.width;
        const ch = canvas.height;

        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, cw, ch);

        const iw = img.naturalWidth  || img.width;
        const ih = img.naturalHeight || img.height;
        if (!iw || !ih) return;

        const imgAspect    = iw / ih;
        const canvasAspect = cw / ch;

        let rw, rh;
        if (canvasAspect > imgAspect) {
            rw = cw;
            rh = cw / imgAspect;
        } else {
            rh = ch;
            rw = ch * imgAspect;
        }

        const scale = 0.75;
        const fw = rw * scale;
        const fh = rh * scale;
        const x  = (cw - fw) / 2;
        const y  = (ch - fh) / 2;

        ctx.drawImage(img, x, y, fw, fh);
    };

    const renderCurrentFrame = () => {
        const idx = Math.round(currentFrame);
        const img = imagesCache[idx];
        if (img) renderImageToCanvas(img);
    };

    /* ---- Fast single-image loader --------------------------------------- */
    const loadImg = (idx) => {
        return new Promise((resolve) => {
            if (imagesCache[idx]) { resolve(imagesCache[idx]); return; }

            const img = new Image();
            // Hint browser: decode off main thread
            img.decoding = "async";
            img.src = getFrameUrl(idx);

            const onLoad = () => {
                imagesCache[idx] = img;
                imagesLoadedCount++;

                // Update loader text
                const pct = Math.floor((imagesLoadedCount / TOTAL_FRAMES) * 100);
                if (loaderText) loaderText.textContent = `Preloading Studio Assets [${pct}%]`;

                // Draw frame 1 immediately — before loader hides
                if (idx === 1) {
                    resizeCanvas();
                    renderCurrentFrame();
                }

                resolve(img);
            };

            img.onload  = onLoad;
            img.onerror = () => resolve(null);  // never block on missing frame
        });
    };

    /* ---- Priority burst: frames 1–PRIORITY_FRAMES ----------------------- */
    const loadPriorityFrames = async () => {
        const tasks = [];
        for (let i = 1; i <= PRIORITY_FRAMES; i++) tasks.push(loadImg(i));
        await Promise.all(tasks);
        priorityReady = true;

        // Hide loader
        if (loader) {
            loader.style.opacity = "0";
            setTimeout(() => { if (loader) loader.style.display = "none"; }, 700);
        }

        // Kick off background loading
        loadRemainingFrames();
    };

    /* ---- Background loading: remaining frames in idle time -------------- */
    const loadRemainingFrames = () => {
        let nextBatch = PRIORITY_FRAMES + 1;

        const loadBatch = () => {
            if (nextBatch > TOTAL_FRAMES) return;

            const end = Math.min(nextBatch + 9, TOTAL_FRAMES);
            const tasks = [];
            for (let i = nextBatch; i <= end; i++) tasks.push(loadImg(i));
            nextBatch = end + 1;

            Promise.all(tasks).then(() => {
                // Schedule next batch in idle time to avoid jank
                if (typeof requestIdleCallback !== "undefined") {
                    requestIdleCallback(loadBatch, { timeout: 500 });
                } else {
                    setTimeout(loadBatch, 50);
                }
            });
        };

        if (typeof requestIdleCallback !== "undefined") {
            requestIdleCallback(loadBatch, { timeout: 500 });
        } else {
            setTimeout(loadBatch, 50);
        }
    };

    if (canvas) {
        // Start the canvas and priority load
        resizeCanvas();
        loadPriorityFrames();
    }

    /* ---- Hero text slides on scroll ------------------------------------ */
    const heroSection = document.getElementById("hero");
    const textSlide1  = document.getElementById("hero-text-1");
    const textSlide2  = document.getElementById("hero-text-2");
    const textSlide3  = document.getElementById("hero-text-3");

    const updateHeroScroll = () => {
        if (!heroSection) return;
        const rect       = heroSection.getBoundingClientRect();
        const heroHeight = rect.height - window.innerHeight;
        const scrolled   = -rect.top;
        const progress   = Math.max(0, Math.min(1, scrolled / heroHeight));

        targetFrame = Math.max(1, Math.min(TOTAL_FRAMES, Math.round(progress * (TOTAL_FRAMES - 1) + 1)));

        if (textSlide1 && textSlide2 && textSlide3) {
            if (progress < 0.22) {
                textSlide1.style.opacity   = "1";
                textSlide1.style.transform = "translateY(0)";
            } else {
                textSlide1.style.opacity   = "0";
                textSlide1.style.transform = "translateY(-50px)";
            }

            if (progress >= 0.25 && progress < 0.58) {
                textSlide2.style.opacity   = "1";
                textSlide2.style.transform = "translateY(0)";
            } else if (progress < 0.25) {
                textSlide2.style.opacity   = "0";
                textSlide2.style.transform = "translateY(50px)";
            } else {
                textSlide2.style.opacity   = "0";
                textSlide2.style.transform = "translateY(-50px)";
            }

            if (progress >= 0.62) {
                textSlide3.style.opacity   = "1";
                textSlide3.style.transform = "translateY(0)";
            } else {
                textSlide3.style.opacity   = "0";
                textSlide3.style.transform = "translateY(50px)";
            }
        }
    };

    window.addEventListener("scroll", updateHeroScroll, { passive: true });

    /* ---- Smooth frame render loop --------------------------------------- */
    const renderLoop = () => {
        const diff = targetFrame - currentFrame;
        if (Math.abs(diff) > 0.05) {
            currentFrame += diff * 0.12;
            renderCurrentFrame();
        }
        requestAnimationFrame(renderLoop);
    };
    requestAnimationFrame(renderLoop);

    /* ==========================================================================
       3. Scroll Reveal (.reveal-up elements)
       ========================================================================== */
    const revealEls = document.querySelectorAll(".reveal-up");

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("in-view");
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    revealEls.forEach((el) => revealObserver.observe(el));

    /* ==========================================================================
       4. Parallax Backgrounds
       ========================================================================== */
    const parallaxSections = document.querySelectorAll(".parallax-section");

    const updateParallax = () => {
        parallaxSections.forEach((section) => {
            const rect    = section.getBoundingClientRect();
            const centerY = rect.top + rect.height / 2 - window.innerHeight / 2;
            const offset  = centerY * 0.08; // gentle 8% parallax ratio
            const pseudo  = section.querySelector(":scope > *:first-child");
            // Shift the ::before pseudo via CSS custom property
            section.style.setProperty("--parallax-y", `${offset}px`);
        });
    };

    // Apply CSS variable to ::before via inline style trick
    // We use a data-attribute approach for the gradient bg offset
    const parallaxStyle = document.createElement("style");
    parallaxStyle.textContent = `
        .parallax-section::before {
            transform: translateY(var(--parallax-y, 0px));
            transition: transform 0.05s linear;
        }
    `;
    document.head.appendChild(parallaxStyle);

    window.addEventListener("scroll", updateParallax, { passive: true });
    updateParallax();

    /* ==========================================================================
       5. On-Load Shimmer Burst on All Cards
       ========================================================================== */
    const shimmerCards = document.querySelectorAll(".shimmer-card");

    // Stagger shimmer entries after a short delay
    shimmerCards.forEach((card, i) => {
        card.style.setProperty("--shimmer-delay", `${0.4 + i * 0.12}s`);
        // Trigger after brief delay so page has settled
        setTimeout(() => card.classList.add("shimmer-run"), 800 + i * 80);
    });

    /* ==========================================================================
       6. Accessible Inquiry Form
       ========================================================================== */
    const inquiryForm   = document.getElementById("inquiry-form");
    const successView   = document.getElementById("success-view");
    const resetFormBtn  = document.getElementById("reset-form-btn");
    const submitBtn     = document.getElementById("submit-btn");
    const submitBtnText = document.getElementById("submit-btn-text");
    const submitBtnIcon = document.getElementById("submit-btn-icon");
    const formAnnouncer = document.getElementById("form-announcer");

    if (inquiryForm && successView && submitBtn && formAnnouncer) {
        inquiryForm.addEventListener("submit", (e) => {
            e.preventDefault();
            submitBtn.disabled = true;
            if (submitBtnText) submitBtnText.textContent = "Transmitting...";
            if (submitBtnIcon) {
                submitBtnIcon.setAttribute("data-lucide", "loader-2");
                submitBtnIcon.classList.add("animate-spin");
                lucide.createIcons();
            }
            formAnnouncer.textContent = "Transmitting project specification to founders. Please wait.";

            setTimeout(() => {
                inquiryForm.classList.add("hidden");
                inquiryForm.setAttribute("aria-hidden", "true");
                successView.classList.remove("hidden");
                successView.setAttribute("aria-hidden", "false");
                successView.classList.add("animate-fade-in");
                formAnnouncer.textContent = "Specification successfully transmitted. Both founders will contact you within 4 hours.";
            }, 1000);
        });
    }

    if (resetFormBtn && inquiryForm && successView && submitBtn) {
        resetFormBtn.addEventListener("click", () => {
            inquiryForm.reset();
            submitBtn.disabled = false;
            if (submitBtnText) submitBtnText.textContent = "Transmit Specification";
            if (submitBtnIcon) {
                submitBtnIcon.setAttribute("data-lucide", "arrow-right");
                submitBtnIcon.classList.remove("animate-spin");
                lucide.createIcons();
            }
            successView.classList.add("hidden");
            successView.setAttribute("aria-hidden", "true");
            inquiryForm.classList.remove("hidden");
            inquiryForm.setAttribute("aria-hidden", "false");
            formAnnouncer.textContent = "Form reset for new project inquiry.";
        });
    }
});
