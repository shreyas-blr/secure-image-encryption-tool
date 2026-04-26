/**
 * CipherVault — Image Encryption Dashboard
 * Client-side JavaScript for UI interactions and API communication
 */

(function () {
    'use strict';

    // ==========================
    // STATE
    // ==========================
    const state = {
        mode: 'encrypt',
        file: null,
        fileName: '',
        resultData: null,
        sliderPos: 50,
        isDragging: false,
        histChannel: 'r'
    };

    // ==========================
    // DOM ELEMENTS
    // ==========================
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const dom = {
        themeToggle: $('#theme-toggle'),
        btnEncrypt: $('#btn-encrypt'),
        btnDecrypt: $('#btn-decrypt'),
        modeSlider: $('#mode-slider'),
        uploadZone: $('#upload-zone'),
        fileInput: $('#file-input'),
        imagePreview: $('#image-preview'),
        previewImage: $('#preview-image'),
        previewInfo: $('#preview-info'),
        btnRemove: $('#btn-remove'),
        passwordInput: $('#password-input'),
        btnEye: $('#btn-eye'),
        strengthFill: $('#strength-fill'),
        strengthLabel: $('#strength-label'),
        passwordTips: $('#password-tips'),
        keyHash: $('#key-hash'),
        btnProcess: $('#btn-process'),
        btnText: $('#btn-text'),
        btnLoading: $('#btn-loading'),
        processingOverlay: $('#processing-overlay'),
        processingTitle: $('#processing-title'),
        progressFill: $('#progress-fill'),
        progressText: $('#progress-text'),
        resultsSection: $('#results-section'),
        compareOriginal: $('#compare-original'),
        compareResult: $('#compare-result'),
        comparisonBefore: $('#comparison-before'),
        comparisonSlider: $('#comparison-slider'),
        sliderHandle: $('#slider-handle'),
        labelResult: $('#label-result'),
        resultTag: $('#result-tag'),
        histResultLabel: $('#hist-result-label'),
        originalDetailGrid: $('#original-detail-grid'),
        resultDetailGrid: $('#result-detail-grid'),
        btnDownload: $('#btn-download'),
        btnNew: $('#btn-new'),
        toastContainer: $('#toast-container')
    };

    // ==========================
    // THEME
    // ==========================
    function initTheme() {
        const saved = localStorage.getItem('ciphervault-theme');
        if (saved) {
            document.documentElement.setAttribute('data-theme', saved);
        }
    }

    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('ciphervault-theme', next);
    }

    // ==========================
    // MODE TOGGLE
    // ==========================
    function setMode(mode) {
        state.mode = mode;

        dom.btnEncrypt.classList.toggle('active', mode === 'encrypt');
        dom.btnDecrypt.classList.toggle('active', mode === 'decrypt');
        dom.modeSlider.classList.toggle('right', mode === 'decrypt');

        const label = mode === 'encrypt' ? 'Encrypt Image' : 'Decrypt Image';
        const icon = mode === 'encrypt'
            ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>'
            : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>';

        dom.btnText.innerHTML = `${icon} ${label}`;
    }

    // ==========================
    // FILE UPLOAD
    // ==========================
    function handleFile(file) {
        if (!file || !file.type.startsWith('image/')) {
            showToast('Please select a valid image file.', 'error');
            return;
        }

        state.file = file;
        state.fileName = file.name;

        const reader = new FileReader();
        reader.onload = (e) => {
            dom.previewImage.src = e.target.result;
            dom.uploadZone.style.display = 'none';
            dom.imagePreview.style.display = 'block';

            // Show file info
            const img = new window.Image();
            img.onload = () => {
                const sizeStr = formatFileSize(file.size);
                dom.previewInfo.innerHTML = `
                    <span class="info-tag">📐 <strong>${img.width} × ${img.height}</strong></span>
                    <span class="info-tag">📁 <strong>${sizeStr}</strong></span>
                    <span class="info-tag">🎨 <strong>${file.type.split('/')[1].toUpperCase()}</strong></span>
                    <span class="info-tag">📝 <strong>${file.name}</strong></span>
                `;
                updateProcessButton();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function removeFile() {
        state.file = null;
        state.fileName = '';
        dom.fileInput.value = '';
        dom.uploadZone.style.display = 'flex';
        dom.imagePreview.style.display = 'none';
        dom.previewImage.src = '';
        dom.previewInfo.innerHTML = '';
        updateProcessButton();
    }

    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    // ==========================
    // PASSWORD
    // ==========================
    function handlePasswordInput() {
        const pw = dom.passwordInput.value;

        // Show/hide tips
        if (pw.length > 0) {
            dom.passwordTips.classList.add('visible');
        } else {
            dom.passwordTips.classList.remove('visible');
        }

        // Check criteria
        const checks = {
            length: pw.length >= 8,
            upper: /[A-Z]/.test(pw),
            lower: /[a-z]/.test(pw),
            number: /[0-9]/.test(pw),
            special: /[^A-Za-z0-9]/.test(pw)
        };

        for (const [key, met] of Object.entries(checks)) {
            const tip = $(`#tip-${key}`);
            tip.classList.toggle('met', met);
            tip.querySelector('.tip-icon').textContent = met ? '✓' : '○';
        }

        // Calculate strength
        const score = Object.values(checks).filter(Boolean).length;
        let strength = '', color = '', width = '0%';

        if (pw.length === 0) {
            strength = '';
            width = '0%';
            color = 'transparent';
        } else if (score <= 1) {
            strength = 'Weak';
            width = '20%';
            color = '#ef4444';
        } else if (score === 2) {
            strength = 'Fair';
            width = '40%';
            color = '#f59e0b';
        } else if (score === 3) {
            strength = 'Good';
            width = '60%';
            color = '#f59e0b';
        } else if (score === 4) {
            strength = 'Strong';
            width = '80%';
            color = '#22c55e';
        } else {
            strength = 'Excellent';
            width = '100%';
            color = '#22c55e';
        }

        dom.strengthFill.style.width = width;
        dom.strengthFill.style.background = color;
        dom.strengthLabel.textContent = strength;
        dom.strengthLabel.style.color = color;

        // Key hash preview
        if (pw.length > 0) {
            crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw)).then(buf => {
                const hash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
                dom.keyHash.textContent = hash;
                dom.keyHash.classList.add('active');
            });
        } else {
            dom.keyHash.textContent = 'Enter password to generate key...';
            dom.keyHash.classList.remove('active');
        }

        updateProcessButton();
    }

    function togglePasswordVisibility() {
        const isPassword = dom.passwordInput.type === 'password';
        dom.passwordInput.type = isPassword ? 'text' : 'password';
        dom.btnEye.querySelector('.eye-open').style.display = isPassword ? 'none' : 'block';
        dom.btnEye.querySelector('.eye-closed').style.display = isPassword ? 'block' : 'none';
    }

    // ==========================
    // PROCESS BUTTON STATE
    // ==========================
    function updateProcessButton() {
        const hasFile = state.file !== null;
        const hasPassword = dom.passwordInput.value.length > 0;
        dom.btnProcess.disabled = !(hasFile && hasPassword);
    }

    // ==========================
    // PROCESSING
    // ==========================
    async function processImage() {
        if (!state.file || !dom.passwordInput.value) return;

        const formData = new FormData();
        formData.append('image', state.file);
        formData.append('password', dom.passwordInput.value);
        formData.append('mode', state.mode);

        // Show processing overlay
        dom.processingOverlay.style.display = 'flex';
        dom.processingTitle.textContent = state.mode === 'encrypt' ? 'Encrypting Image...' : 'Decrypting Image...';
        dom.btnText.style.display = 'none';
        dom.btnLoading.style.display = 'flex';

        // Animate processing steps
        const steps = ['step-1', 'step-2', 'step-3', 'step-4', 'step-5'];
        steps.forEach(s => {
            const el = $(`#${s}`);
            el.classList.remove('active', 'done');
            el.querySelector('.proc-step-icon').textContent = '⏳';
        });

        let progress = 0;
        const progressInterval = setInterval(() => {
            if (progress < 90) {
                progress += Math.random() * 8;
                if (progress > 90) progress = 90;
                dom.progressFill.style.width = progress + '%';
                dom.progressText.textContent = Math.round(progress) + '%';

                // Activate steps
                const stepIdx = Math.floor((progress / 100) * 5);
                for (let i = 0; i < 5; i++) {
                    const el = $(`#step-${i + 1}`);
                    if (i < stepIdx) {
                        el.classList.remove('active');
                        el.classList.add('done');
                        el.querySelector('.proc-step-icon').textContent = '✅';
                    } else if (i === stepIdx) {
                        el.classList.add('active');
                        el.querySelector('.proc-step-icon').textContent = '⚙️';
                    }
                }
            }
        }, 200);

        try {
            const response = await fetch('/api/process', {
                method: 'POST',
                body: formData
            });

            clearInterval(progressInterval);

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Processing failed');
            }

            const data = await response.json();
            state.resultData = data;

            // Complete progress animation
            dom.progressFill.style.width = '100%';
            dom.progressText.textContent = '100%';

            steps.forEach(s => {
                const el = $(`#${s}`);
                el.classList.remove('active');
                el.classList.add('done');
                el.querySelector('.proc-step-icon').textContent = '✅';
            });

            await new Promise(r => setTimeout(r, 600));

            // Hide overlay, show results
            dom.processingOverlay.style.display = 'none';
            showResults(data);
            showToast(`Image ${state.mode}ed successfully!`, 'success');

        } catch (error) {
            clearInterval(progressInterval);
            dom.processingOverlay.style.display = 'none';
            showToast(error.message, 'error');
        } finally {
            dom.btnText.style.display = 'flex';
            dom.btnLoading.style.display = 'none';
        }
    }

    // ==========================
    // SHOW RESULTS
    // ==========================
    function showResults(data) {
        const modeLabel = data.mode === 'encrypt' ? 'Encrypted' : 'Decrypted';

        // Labels
        dom.labelResult.textContent = modeLabel;
        dom.resultTag.textContent = modeLabel.toUpperCase();
        dom.histResultLabel.textContent = modeLabel;

        // Comparison images
        dom.compareOriginal.src = data.originalImage;
        dom.compareResult.src = data.resultImage;

        // Reset slider
        state.sliderPos = 50;
        updateSlider();

        // Image details - Original
        dom.originalDetailGrid.innerHTML = renderDetails(data.originalDetails);

        // Image details - Result
        dom.resultDetailGrid.innerHTML = renderDetails(data.resultDetails);

        // Stats
        $('#stat-time').textContent = data.processingTime + 's';
        $('#stat-mode').textContent = data.mode === 'encrypt' ? 'Encrypt' : 'Decrypt';
        $('#stat-pixels').textContent = formatNumber(data.originalDetails.totalPixels);
        const eDiff = (data.resultDetails.entropy - data.originalDetails.entropy).toFixed(3);
        $('#stat-entropy-change').textContent = (eDiff >= 0 ? '+' : '') + eDiff;

        // Draw histograms
        drawHistograms(data, state.histChannel);

        // Show results section
        dom.resultsSection.style.display = 'block';
        dom.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function renderDetails(d) {
        return `
            <div class="detail-item"><div class="label">Dimensions</div><div class="value">${d.width} × ${d.height}</div></div>
            <div class="detail-item"><div class="label">Total Pixels</div><div class="value">${formatNumber(d.totalPixels)}</div></div>
            <div class="detail-item"><div class="label">Color Mode</div><div class="value">${d.mode}</div></div>
            <div class="detail-item"><div class="label">Aspect Ratio</div><div class="value">${d.aspectRatio}</div></div>
            <div class="detail-item"><div class="label">Avg Red</div><div class="value" style="color:#ef4444">${d.avgR}</div></div>
            <div class="detail-item"><div class="label">Avg Green</div><div class="value" style="color:#22c55e">${d.avgG}</div></div>
            <div class="detail-item"><div class="label">Avg Blue</div><div class="value" style="color:#3b82f6">${d.avgB}</div></div>
            <div class="detail-item"><div class="label">Entropy</div><div class="value">${d.entropy}</div></div>
        `;
    }

    function formatNumber(n) {
        if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
        if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
        return n.toString();
    }

    // ==========================
    // COMPARISON SLIDER
    // ==========================
    function updateSlider() {
        const pct = Math.max(0, Math.min(100, state.sliderPos));
        dom.comparisonBefore.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
        dom.sliderHandle.style.left = pct + '%';
    }

    function initComparisonSlider() {
        const slider = dom.comparisonSlider;

        function getPos(e) {
            const rect = slider.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            return ((clientX - rect.left) / rect.width) * 100;
        }

        slider.addEventListener('mousedown', (e) => {
            state.isDragging = true;
            state.sliderPos = getPos(e);
            updateSlider();
        });

        slider.addEventListener('touchstart', (e) => {
            state.isDragging = true;
            state.sliderPos = getPos(e);
            updateSlider();
        }, { passive: true });

        document.addEventListener('mousemove', (e) => {
            if (!state.isDragging) return;
            state.sliderPos = getPos(e);
            updateSlider();
        });

        document.addEventListener('touchmove', (e) => {
            if (!state.isDragging) return;
            state.sliderPos = getPos(e);
            updateSlider();
        }, { passive: true });

        document.addEventListener('mouseup', () => { state.isDragging = false; });
        document.addEventListener('touchend', () => { state.isDragging = false; });
    }

    // ==========================
    // HISTOGRAMS
    // ==========================
    function drawHistograms(data, channel) {
        drawSingleHistogram('hist-original', data.originalHistogram[channel], channel);
        drawSingleHistogram('hist-result', data.resultHistogram[channel], channel);
    }

    function drawSingleHistogram(canvasId, histData, channel) {
        const canvas = $(`#${canvasId}`);
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;

        ctx.clearRect(0, 0, w, h);

        const maxVal = Math.max(...histData);
        if (maxVal === 0) return;

        const colors = {
            r: { stroke: '#ef4444', fill: 'rgba(239,68,68,0.15)' },
            g: { stroke: '#22c55e', fill: 'rgba(34,197,94,0.15)' },
            b: { stroke: '#3b82f6', fill: 'rgba(59,130,246,0.15)' }
        };

        const c = colors[channel];
        const barW = w / 256;
        const padding = 25;

        // Draw fill
        ctx.beginPath();
        ctx.moveTo(0, h - padding);
        for (let i = 0; i < 256; i++) {
            const x = i * barW;
            const barH = (histData[i] / maxVal) * (h - padding - 5);
            ctx.lineTo(x, h - padding - barH);
        }
        ctx.lineTo(w, h - padding);
        ctx.closePath();
        ctx.fillStyle = c.fill;
        ctx.fill();

        // Draw line
        ctx.beginPath();
        for (let i = 0; i < 256; i++) {
            const x = i * barW;
            const barH = (histData[i] / maxVal) * (h - padding - 5);
            if (i === 0) ctx.moveTo(x, h - padding - barH);
            else ctx.lineTo(x, h - padding - barH);
        }
        ctx.strokeStyle = c.stroke;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // X-axis labels
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-tertiary').trim() || '#888';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        for (let i = 0; i <= 255; i += 64) {
            ctx.fillText(i.toString(), i * barW, h - 5);
        }
        ctx.fillText('255', 255 * barW, h - 5);
    }

    // ==========================
    // TABS
    // ==========================
    function initTabs() {
        // Detail tabs
        $$('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                $$('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                $$('.details-content').forEach(c => c.style.display = 'none');
                $(`#${tab}`).style.display = 'block';
            });
        });

        // Histogram channel tabs
        $$('.hist-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                const ch = btn.dataset.channel;
                state.histChannel = ch;
                $$('.hist-tab').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                if (state.resultData) {
                    drawHistograms(state.resultData, ch);
                }
            });
        });
    }

    // ==========================
    // DOWNLOAD
    // ==========================
    function downloadResult() {
        if (!state.resultData) return;

        try {
            // Convert base64 data URL to Blob for reliable download
            const dataUrl = state.resultData.resultImage;
            const base64 = dataUrl.split(',')[1];
            const byteString = atob(base64);
            const arrayBuffer = new ArrayBuffer(byteString.length);
            const uint8Array = new Uint8Array(arrayBuffer);
            for (let i = 0; i < byteString.length; i++) {
                uint8Array[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([uint8Array], { type: 'image/png' });
            const blobUrl = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.download = `${state.mode}ed_image.png`;
            link.href = blobUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up the blob URL after a short delay
            setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

            showToast('Image downloaded successfully!', 'success');
        } catch (err) {
            showToast('Download failed: ' + err.message, 'error');
        }
    }

    // ==========================
    // RESET
    // ==========================
    function resetApp() {
        removeFile();
        dom.passwordInput.value = '';
        handlePasswordInput();
        dom.resultsSection.style.display = 'none';
        state.resultData = null;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ==========================
    // TOAST
    // ==========================
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️'
        };

        toast.innerHTML = `<span>${icons[type] || ''}</span> ${message}`;
        dom.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast-exit');
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    // ==========================
    // DRAG & DROP
    // ==========================
    function initDragDrop() {
        const zone = dom.uploadZone;

        ['dragenter', 'dragover'].forEach(evt => {
            zone.addEventListener(evt, (e) => {
                e.preventDefault();
                e.stopPropagation();
                zone.classList.add('drag-over');
            });
        });

        ['dragleave', 'drop'].forEach(evt => {
            zone.addEventListener(evt, (e) => {
                e.preventDefault();
                e.stopPropagation();
                zone.classList.remove('drag-over');
            });
        });

        zone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) handleFile(files[0]);
        });
    }

    // ==========================
    // INIT
    // ==========================
    function init() {
        initTheme();
        initComparisonSlider();
        initTabs();
        initDragDrop();

        // Theme
        dom.themeToggle.addEventListener('click', toggleTheme);

        // Mode toggle
        dom.btnEncrypt.addEventListener('click', () => setMode('encrypt'));
        dom.btnDecrypt.addEventListener('click', () => setMode('decrypt'));

        // File upload
        dom.uploadZone.addEventListener('click', () => dom.fileInput.click());
        dom.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) handleFile(e.target.files[0]);
        });
        dom.btnRemove.addEventListener('click', (e) => {
            e.stopPropagation();
            removeFile();
        });

        // Password
        dom.passwordInput.addEventListener('input', handlePasswordInput);
        dom.btnEye.addEventListener('click', togglePasswordVisibility);

        // Process
        dom.btnProcess.addEventListener('click', processImage);

        // Download & New
        dom.btnDownload.addEventListener('click', downloadResult);
        dom.btnNew.addEventListener('click', resetApp);
    }

    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
