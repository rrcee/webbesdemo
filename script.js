document.addEventListener("DOMContentLoaded", () => {
    // Initialize Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    /* ==========================================================================
       1. Floating Navbar & Section Pill Navigation
       ========================================================================== */
    const navContainer = document.getElementById("nav-container");
    const navLinks = document.querySelectorAll(".nav-link");

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
       2. Scroll-Driven Hero Canvas Frame Animation (1 to 166)
       ========================================================================== */
    const TOTAL_FRAMES = 166;
    const canvas = document.getElementById("hero-canvas");
    const ctx = canvas ? canvas.getContext("2d") : null;
    const loader = document.getElementById("canvas-loader");
    const loaderText = document.getElementById("loader-text");

    const imagesCache = {};
    let currentFrame = 1;
    let targetFrame = 1;
    let imagesLoadedCount = 0;

    const padNum = (num) => num.toString().padStart(3, "0");
    const getFrameUrl = (index) => `images/ezgif-frame-${padNum(index)}.jpg`;

    const resizeCanvas = () => {
        if (!canvas) return;
        canvas.width = window.innerWidth * window.devicePixelRatio;
        canvas.height = window.innerHeight * window.devicePixelRatio;
        renderCurrentFrame();
    };

    window.addEventListener("resize", resizeCanvas);

    const renderImageToCanvas = (img) => {
        if (!ctx || !canvas || !img || !img.complete || img.naturalWidth === 0) return;
        
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const imgAspect = img.width / img.height;
        const canvasAspect = canvas.width / canvas.height;

        let renderWidth = canvas.width;
        let renderHeight = canvas.height;

        if (canvasAspect > imgAspect) {
            renderWidth = canvas.width;
            renderHeight = canvas.width / imgAspect;
        } else {
            renderHeight = canvas.height;
            renderWidth = canvas.height * imgAspect;
        }

        // Make cloud graphic slightly smaller (75% scale)
        const scale = 0.75;
        const finalWidth = renderWidth * scale;
        const finalHeight = renderHeight * scale;
        const x = (canvas.width - finalWidth) / 2;
        const y = (canvas.height - finalHeight) / 2;

        ctx.drawImage(img, x, y, finalWidth, finalHeight);
    };

    const renderCurrentFrame = () => {
        const frameIdx = Math.round(currentFrame);
        const img = imagesCache[frameIdx];
        if (img) {
            renderImageToCanvas(img);
        }
    };

    const preloadFrames = async () => {
        const loadImg = (idx) => {
            return new Promise((resolve) => {
                if (imagesCache[idx]) {
                    resolve();
                    return;
                }
                const img = new Image();
                img.src = getFrameUrl(idx);
                img.onload = () => {
                    imagesCache[idx] = img;
                    imagesLoadedCount++;
                    const progress = Math.floor((imagesLoadedCount / TOTAL_FRAMES) * 100);
                    if (loaderText) loaderText.textContent = `Preloading Studio Assets [${progress}%]`;
                    
                    if (idx === 1 && canvas) {
                        resizeCanvas();
                    }
                    resolve();
                };
                img.onerror = () => resolve();
            });
        };

        const initialBatch = [];
        for (let i = 1; i <= 15; i++) {
            initialBatch.push(loadImg(i));
        }
        await Promise.all(initialBatch);

        if (loader) {
            loader.style.opacity = "0";
            setTimeout(() => loader.style.display = "none", 700);
        }

        for (let i = 16; i <= TOTAL_FRAMES; i += 5) {
            const batch = [];
            for (let j = i; j < Math.min(i + 5, TOTAL_FRAMES + 1); j++) {
                batch.push(loadImg(j));
            }
            await Promise.all(batch);
        }
    };

    if (canvas) {
        resizeCanvas();
        preloadFrames();
    }

    const heroSection = document.getElementById("hero");
    const textSlide1 = document.getElementById("hero-text-1");
    const textSlide2 = document.getElementById("hero-text-2");
    const textSlide3 = document.getElementById("hero-text-3");

    const updateHeroScroll = () => {
        if (!heroSection) return;
        const rect = heroSection.getBoundingClientRect();
        const heroHeight = rect.height - window.innerHeight;
        const scrolled = -rect.top;
        let progress = Math.max(0, Math.min(1, scrolled / heroHeight));

        targetFrame = Math.max(1, Math.min(TOTAL_FRAMES, Math.round(progress * (TOTAL_FRAMES - 1) + 1)));

        if (textSlide1 && textSlide2 && textSlide3) {
            if (progress < 0.22) {
                textSlide1.style.opacity = "1";
                textSlide1.style.transform = "translateY(0)";
            } else {
                textSlide1.style.opacity = "0";
                textSlide1.style.transform = "translateY(-50px)";
            }

            if (progress >= 0.25 && progress < 0.58) {
                textSlide2.style.opacity = "1";
                textSlide2.style.transform = "translateY(0)";
            } else if (progress < 0.25) {
                textSlide2.style.opacity = "0";
                textSlide2.style.transform = "translateY(50px)";
            } else {
                textSlide2.style.opacity = "0";
                textSlide2.style.transform = "translateY(-50px)";
            }

            if (progress >= 0.62) {
                textSlide3.style.opacity = "1";
                textSlide3.style.transform = "translateY(0)";
            } else {
                textSlide3.style.opacity = "0";
                textSlide3.style.transform = "translateY(50px)";
            }
        }
    };

    window.addEventListener("scroll", updateHeroScroll, { passive: true });

    const renderLoop = () => {
        const diff = targetFrame - currentFrame;
        if (Math.abs(diff) > 0.05) {
            currentFrame += diff * 0.12;
            renderCurrentFrame();
        } else {
            currentFrame = targetFrame;
        }
        requestAnimationFrame(renderLoop);
    };
    requestAnimationFrame(renderLoop);

    /* ==========================================================================
       3. Accessible Inquiry Form with Asynchronous ARIA Live Feedback
       ========================================================================== */
    const inquiryForm = document.getElementById("inquiry-form");
    const successView = document.getElementById("success-view");
    const resetFormBtn = document.getElementById("reset-form-btn");
    const submitBtn = document.getElementById("submit-btn");
    const submitBtnText = document.getElementById("submit-btn-text");
    const submitBtnIcon = document.getElementById("submit-btn-icon");
    const formAnnouncer = document.getElementById("form-announcer");

    if (inquiryForm && successView && submitBtn && formAnnouncer) {
        inquiryForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            // Asynchronous Loading State
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
