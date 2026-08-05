/**
 * Sistem Catatan Harian BDR (Bekerja Dari Rumah)
 * Dibangunkan untuk: Mohd Azrulnizam Mohd Kamarudin
 * Peranan: Ketua Unit ICT / Pensyarah JTMK
 */

// Timetable Configuration (Selasa: 2, Khamis: 4)
const TIMETABLE = {
    // 2 = Selasa (Selasa)
    2: {
        8: { task: "Pelaksanaan Kelas", info: "DFC10353 - Programming Fundamentals (DIT1B) [Amali - LAB2]" },
        9: { task: "Pelaksanaan Kelas", info: "DFC10353 - Programming Fundamentals (DIT1B) [Amali - LAB2]" },
        12: { task: "Pelaksanaan Kelas", info: "DFX40063 - Server Administration (DIT4, DIT5A, DIT5B) [Kuliah - LAB2]" },
        15: { task: "Pelaksanaan Kelas", info: "DFX50083 - Python Programming (DIT5A(B), DIT6(B)) [Kuliah - LAB1]" },
        16: { task: "Pelaksanaan Kelas", info: "DFX50083 - Python Programming (DIT5A(B), DIT6(B)) [Amali - LAB1]" }
    },
    // 4 = Khamis (Khamis)
    4: {
        8: { task: "Pelaksanaan Kelas", info: "DFX50083 - Python Programming (DIT5A(**)/DIT6(**)) [Amali - LAB3]" },
        9: { task: "Pelaksanaan Kelas", info: "DFX50083 - Python Programming (DIT5A(**)/DIT6(**)) [Amali - LAB3]" },
        12: { task: "Pelaksanaan Kelas", info: "DFX40063 - Server Administration (DIT4, DIT5A, DIT5B) [Kuliah - LAB2]" },
        13: { task: "Pelaksanaan Kelas", info: "DFX40063 - Server Administration (DIT4, DIT5A, DIT5B) [Amali - LAB2]" },
        15: { task: "Pelaksanaan Kelas", info: "DFX50083 - Python Programming (DIT5B) [Kuliah - TEC2]" },
        16: { task: "Pelaksanaan Kelas", info: "DFX50083 - Python Programming (DIT5B) [Kuliah - TEC2]" }
    }
};

const DAY_NAMES = {
    0: "Ahad",
    1: "Isnin",
    2: "Selasa",
    3: "Rabu",
    4: "Khamis",
    5: "Jumaat",
    6: "Sabtu"
};

const MONTH_NAMES = [
    "Januari", "Februari", "Mac", "April", "Mei", "Jun", 
    "Julai", "Ogos", "September", "Oktiber", "November", "Disember"
];

// App State
let state = {
    logs: {}, // Format: { "YYYY-MM-DD": { 8: { task: "...", desc: "..." }, ... } }
    profile: {
        name: "MOHD AZRULNIZAM BIN MOHD KAMARUDIN",
        designation: "Ketua Unit ICT / Pensyarah JTMK",
        department: "Jabatan Teknologi Maklumat & Komunikasi",
        institution: "Politeknik METrO Tasek Gelugor",
        hodName: "PUAN Hajah ...",
        hodDesignation: "Ketua Jabatan Teknologi Maklumat & Komunikasi",
        isLecturer: true // default
    },
    signature: "", // base64 string
    activeDate: "", // YYYY-MM-DD
    timetable: {}, // loaded from localstorage or defaulted
    visualTimetable: { type: "", data: "" } // base64 representation of JPG/PDF
};

// Elements
const logDateInput = document.getElementById("log-date");
const themeToggle = document.getElementById("theme-toggle");
const activeLogDateLabel = document.getElementById("active-log-date-label");
const wfhDayWarning = document.getElementById("wfh-day-warning");
const timetableStatusBody = document.getElementById("timetable-status-body");
const saveLogBtn = document.getElementById("save-log-btn");
const printDailyBtn = document.getElementById("print-daily-btn");
const printMonthlyBtn = document.getElementById("print-monthly-btn");
const filterMonthInput = document.getElementById("filter-month");
const historyTableBody = document.getElementById("history-table-body");
const totalDaysCount = document.getElementById("total-days-count");
const totalHoursCount = document.getElementById("total-hours-count");

// History print elements
const printDailyDateSelect = document.getElementById("print-daily-date-select");
const printDailyStatusBox = document.getElementById("print-daily-status-box");
const printDailyStatusError = document.getElementById("print-daily-status-error");
const printDailySelectedBtn = document.getElementById("print-daily-selected-btn");
const printMonthlyStatusBox = document.getElementById("print-monthly-status-box");
const printMonthlyStatusText = document.getElementById("print-monthly-status-text");

// Settings Elements
const profileNameInput = document.getElementById("profile-name");
const profileDesigInput = document.getElementById("profile-designation");
const profileDeptInput = document.getElementById("profile-department");
const profileInstInput = document.getElementById("profile-institution");
const hodNameInput = document.getElementById("hod-name");
const hodDesigInput = document.getElementById("hod-designation");
const saveSettingsBtn = document.getElementById("save-settings-btn");

// Signature Elements
const canvas = document.getElementById("signature-pad");
const ctx = canvas.getContext("2d");
const clearSigBtn = document.getElementById("clear-sig-btn");
const saveSigBtn = document.getElementById("save-sig-btn");
const signaturePreviewImg = document.getElementById("signature-preview-img");
const noSignatureText = document.getElementById("no-signature-text");

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
    loadLocalStorageData();
    setupDateInputs();
    setupEventListeners();
    setupTabNavigation();
    setupSignaturePad();
    
    // Set theme from localstorage or default
    const savedTheme = localStorage.getItem("bdr_theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeToggleIcon(savedTheme);

    // Default to active tab content loading
    loadActiveDateLog();
    updateDashboardStats();
    updateHistoryTable();
    updateSignaturePreview();
    
    // Initialize history print states
    if (printDailyDateSelect) {
        printDailyDateSelect.value = state.activeDate;
        checkDailyPrintDateStatus(state.activeDate);
    }
    updateMonthlyPrintStatus();
});

// Load Data from LocalStorage
function loadLocalStorageData() {
    const savedLogs = localStorage.getItem("bdr_logs");
    if (savedLogs) {
        state.logs = JSON.parse(savedLogs);
    }
    
    const savedProfile = localStorage.getItem("bdr_profile");
    if (savedProfile) {
        state.profile = JSON.parse(savedProfile);
        // Migrasi nama institusi jika masih nilai lalai lama
        if (state.profile.institution === "Politeknik ..." || state.profile.institution === "Politeknik Kuching Sarawak") {
            state.profile.institution = "Politeknik METrO Tasek Gelugor";
            localStorage.setItem("bdr_profile", JSON.stringify(state.profile));
        }
        
        // Ensure default lecturer status
        if (state.profile.isLecturer === undefined) {
            state.profile.isLecturer = true;
        }

        // Pre-populate input fields
        profileNameInput.value = state.profile.name;
        profileDesigInput.value = state.profile.designation;
        profileDeptInput.value = state.profile.department;
        profileInstInput.value = state.profile.institution;
        hodNameInput.value = state.profile.hodName;
        hodDesigInput.value = state.profile.hodDesignation;
        
        const isLecturerCheckbox = document.getElementById("profile-is-lecturer");
        if (isLecturerCheckbox) {
            isLecturerCheckbox.checked = state.profile.isLecturer;
        }
    } else {
        state.profile.isLecturer = true; // default
    }
    
    // Load custom timetable
    const savedTimetable = localStorage.getItem("bdr_timetable");
    if (savedTimetable) {
        state.timetable = JSON.parse(savedTimetable);
        // Migrasi paksa jika dikesan mengandungi subjek Fatimah atau jika jadual kosong
        const savedStr = JSON.stringify(state.timetable);
        if (savedStr.includes("DFC20293") || savedStr === '{"1":{},"2":{},"3":{},"4":{},"5":{}}' || Object.keys(state.timetable).length === 0) {
            state.timetable = JSON.parse(JSON.stringify(TIMETABLE));
            localStorage.setItem("bdr_timetable", JSON.stringify(state.timetable));
            
            // Padam rujukan jadual visual Fatimah
            state.visualTimetable = { type: "", data: "" };
            localStorage.setItem("bdr_visual_timetable", JSON.stringify(state.visualTimetable));
        }
    } else {
        // Fallback to default
        state.timetable = JSON.parse(JSON.stringify(TIMETABLE));
        localStorage.setItem("bdr_timetable", JSON.stringify(state.timetable));
    }

    // Load visual timetable
    const savedVisualTimetable = localStorage.getItem("bdr_visual_timetable");
    if (savedVisualTimetable) {
        state.visualTimetable = JSON.parse(savedVisualTimetable);
    } else {
        state.visualTimetable = { type: "", data: "" };
    }
    checkVisualTimetableBtn();
    renderManualGridInputs();
    
    toggleTimetableSection(state.profile.isLecturer);
    
    const savedSig = localStorage.getItem("bdr_signature");
    if (savedSig) {
        state.signature = savedSig;
    }

    // Set navbar date
    const today = new Date();
    document.getElementById("nav-date-string").innerText = `${DAY_NAMES[today.getDay()]}, ${today.getDate()} ${MONTH_NAMES[today.getMonth()]} ${today.getFullYear()}`;
}

// Setup Date Inputs
function setupDateInputs() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    
    const todayStr = `${yyyy}-${mm}-${dd}`;
    logDateInput.value = todayStr;
    state.activeDate = todayStr;
    
    if (printDailyDateSelect) {
        printDailyDateSelect.value = todayStr;
    }
    
    filterMonthInput.value = `${yyyy}-${mm}`;
}

// Setup Event Listeners
function setupEventListeners() {
    // Theme Toggle
    themeToggle.addEventListener("click", () => {
        let currentTheme = document.documentElement.getAttribute("data-theme");
        let newTheme = currentTheme === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("bdr_theme", newTheme);
        updateThemeToggleIcon(newTheme);
        showToast(`Tema ditukar ke ${newTheme === 'dark' ? 'Gelap' : 'Cerah'}`);
    });

    // Date Picker Change
    logDateInput.addEventListener("change", (e) => {
        state.activeDate = e.target.value;
        loadActiveDateLog();
    });

    // Save Log Button
    saveLogBtn.addEventListener("click", () => {
        saveActiveDateLog();
    });

    // Save Settings Button
    saveSettingsBtn.addEventListener("click", () => {
        state.profile = {
            name: profileNameInput.value.trim(),
            designation: profileDesigInput.value.trim(),
            department: profileDeptInput.value.trim(),
            institution: profileInstInput.value.trim(),
            hodName: hodNameInput.value.trim(),
            hodDesignation: hodDesigInput.value.trim()
        };
        localStorage.setItem("bdr_profile", JSON.stringify(state.profile));
        
        // Update sidebar and top fields
        document.querySelector(".profile-card h4").innerText = state.profile.name.split(" ")[0] || "USER";
        document.querySelector(".profile-card .designation").innerText = state.profile.designation;
        
        showToast("Maklumat peribadi berjaya dikemas kini!");
    });

    // Print Daily Button
    printDailyBtn.addEventListener("click", () => {
        triggerDailyPrint();
    });

    // Print Monthly Button
    printMonthlyBtn.addEventListener("click", () => {
        triggerMonthlyPrint();
    });

    // Month filter change updates history table and monthly print status
    filterMonthInput.addEventListener("change", () => {
        updateHistoryTable();
        updateMonthlyPrintStatus();
    });

    // Daily print date select change in history tab
    if (printDailyDateSelect) {
        printDailyDateSelect.addEventListener("change", (e) => {
            checkDailyPrintDateStatus(e.target.value);
        });
    }

    // Daily print button in history tab
    if (printDailySelectedBtn) {
        printDailySelectedBtn.addEventListener("click", () => {
            const targetDate = printDailyDateSelect.value;
            if (targetDate) {
                triggerDailyPrintForDate(targetDate);
            }
        });
    }

    // Lecturer role checkbox listener
    const isLecturerCheckbox = document.getElementById("profile-is-lecturer");
    if (isLecturerCheckbox) {
        isLecturerCheckbox.addEventListener("change", (e) => {
            state.profile.isLecturer = e.target.checked;
            localStorage.setItem("bdr_profile", JSON.stringify(state.profile));
            toggleTimetableSection(e.target.checked);
            checkVisualTimetableBtn();
            loadActiveDateLog();
            showToast(e.target.checked ? "Mod Pensyarah diaktifkan!" : "Mod Pensyarah dinyahaktifkan!");
        });
    }

    // Timetable CSV file input listener
    const timetableFileInput = document.getElementById("timetable-file-input");
    if (timetableFileInput) {
        timetableFileInput.addEventListener("change", (e) => {
            handleTimetableUpload(e);
        });
    }

    // Download CSV template listener
    const downloadCsvTemplateBtn = document.getElementById("download-csv-template-btn");
    if (downloadCsvTemplateBtn) {
        downloadCsvTemplateBtn.addEventListener("click", () => {
            downloadTimetableCSVTemplate();
        });
    }

    // Toggle manual builder
    const toggleManualBuilderBtn = document.getElementById("toggle-manual-builder-btn");
    const manualBuilderArea = document.getElementById("manual-builder-area");
    if (toggleManualBuilderBtn && manualBuilderArea) {
        toggleManualBuilderBtn.addEventListener("click", () => {
            const isHidden = manualBuilderArea.classList.contains("hidden");
            if (isHidden) {
                manualBuilderArea.classList.remove("hidden");
                toggleManualBuilderBtn.innerHTML = '<i class="fa-solid fa-eye-slash"></i> Tutup Pembina Jadual';
                renderManualGridInputs();
            } else {
                manualBuilderArea.classList.add("hidden");
                toggleManualBuilderBtn.innerHTML = '<i class="fa-solid fa-eye"></i> Tunjukkan Pembina Jadual';
            }
        });
    }

    // Save manual timetable button
    const saveManualTimetableBtn = document.getElementById("save-manual-timetable-btn");
    if (saveManualTimetableBtn) {
        saveManualTimetableBtn.addEventListener("click", () => {
            saveManualTimetable();
        });
    }

    // Floating reference timetable button
    const viewTimetableRefBtn = document.getElementById("view-timetable-ref-btn");
    const timetableModal = document.getElementById("timetable-modal");
    const closeTimetableModal = document.getElementById("close-timetable-modal");
    const timetableModalBody = document.getElementById("timetable-modal-body");

    if (viewTimetableRefBtn && timetableModal && closeTimetableModal && timetableModalBody) {
        viewTimetableRefBtn.addEventListener("click", () => {
            if (!state.visualTimetable || !state.visualTimetable.data) return;

            if (state.visualTimetable.type === 'image') {
                timetableModalBody.innerHTML = `<img src="${state.visualTimetable.data}" alt="Jadual Waktu Visual" style="max-width:100%; height:auto;">`;
            } else if (state.visualTimetable.type === 'pdf') {
                timetableModalBody.innerHTML = `<iframe src="${state.visualTimetable.data}" style="width:100%; height:500px;" frameborder="0"></iframe>`;
            }
            timetableModal.classList.remove("hidden");
        });

        closeTimetableModal.addEventListener("click", () => {
            timetableModal.classList.add("hidden");
            timetableModalBody.innerHTML = ""; // Clear content
        });

        // Close on overlay backdrop click
        timetableModal.addEventListener("click", (e) => {
            if (e.target === timetableModal) {
                timetableModal.classList.add("hidden");
                timetableModalBody.innerHTML = "";
            }
        });
    }

    // Restore default timetable listener
    const restoreDefaultTimetableBtn = document.getElementById("restore-default-timetable-btn");
    if (restoreDefaultTimetableBtn) {
        restoreDefaultTimetableBtn.addEventListener("click", () => {
            if (confirm("Adakah anda pasti untuk menetapkan semula jadual waktu kepada jadual lalai Mohd Azrulnizam?")) {
                state.timetable = JSON.parse(JSON.stringify(TIMETABLE));
                state.visualTimetable = { type: "", data: "" };
                localStorage.setItem("bdr_timetable", JSON.stringify(state.timetable));
                localStorage.setItem("bdr_visual_timetable", JSON.stringify(state.visualTimetable));
                syncLogsWithActiveTimetable();
                updateTimetableStatus();
                checkVisualTimetableBtn();
                loadActiveDateLog();
                showToast("Jadual waktu telah dikembalikan ke jadual asal!");
            }
        });
    }

    // Clear current timetable listener
    const clearCurrentTimetableBtn = document.getElementById("clear-current-timetable-btn");
    if (clearCurrentTimetableBtn) {
        clearCurrentTimetableBtn.addEventListener("click", () => {
            if (confirm("Adakah anda pasti untuk mengosongkan jadual waktu kuliah? Semua pengisian kelas automatik akan dibersihkan.")) {
                state.timetable = { 1: {}, 2: {}, 3: {}, 4: {}, 5: {} };
                localStorage.setItem("bdr_timetable", JSON.stringify(state.timetable));
                syncLogsWithActiveTimetable();
                updateTimetableStatus();
                loadActiveDateLog();
                showToast("Jadual waktu dikosongkan! Sila gunakan Pembina Jadual di bawah untuk menulis jadual baru.");
            }
        });
    }

    // Reload timetable day listener
    const reloadTimetableDayBtn = document.getElementById("reload-timetable-day-btn");
    if (reloadTimetableDayBtn) {
        reloadTimetableDayBtn.addEventListener("click", () => {
            if (confirm("Adakah anda pasti untuk memuat semula jadual waktu? Ini akan menggantikan pengisian kelas hari ini dengan jadual aktif (catatan yang belum disimpan akan hilang).")) {
                if (state.logs[state.activeDate]) {
                    delete state.logs[state.activeDate];
                    localStorage.setItem("bdr_logs", JSON.stringify(state.logs));
                }
                loadActiveDateLog();
                showToast("Jadual waktu semasa berjaya dimuat semula ke dalam borang!");
            }
        });
    }

    // Export Data JSON
    document.getElementById("export-json-btn").addEventListener("click", () => {
        exportDataJSON();
    });

    // Import Data Trigger
    const fileInput = document.getElementById("import-file-input");
    document.getElementById("import-json-btn").addEventListener("click", () => {
        fileInput.click();
    });

    fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const importedData = JSON.parse(evt.target.result);
                if (importedData.logs) {
                    state.logs = importedData.logs;
                    localStorage.setItem("bdr_logs", JSON.stringify(state.logs));
                }
                if (importedData.profile) {
                    state.profile = importedData.profile;
                    localStorage.setItem("bdr_profile", JSON.stringify(state.profile));
                }
                if (importedData.signature) {
                    state.signature = importedData.signature;
                    localStorage.setItem("bdr_signature", state.signature);
                }
                if (importedData.timetable) {
                    state.timetable = importedData.timetable;
                    localStorage.setItem("bdr_timetable", JSON.stringify(state.timetable));
                }
                if (importedData.visualTimetable) {
                    state.visualTimetable = importedData.visualTimetable;
                    localStorage.setItem("bdr_visual_timetable", JSON.stringify(state.visualTimetable));
                }
                
                loadLocalStorageData();
                loadActiveDateLog();
                updateDashboardStats();
                updateHistoryTable();
                updateSignaturePreview();
                showToast("Data berjaya diimport!");
            } catch (err) {
                showToast("Ralat! Fail tidak sah.", "danger");
            }
        };
        reader.readAsText(file);
    });

    // Hourly Attachment Listeners
    const hoursList = [8, 9, 10, 11, 12, 13, 14, 15, 16];
    hoursList.forEach(hr => {
        const itemRow = document.querySelector(`.timeline-item[data-hour="${hr}"]`);
        if (!itemRow) return;

        const fileInput = itemRow.querySelector(".hour-attachment-input");
        const removeBtn = itemRow.querySelector(".remove-hour-attachment-btn");
        const preview = itemRow.querySelector(".hour-attachment-preview");

        if (fileInput) {
            fileInput.addEventListener("change", (e) => {
                const file = e.target.files[0];
                if (!file) return;

                // Max size: 2MB per attachment
                if (file.size > 2 * 1024 * 1024) {
                    showToast("Saiz fail terlalu besar! Had maksimum fail lampiran ialah 2MB.", "danger");
                    e.target.value = "";
                    return;
                }

                const reader = new FileReader();
                reader.onload = (evt) => {
                    state.tempHourAttachments[hr] = {
                        name: file.name,
                        type: file.type,
                        data: evt.target.result
                    };
                    if (preview) {
                        preview.innerText = file.name;
                        preview.title = file.name;
                    }
                    if (removeBtn) removeBtn.classList.remove("hidden");
                    
                    const label = hr < 12 ? `${hr}:00 AM` : (hr === 12 ? "12:00 PM" : `${hr-12}:00 PM`);
                    showToast(`Lampiran jam ${label} berjaya dimuat naik!`);
                };
                reader.readAsDataURL(file);
            });
        }

        if (removeBtn) {
            removeBtn.addEventListener("click", () => {
                if (fileInput) fileInput.value = "";
                delete state.tempHourAttachments[hr];
                if (preview) preview.innerText = "";
                removeBtn.classList.add("hidden");
                
                const label = hr < 12 ? `${hr}:00 AM` : (hr === 12 ? "12:00 PM" : `${hr-12}:00 PM`);
                showToast(`Lampiran jam ${label} dibuang.`);
            });
        }
    });
}

// Update Theme Toggle Icon
function updateThemeToggleIcon(theme) {
    const icon = themeToggle.querySelector("i");
    if (theme === "dark") {
        icon.className = "fa-solid fa-sun";
    } else {
        icon.className = "fa-solid fa-moon";
    }
}

// Tab Navigation logic
function setupTabNavigation() {
    const menuItems = document.querySelectorAll(".menu-item");
    const tabContents = document.querySelectorAll(".tab-content");
    const breadcrumbCurrent = document.getElementById("breadcrumb-current");
    const currentTabTitle = document.getElementById("current-tab-title");

    menuItems.forEach(item => {
        item.addEventListener("click", (e) => {
            const tabId = item.getAttribute("data-tab");
            if (!tabId) return; // Lepaskan pautan luar (seperti manual.html)
            
            e.preventDefault();
            
            // Remove active classes
            menuItems.forEach(mi => mi.classList.remove("active"));
            tabContents.forEach(tc => tc.classList.remove("active"));

            // Add active classes
            item.classList.add("active");
            document.getElementById(`tab-${tabId}`).classList.add("active");

            // Update Breadcrumb & Header
            let tabLabel = "Dashboard";
            if (tabId === "history") tabLabel = "Rekod & Cetakan";
            if (tabId === "settings") tabLabel = "Tetapan & T/Tangan";
            
            breadcrumbCurrent.innerText = tabLabel;
            currentTabTitle.innerText = tabLabel + " Utama";

            // If history tab clicked, refresh history
            if (tabId === "history") {
                updateHistoryTable();
            }
        });
    });
}

// Setup Signature Pad
function setupSignaturePad() {
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    function getCoordinates(e) {
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        // Account for canvas actual internal resolution vs layout client width/height
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    function startDrawing(e) {
        e.preventDefault();
        isDrawing = true;
        const coords = getCoordinates(e);
        lastX = coords.x;
        lastY = coords.y;
        
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
    }

    function draw(e) {
        if (!isDrawing) return;
        e.preventDefault();
        const coords = getCoordinates(e);
        
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
        
        lastX = coords.x;
        lastY = coords.y;
    }

    function stopDrawing() {
        isDrawing = false;
    }

    // Mouse Events
    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseleave", stopDrawing);

    // Touch Events for Mobile/Tablets
    canvas.addEventListener("touchstart", startDrawing, { passive: false });
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", stopDrawing);

    // Clear Signature
    clearSigBtn.addEventListener("click", () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    // Save Signature
    saveSigBtn.addEventListener("click", () => {
        // Check if canvas is empty
        const blank = document.createElement('canvas');
        blank.width = canvas.width;
        blank.height = canvas.height;
        
        if (canvas.toDataURL() === blank.toDataURL()) {
            showToast("Sila lukis tandatangan sebelum menyimpan.", "warning");
            return;
        }

        const dataURL = canvas.toDataURL();
        state.signature = dataURL;
        localStorage.setItem("bdr_signature", dataURL);
        
        updateSignaturePreview();
        showToast("Tandatangan digital berjaya disimpan!");
    });
}

function updateSignaturePreview() {
    if (state.signature) {
        signaturePreviewImg.src = state.signature;
        signaturePreviewImg.classList.remove("hidden");
        noSignatureText.classList.add("hidden");
    } else {
        signaturePreviewImg.src = "";
        signaturePreviewImg.classList.add("hidden");
        noSignatureText.classList.remove("hidden");
    }
}

// Load Log for Active Date
function loadActiveDateLog() {
    const selectedDate = new Date(state.activeDate);
    const dayOfWeek = selectedDate.getDay(); // 0 = Ahad, 1 = Isnin, 2 = Selasa, ...
    
    // Display active date label
    const dayName = DAY_NAMES[dayOfWeek] || "";
    const dateFormatted = `${selectedDate.getDate()} ${MONTH_NAMES[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
    activeLogDateLabel.innerText = `${dayName}, ${dateFormatted}`;

    // WFH Tuesday/Thursday Warning (Official days are Tuesday (2) & Thursday (4))
    if (dayOfWeek === 2 || dayOfWeek === 4) {
        wfhDayWarning.classList.add("hidden");
    } else {
        wfhDayWarning.classList.remove("hidden");
    }

    // Render Timetable status helper widget
    renderTimetableWidget(dayOfWeek);

    // Reset log form fields
    const form = document.getElementById("daily-log-form");
    form.reset();

    // Check if log exists in state
    const savedLog = state.logs[state.activeDate];

    // Initialize temporary hourly attachments
    state.tempHourAttachments = {};
    
    // Setup inputs for hours 8 to 16
    const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16];
    
    hours.forEach(hr => {
        const itemRow = document.querySelector(`.timeline-item[data-hour="${hr}"]`);
        const dropdown = itemRow.querySelector(".task-dropdown");
        const textarea = itemRow.querySelector(".task-desc");
        
        // Reset hourly attachment preview and file input
        const preview = itemRow.querySelector(".hour-attachment-preview");
        const removeBtn = itemRow.querySelector(".remove-hour-attachment-btn");
        const fileInput = itemRow.querySelector(".hour-attachment-input");
        if (fileInput) fileInput.value = "";
        if (preview) preview.innerText = "";
        if (removeBtn) removeBtn.classList.add("hidden");

        // Remove active class styling
        itemRow.className = "timeline-item";

        // Remove any old class badge indicator
        const oldIndicator = itemRow.querySelector(".class-info-indicator");
        if (oldIndicator) oldIndicator.remove();

        const customInput = itemRow.querySelector(".custom-task-input");
        customInput.classList.add("hidden");
        customInput.value = "";

        const defaultTasks = ["Urusan Kerja ICT", "Urusan Penyediaan PdP", "Pembangunan Inovasi", "Pelaksanaan Kelas"];

        const isLecturer = state.profile.isLecturer;

        // 1. If saved log exists
        if (savedLog && savedLog[hr]) {
            const savedTask = savedLog[hr].task;
            textarea.value = savedLog[hr].desc;
            
            // Populate attachment if saved
            if (savedLog[hr].attachment) {
                state.tempHourAttachments[hr] = savedLog[hr].attachment;
                if (preview) {
                    preview.innerText = savedLog[hr].attachment.name;
                    preview.title = savedLog[hr].attachment.name;
                }
                if (removeBtn) removeBtn.classList.remove("hidden");
            }
            
            if (defaultTasks.includes(savedTask)) {
                dropdown.value = savedTask;
            } else {
                dropdown.value = "Lain-lain";
                customInput.classList.remove("hidden");
                customInput.value = savedTask === "Lain-lain" ? "" : savedTask;
            }
            
            if (savedTask === "Pelaksanaan Kelas") {
                itemRow.classList.add("active-class");
                
                // Add helper class name if it is class WFH day (and user is lecturer)
                if (isLecturer) {
                    const timetableDay = state.timetable[dayOfWeek];
                    if (timetableDay && timetableDay[hr]) {
                        insertClassIndicator(itemRow, timetableDay[hr].info);
                    }
                }
            } else {
                itemRow.classList.add("active-task");
            }
        } 
        // 2. Pre-populate classes for official days if no saved log exists
        else {
            const timetableDay = isLecturer ? state.timetable[dayOfWeek] : null;
            if (timetableDay && timetableDay[hr]) {
                dropdown.value = timetableDay[hr].task;
                textarea.value = `Kelas: ${timetableDay[hr].info}\nCatatan Pengajaran: `;
                itemRow.classList.add("active-class");
                insertClassIndicator(itemRow, timetableDay[hr].info);
            } else {
                // If it's WFH lunch hour, default to Lain-lain (Rehat)
                if ((dayOfWeek === 2 && hr === 13) || (dayOfWeek === 4 && hr === 14)) {
                    dropdown.value = "Lain-lain";
                    textarea.value = "Makan tengah hari / Rehat";
                    customInput.classList.remove("hidden");
                    customInput.value = "Rehat / Makan Tengah Hari";
                } else {
                    dropdown.value = "Urusan Kerja ICT";
                    textarea.value = "";
                }
                itemRow.classList.add("active-task");
            }
        }

        // Add dropdown change listener to dynamically style timeline indicator
        dropdown.onchange = (e) => {
            itemRow.className = "timeline-item";
            if (e.target.value === "Pelaksanaan Kelas") {
                itemRow.classList.add("active-class");
            } else {
                itemRow.classList.add("active-task");
            }

            if (e.target.value === "Lain-lain") {
                customInput.classList.remove("hidden");
                customInput.focus();
            } else {
                customInput.classList.add("hidden");
                customInput.value = "";
            }
        };
    });

    // Check if daily print can be enabled
    if (savedLog) {
        printDailyBtn.removeAttribute("disabled");
    } else {
        printDailyBtn.setAttribute("disabled", "true");
    }
}

function insertClassIndicator(rowElement, classInfo) {
    const contentDiv = rowElement.querySelector(".timeline-content");
    const indicator = document.createElement("div");
    indicator.className = "class-info-indicator";
    indicator.innerHTML = `<span><i class="fa-solid fa-chalkboard-user"></i> Jadual Rasmi: ${classInfo}</span> <span class="class-badge">Automatik</span>`;
    contentDiv.insertBefore(indicator, contentDiv.firstChild);
}

// Render Timetable Helper Widget
function renderTimetableWidget(dayOfWeek) {
    if (!state.profile.isLecturer) {
        timetableStatusBody.innerHTML = `
            <div class="text-center placeholder-text">
                <i class="fa-solid fa-user-gear" style="font-size: 2rem; color: var(--text-muted); margin-bottom: 0.5rem; display: block;"></i>
                Mod Pentadbiran Aktif. Tiada pengisian jadual waktu kuliah automatik dijalankan.
            </div>
        `;
        return;
    }

    const timetableDay = state.timetable[dayOfWeek];
    
    if (!timetableDay) {
        timetableStatusBody.innerHTML = `
            <div class="text-center placeholder-text">
                <i class="fa-solid fa-calendar-xmark" style="font-size: 2rem; color: var(--text-muted); margin-bottom: 0.5rem; display: block;"></i>
                Tiada kuliah rasmi dijadualkan bagi hari ${DAY_NAMES[dayOfWeek] || "ini"}.
            </div>
        `;
        return;
    }

    let html = '<div class="class-widget-list">';
    const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16];
    
    hours.forEach(hr => {
        if (timetableDay[hr]) {
            let timeStr = formatHourRange(hr);
            html += `
                <div class="class-widget-item">
                    <span class="class-time-tag">${timeStr}</span>
                    <div class="class-details-tag">
                        <h4>${timetableDay[hr].info.split(" [")[0]}</h4>
                        <p>${timetableDay[hr].info.substring(timetableDay[hr].info.indexOf("["))}</p>
                    </div>
                </div>
            `;
        }
    });
    
    html += '</div>';
    timetableStatusBody.innerHTML = html;
}

function formatHourRange(hr) {
    let startStr = hr < 12 ? `${hr}:00 AM` : (hr === 12 ? "12:00 PM" : `${hr - 12}:00 PM`);
    let nextHr = hr + 1;
    let endStr = nextHr < 12 ? `${nextHr}:00 AM` : (nextHr === 12 ? "12:00 PM" : `${nextHr - 12}:00 PM`);
    return `${startStr} - ${endStr}`;
}

// Save Log Harian
function saveActiveDateLog() {
    const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16];
    const dailyData = {};

    hours.forEach(hr => {
        const itemRow = document.querySelector(`.timeline-item[data-hour="${hr}"]`);
        const dropdown = itemRow.querySelector(".task-dropdown");
        const textarea = itemRow.querySelector(".task-desc");
        const customInput = itemRow.querySelector(".custom-task-input");
        
        let taskName = dropdown.value;
        if (taskName === "Lain-lain" && customInput) {
            const customVal = customInput.value.trim();
            taskName = customVal ? customVal : "Lain-lain";
        }
        
        dailyData[hr] = {
            task: taskName,
            desc: textarea.value.trim()
        };

        if (state.tempHourAttachments[hr]) {
            dailyData[hr].attachment = state.tempHourAttachments[hr];
        }
    });

    state.logs[state.activeDate] = dailyData;
    localStorage.setItem("bdr_logs", JSON.stringify(state.logs));
    
    printDailyBtn.removeAttribute("disabled");
    updateDashboardStats();
    updateHistoryTable();
    if (printDailyDateSelect) checkDailyPrintDateStatus(printDailyDateSelect.value);
    updateMonthlyPrintStatus();
    showToast("Log harian berjaya disimpan!");
}

// Update Stats Cards
function updateDashboardStats() {
    const logKeys = Object.keys(state.logs);
    totalDaysCount.innerText = logKeys.length;
    
    // Total hours: each logged day represents 9 hours (8:00 AM - 5:00 PM)
    totalHoursCount.innerText = logKeys.length * 9;
}

// Populate and Update History Table
function updateHistoryTable() {
    const filterMonth = filterMonthInput.value; // Format: YYYY-MM
    historyTableBody.innerHTML = "";

    if (!filterMonth) {
        historyTableBody.innerHTML = `<tr><td colspan="5" class="text-center placeholder-text">Sila pilih bulan tapis.</td></tr>`;
        return;
    }

    const filteredKeys = Object.keys(state.logs)
        .filter(key => key.startsWith(filterMonth))
        .sort((a, b) => new Date(a) - new Date(b));

    if (filteredKeys.length === 0) {
        historyTableBody.innerHTML = `<tr><td colspan="5" class="text-center placeholder-text">Tiada rekod BDR ditemui bagi bulan ${MONTH_NAMES[parseInt(filterMonth.split("-")[1]) - 1]} ${filterMonth.split("-")[0]}.</td></tr>`;
        return;
    }

    filteredKeys.forEach((key, index) => {
        const logDate = new Date(key);
        const dayOfWeek = logDate.getDay();
        const dateFormatted = `${logDate.getDate()} ${MONTH_NAMES[logDate.getMonth()]} ${logDate.getFullYear()}`;
        
        // Create summary string of activities
        const dailyLogs = state.logs[key];
        const categories = [];
        for (let hr in dailyLogs) {
            if (!categories.includes(dailyLogs[hr].task)) {
                categories.push(dailyLogs[hr].task);
            }
        }
        const categoriesStr = categories.join(", ");

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${dateFormatted}</strong></td>
            <td>${DAY_NAMES[dayOfWeek]}</td>
            <td><span class="help-text">${categoriesStr}</span></td>
            <td>
                <button class="btn btn-secondary btn-icon" onclick="editLoggedDate('${key}')" title="Edit Log"><i class="fa-solid fa-pen-to-square"></i></button>
                <button class="btn btn-secondary btn-icon" onclick="triggerDailyPrintForDate('${key}')" title="Cetak Hari Ini"><i class="fa-solid fa-print"></i></button>
                <button class="btn btn-danger btn-icon" onclick="deleteLoggedDate('${key}')" title="Padam Log"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        historyTableBody.appendChild(tr);
    });
}

// Global functions linked in table actions
window.editLoggedDate = (dateKey) => {
    logDateInput.value = dateKey;
    state.activeDate = dateKey;
    loadActiveDateLog();
    
    // Switch to dashboard tab
    document.querySelector('.menu-item[data-tab="dashboard"]').click();
};

window.triggerDailyPrintForDate = (dateKey) => {
    // Temporarily change active date to populate printing
    const previousActive = state.activeDate;
    state.activeDate = dateKey;
    triggerDailyPrint();
    state.activeDate = previousActive;
};

window.deleteLoggedDate = (dateKey) => {
    if (confirm(`Adakah anda pasti untuk memadam log bertarikh ${dateKey}?`)) {
        delete state.logs[dateKey];
        localStorage.setItem("bdr_logs", JSON.stringify(state.logs));
        updateDashboardStats();
        updateHistoryTable();
        loadActiveDateLog();
        if (printDailyDateSelect) checkDailyPrintDateStatus(printDailyDateSelect.value);
        updateMonthlyPrintStatus();
        showToast("Log berjaya dipadam.", "warning");
    }
};

// Daily Report Printing Logic
function triggerDailyPrint() {
    const savedLog = state.logs[state.activeDate];
    if (!savedLog) {
        showToast("Tiada rekod disimpan bagi tarikh ini untuk dicetak.", "warning");
        return;
    }

    const logDate = new Date(state.activeDate);
    const dayOfWeek = logDate.getDay();
    const dateStrFormatted = `${logDate.getDate()} ${MONTH_NAMES[logDate.getMonth()]} ${logDate.getFullYear()}`;

    // Fill daily template fields
    document.getElementById("print-daily-inst").innerText = state.profile.institution.toUpperCase();
    document.getElementById("print-daily-name").innerText = state.profile.name.toUpperCase();
    document.getElementById("print-daily-desig").innerText = state.profile.designation;
    document.getElementById("print-daily-day").innerText = DAY_NAMES[dayOfWeek];
    document.getElementById("print-daily-date").innerText = dateStrFormatted;
    document.getElementById("print-daily-dept").innerText = state.profile.department;

    // Fill Signatures labels
    document.getElementById("print-daily-user-name-label").innerText = state.profile.name.toUpperCase();
    document.getElementById("print-daily-user-desig-label").innerText = state.profile.designation;
    document.getElementById("print-daily-user-date-label").innerText = `Tarikh: ${dateStrFormatted}`;
    
    document.getElementById("print-daily-hod-name-label").innerText = state.profile.hodName.toUpperCase();
    document.getElementById("print-daily-hod-desig-label").innerText = state.profile.hodDesignation;

    // Signature image insertion
    const sigImg = document.getElementById("print-daily-user-sig");
    if (state.signature) {
        sigImg.src = state.signature;
        sigImg.style.display = "block";
    } else {
        sigImg.src = "";
        sigImg.style.display = "none";
    }

    // Populate activities table
    const tableBody = document.getElementById("print-daily-activities-body");
    tableBody.innerHTML = "";

    const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16];
    hours.forEach((hr, index) => {
        const timeRangeStr = formatHourRange(hr);
        const taskName = savedLog[hr] ? savedLog[hr].task : "";
        const taskDesc = savedLog[hr] ? savedLog[hr].desc : "";
        const taskAttachment = (savedLog[hr] && savedLog[hr].attachment) ? savedLog[hr].attachment : null;

        // Format description text nicely for printing (handle carriage returns)
        let formattedDesc = taskDesc.replace(/\n/g, "<br>");

        if (taskAttachment) {
            if (taskAttachment.type.startsWith("image/")) {
                formattedDesc += `
                    <div style="margin-top: 0.5rem; text-align: left; page-break-inside: avoid;">
                        <img src="${taskAttachment.data}" style="max-height: 100px; max-width: 100%; border: 1px solid #ccc; border-radius: 4px; padding: 2px;">
                    </div>
                `;
            } else if (taskAttachment.type.startsWith("video/")) {
                formattedDesc += `
                    <div style="margin-top: 0.5rem; text-align: left; font-size: 0.75rem; color: #475569; display: flex; align-items: center; gap: 0.25rem; page-break-inside: avoid;">
                        <i class="fa-solid fa-file-video"></i>
                        <span>Bukti Video: ${taskAttachment.name}</span>
                    </div>
                `;
            }
        }

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td style="text-align: center;">${index + 1}</td>
            <td style="text-align: center; white-space: nowrap;">${timeRangeStr}</td>
            <td style="font-weight: 500;">${taskName}</td>
            <td>${formattedDesc}</td>
        `;
        tableBody.appendChild(tr);
    });

    const printAttachmentSec = document.getElementById("print-daily-attachment-section");
    if (printAttachmentSec) printAttachmentSec.classList.add("hidden");

    // Set print mode body class to prevent double-printing
    document.body.classList.add("print-mode-daily");
    document.body.classList.remove("print-mode-monthly");

    window.print();

    // Clean up after print window closes
    setTimeout(() => {
        document.body.classList.remove("print-mode-daily");
    }, 1000);
}

// Monthly Consolidated Report Printing
function triggerMonthlyPrint() {
    const filterMonth = filterMonthInput.value; // YYYY-MM
    if (!filterMonth) {
        showToast("Sila pilih bulan dan tahun di bahagian sejarah.", "warning");
        return;
    }

    const filteredKeys = Object.keys(state.logs)
        .filter(key => key.startsWith(filterMonth))
        .sort((a, b) => new Date(a) - new Date(b));

    if (filteredKeys.length === 0) {
        showToast("Tiada rekod log ditemui bagi bulan yang dipilih.", "warning");
        return;
    }

    const monthParts = filterMonth.split("-");
    const monthName = MONTH_NAMES[parseInt(monthParts[1]) - 1];
    const yearStr = monthParts[0];
    const monthlyPeriodStr = `${monthName} ${yearStr}`;

    // 1. Populate Monthly Summary Page
    document.getElementById("print-monthly-inst").innerText = state.profile.institution.toUpperCase();
    document.getElementById("print-monthly-name").innerText = state.profile.name.toUpperCase();
    document.getElementById("print-monthly-desig").innerText = state.profile.designation;
    document.getElementById("print-monthly-dept").innerText = state.profile.department;
    document.getElementById("print-monthly-period").innerText = monthlyPeriodStr;

    // Monthly sign
    document.getElementById("print-monthly-user-name-label").innerText = state.profile.name.toUpperCase();
    document.getElementById("print-monthly-user-desig-label").innerText = state.profile.designation;
    document.getElementById("print-monthly-user-date-label").innerText = `Tarikh: 30 ${monthName} ${yearStr}`; // Last day of month representation
    document.getElementById("print-monthly-hod-name-label").innerText = state.profile.hodName.toUpperCase();
    document.getElementById("print-monthly-hod-desig-label").innerText = state.profile.hodDesignation;

    const monthlySigImg = document.getElementById("print-monthly-user-sig");
    if (state.signature) {
        monthlySigImg.src = state.signature;
        monthlySigImg.style.display = "block";
    } else {
        monthlySigImg.src = "";
        monthlySigImg.style.display = "none";
    }

    const summaryTableBody = document.getElementById("print-monthly-summary-body");
    summaryTableBody.innerHTML = "";

    // 2. Populate Detailed Daily sheets inside monthly pages container
    const detailedLogsContainer = document.getElementById("print-monthly-detailed-logs-container");
    detailedLogsContainer.innerHTML = "";

    filteredKeys.forEach((key, index) => {
        const logDate = new Date(key);
        const dayOfWeek = logDate.getDay();
        const dateStrFormatted = `${logDate.getDate()} ${MONTH_NAMES[logDate.getMonth()]} ${logDate.getFullYear()}`;
        const dailyLog = state.logs[key];

        // Gather categories for summary sheet
        const catMap = {};
        for (let hr in dailyLog) {
            let c = dailyLog[hr].task;
            catMap[c] = (catMap[c] || 0) + 1;
        }
        const summaryTextParts = [];
        for (let cat in catMap) {
            summaryTextParts.push(`${cat} (${catMap[cat]} Jam)`);
        }
        const summaryText = summaryTextParts.join(", ");

        // Append to summary sheet table
        const trSummary = document.createElement("tr");
        trSummary.innerHTML = `
            <td style="text-align: center;">${index + 1}</td>
            <td style="text-align: center;"><strong>${dateStrFormatted}</strong></td>
            <td style="text-align: center;">${DAY_NAMES[dayOfWeek]}</td>
            <td style="text-align: center;">9 Jam</td>
            <td>${summaryText}</td>
        `;
        summaryTableBody.appendChild(trSummary);

        // Create Detailed Sheet with page-break-before
        const dailySheetDiv = document.createElement("div");
        dailySheetDiv.className = "page-break";
        dailySheetDiv.style.marginTop = "30px";
        
        let activitiesRows = "";
        const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16];
        hours.forEach((hr, hrIndex) => {
            const timeRangeStr = formatHourRange(hr);
            const taskName = dailyLog[hr] ? dailyLog[hr].task : "";
            const taskDesc = dailyLog[hr] ? dailyLog[hr].desc : "";
            const taskAttachment = (dailyLog[hr] && dailyLog[hr].attachment) ? dailyLog[hr].attachment : null;
            let formattedDesc = taskDesc.replace(/\n/g, "<br>");

            if (taskAttachment) {
                if (taskAttachment.type.startsWith("image/")) {
                    formattedDesc += `
                        <div style="margin-top: 0.5rem; text-align: left; page-break-inside: avoid;">
                            <img src="${taskAttachment.data}" style="max-height: 100px; max-width: 100%; border: 1px solid #ccc; border-radius: 4px; padding: 2px;">
                        </div>
                    `;
                } else if (taskAttachment.type.startsWith("video/")) {
                    formattedDesc += `
                        <div style="margin-top: 0.5rem; text-align: left; font-size: 0.75rem; color: #475569; display: flex; align-items: center; gap: 0.25rem; page-break-inside: avoid;">
                            <i class="fa-solid fa-file-video"></i>
                            <span>Bukti Video: ${taskAttachment.name}</span>
                        </div>
                    `;
                }
            }

            activitiesRows += `
                <tr>
                    <td style="text-align: center;">${hrIndex + 1}</td>
                    <td style="text-align: center; white-space: nowrap;">${timeRangeStr}</td>
                    <td style="font-weight: 500;">${taskName}</td>
                    <td>${formattedDesc}</td>
                </tr>
            `;
        });

        const sigImageHTML = state.signature ? `<img class="sig-img" src="${state.signature}" alt="Tandatangan Pegawai">` : '';

        dailySheetDiv.innerHTML = `
            <div class="print-header" style="margin-top: 40px;">
                <img src="logo.jpg" alt="Logo Politeknik Malaysia" class="print-logo">
                <h2 class="print-title">LAPORAN AKTIVITI BEKERJA DARI RUMAH (BDR) - PERINCIAN HARIAN</h2>
                <h3 class="print-subtitle">${state.profile.institution.toUpperCase()}</h3>
            </div>

            <table class="info-table">
                <tr>
                    <td class="info-label">Nama Pegawai</td>
                    <td class="info-val">${state.profile.name.toUpperCase()}</td>
                    <td class="info-label">Hari BDR</td>
                    <td class="info-val">${DAY_NAMES[dayOfWeek]}</td>
                </tr>
                <tr>
                    <td class="info-label">Jawatan / Gred</td>
                    <td class="info-val">${state.profile.designation}</td>
                    <td class="info-label">Tarikh BDR</td>
                    <td class="info-val">${dateStrFormatted}</td>
                </tr>
                <tr>
                    <td class="info-label">Bahagian/Jabatan</td>
                    <td class="info-val">${state.profile.department}</td>
                    <td class="info-label">Waktu Bekerja</td>
                    <td class="info-val">8:00 AM - 5:00 PM (9 Jam)</td>
                </tr>
            </table>

            <h4 class="table-section-title">PERINCIAN AKTIVITI HARIAN</h4>
            <table class="activities-print-table">
                <thead>
                    <tr>
                        <th style="width: 5%;">Bil</th>
                        <th style="width: 20%;">Waktu</th>
                        <th style="width: 25%;">Kategori Aktiviti</th>
                        <th style="width: 50%;">Perincian Tugasan / Catatan Pengajaran</th>
                    </tr>
                </thead>
                <tbody>
                    ${activitiesRows}
                </tbody>
            </table>

            <div class="print-signatures-row">
                <div class="sig-col">
                    <p class="sig-title">Disediakan oleh:</p>
                    <div class="sig-space">
                        ${sigImageHTML}
                    </div>
                    <p class="sig-line">............................................................</p>
                    <p class="sig-name">${state.profile.name.toUpperCase()}</p>
                    <p class="sig-designation">${state.profile.designation}</p>
                    <p class="sig-date">Tarikh: ${dateStrFormatted}</p>
                </div>
                <div class="sig-col align-right">
                    <p class="sig-title">Disahkan oleh:</p>
                    <div class="sig-space">
                        <!-- Space for verification signature -->
                    </div>
                    <p class="sig-line">............................................................</p>
                    <p class="sig-name">${state.profile.hodName.toUpperCase()}</p>
                    <p class="sig-designation">${state.profile.hodDesignation}</p>
                    <p class="sig-date">Tarikh: .......................................</p>
                </div>
            </div>
        `;
        detailedLogsContainer.appendChild(dailySheetDiv);
    });

    // Set print mode body class to prevent double-printing
    document.body.classList.add("print-mode-monthly");
    document.body.classList.remove("print-mode-daily");

    window.print();

    // Clean up after print window closes
    setTimeout(() => {
        document.body.classList.remove("print-mode-monthly");
    }, 1000);
}

// JSON Export functionality
function exportDataJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    
    const formattedDate = new Date().toISOString().slice(0,10);
    downloadAnchor.setAttribute("download", `bdr_system_backup_${formattedDate}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("Data log berjaya dieksport!");
}

// Custom Toast Notification System
function showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    const toastMessage = document.getElementById("toast-message");
    
    toastMessage.innerHTML = message;
    
    // Style by type
    if (type === "success") {
        toast.style.borderLeftColor = "var(--success-color)";
    } else if (type === "warning") {
        toast.style.borderLeftColor = "var(--warning-color)";
    } else if (type === "danger") {
        toast.style.borderLeftColor = "var(--danger-color)";
    }

    toast.classList.remove("hidden");
    
    setTimeout(() => {
        toast.classList.add("hidden");
    }, 3000);
}

// Check Daily Log print status in history tab
function checkDailyPrintDateStatus(dateStr) {
    if (state.logs[dateStr]) {
        printDailyStatusBox.classList.remove("hidden");
        printDailyStatusError.classList.add("hidden");
        printDailySelectedBtn.removeAttribute("disabled");
    } else {
        printDailyStatusBox.classList.add("hidden");
        printDailyStatusError.classList.remove("hidden");
        printDailySelectedBtn.setAttribute("disabled", "true");
    }
}

// Update Monthly print status and stats in history tab
function updateMonthlyPrintStatus() {
    const filterMonth = filterMonthInput.value;
    if (!filterMonth) {
        printMonthlyStatusBox.classList.add("hidden");
        printMonthlyBtn.setAttribute("disabled", "true");
        return;
    }
    const filteredKeys = Object.keys(state.logs).filter(key => key.startsWith(filterMonth));
    const count = filteredKeys.length;
    
    printMonthlyStatusText.innerText = `${count} hari BDR direkodkan pada bulan ini.`;
    
    if (count > 0) {
        printMonthlyStatusBox.classList.remove("hidden");
        printMonthlyBtn.removeAttribute("disabled");
    } else {
        printMonthlyStatusBox.classList.add("hidden");
        printMonthlyBtn.setAttribute("disabled", "true");
    }
}

// Helper to parse CSV line, supporting quoted fields
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

// Handle Timetable CSV, Image, or PDF Upload
function handleTimetableUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    
    // 1. If CSV, parse and auto-detect slots
    if (fileName.endsWith('.csv')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target.result;
                const lines = text.split(/\r?\n/);
                const newTimetable = {};
                const dayMap = {
                    "ahad": 0, "sunday": 0,
                    "isnin": 1, "monday": 1,
                    "selasa": 2, "tuesday": 2,
                    "rabu": 3, "wednesday": 3,
                    "khamis": 4, "thursday": 4,
                    "jumaat": 5, "friday": 5,
                    "sabtu": 6, "saturday": 6
                };

                let successCount = 0;

                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;

                    const columns = parseCSVLine(line);
                    if (columns.length < 5) continue;

                    const dayNameInput = columns[0].toLowerCase();
                    const startTimeInput = columns[1];
                    const endTimeInput = columns[2];
                    const courseCode = columns[3];
                    const courseName = columns[4];
                    const className = columns[5] || "";
                    const roomName = columns[6] || "";
                    const classType = columns[7] || "Kuliah";

                    const dayIndex = dayMap[dayNameInput];
                    if (dayIndex === undefined) continue;

                    const startHour = parseInt(startTimeInput.split(":")[0]);
                    const endHour = parseInt(endTimeInput.split(":")[0]);

                    if (isNaN(startHour) || isNaN(endHour) || startHour >= endHour) continue;

                    if (!newTimetable[dayIndex]) {
                        newTimetable[dayIndex] = {};
                    }

                    for (let h = startHour; h < endHour; h++) {
                        newTimetable[dayIndex][h] = {
                            task: "Pelaksanaan Kelas",
                            info: `${courseCode} - ${courseName} (${className}) [${classType} - ${roomName}]`
                        };
                        successCount++;
                    }
                }

                if (successCount > 0) {
                    state.timetable = newTimetable;
                    localStorage.setItem("bdr_timetable", JSON.stringify(state.timetable));
                    syncLogsWithActiveTimetable();
                    updateTimetableStatus();
                    loadActiveDateLog();
                    showToast(`Jadual waktu berjaya diimport! (${successCount} slot kuliah dikesan).`);
                } else {
                    showToast("Tiada slot jadual waktu sah dikesan dalam CSV.", "warning");
                }
            } catch (err) {
                console.error(err);
                showToast("Ralat membaca fail jadual waktu CSV.", "danger");
            }
        };
        reader.readAsText(file);
    } 
    // 2. If Image or PDF
    else if (fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.pdf')) {
        const loadingOverlay = document.getElementById("loading-overlay");
        const loadingText = document.getElementById("loading-overlay-text");

        if (fileName.endsWith('.pdf')) {
            // PDF is saved as visual reference only (cannot OCR easily in client-side JS without pdf.js canvas render)
            const reader = new FileReader();
            reader.onload = (e) => {
                state.visualTimetable = {
                    type: 'pdf',
                    data: e.target.result
                };
                localStorage.setItem("bdr_visual_timetable", JSON.stringify(state.visualTimetable));
                updateTimetableStatus();
                checkVisualTimetableBtn();
                showToast("Fail PDF jadual waktu berjaya disimpan sebagai rujukan visual!");
            };
            reader.readAsDataURL(file);
        } else {
            // It is an Image, run Tesseract.js OCR for auto-detect!
            if (loadingOverlay) loadingOverlay.classList.remove("hidden");
            
            Tesseract.recognize(
                file,
                'eng',
                { logger: m => {
                    if (m.status === 'recognizing' && loadingText) {
                        const pct = Math.floor(m.progress * 100);
                        loadingText.innerText = `Menganalisis Gambar: ${pct}%`;
                    }
                } }
            ).then(result => {
                if (loadingOverlay) loadingOverlay.classList.add("hidden");
                if (loadingText) loadingText.innerText = "Menganalisis jadual waktu...";

                const { data: { words } } = result;
                
                // Group words by horizontal (X) and vertical (Y) coordinates to map days and hours
                let yIsnin = null, ySelasa = null, yRabu = null, yKhamis = null, yJumaat = null;
                const hoursX = {}; // Mapping of hour (8, 9, 10...) to center X coordinate
                
                words.forEach(w => {
                    const text = w.text.toLowerCase().trim();
                    const cx = (w.bbox.x0 + w.bbox.x1) / 2;
                    const cy = (w.bbox.y0 + w.bbox.y1) / 2;
                    
                    // Match day names (supporting fuzzy matching)
                    if (text.includes("isnin") || text === "isnin" || (text.includes("isn") && text.length >= 3)) {
                        yIsnin = cy;
                    } else if (text.includes("selasa") || text === "selasa" || (text.includes("sel") && text.length >= 3)) {
                        ySelasa = cy;
                    } else if (text.includes("rabu") || text === "rabu" || (text.includes("rab") && text.length >= 3)) {
                        yRabu = cy;
                    } else if (text.includes("khamis") || text === "khamis" || (text.includes("kha") && text.length >= 3)) {
                        yKhamis = cy;
                    } else if (text.includes("jumaat") || text === "jumaat" || (text.includes("jum") && text.length >= 3)) {
                        yJumaat = cy;
                    }
                    
                    // Match hour headers: "8:00", "9:00", "10:00", "11:00", "12:00", "1:00", "2:00", "3:00", "4:00", "5:00", "6:00"
                    if (/^8[:.]00/.test(text) || text === "8:00" || text === "8.00") hoursX[8] = cx;
                    else if (/^9[:.]00/.test(text) || text === "9:00" || text === "9.00") hoursX[9] = cx;
                    else if (/^10[:.]00/.test(text) || text === "10:00" || text === "10.00") hoursX[10] = cx;
                    else if (/^11[:.]00/.test(text) || text === "11:00" || text === "11.00") hoursX[11] = cx;
                    else if (/^12[:.]00/.test(text) || text === "12:00" || text === "12.00") hoursX[12] = cx;
                    else if (/^1[:.]00/.test(text) || text === "1:00" || text === "1.00") hoursX[13] = cx;
                    else if (/^2[:.]00/.test(text) || text === "2:00" || text === "2.00") hoursX[14] = cx;
                    else if (/^3[:.]00/.test(text) || text === "3:00" || text === "3.00") hoursX[15] = cx;
                    else if (/^4[:.]00/.test(text) || text === "4:00" || text === "4.00") hoursX[16] = cx;
                    else if (/^5[:.]00/.test(text) || text === "5:00" || text === "5.00") hoursX[17] = cx;
                });
                
                // Interpolation for missing hour columns coordinates
                const detectedHours = Object.keys(hoursX).map(Number).sort((a,b)=>a-b);
                if (detectedHours.length >= 2) {
                    const firstH = detectedHours[0];
                    const lastH = detectedHours[detectedHours.length - 1];
                    const firstX = hoursX[firstH];
                    const lastX = hoursX[lastH];
                    const avgWidth = (lastX - firstX) / (lastH - firstH);
                    for (let h = 8; h <= 17; h++) {
                        if (hoursX[h] === undefined) {
                            hoursX[h] = firstX + (h - firstH) * avgWidth;
                        }
                    }
                } else {
                    showToast("Gagal mengesan koordinat jam. Pastikan gambar jadual waktu adalah jelas dan tegak.", "danger");
                    return;
                }
                
                // Interpolation for Day Y-coordinates
                const dayYArray = [yIsnin, ySelasa, yRabu, yKhamis, yJumaat];
                const detectedDays = [];
                dayYArray.forEach((y, i) => { if (y !== null) detectedDays.push({ index: i + 1, y: y }); });
                
                if (detectedDays.length >= 1) {
                    let avgRowHeight = 70; // default estimate
                    if (detectedDays.length >= 2) {
                        const firstD = detectedDays[0];
                        const lastD = detectedDays[detectedDays.length - 1];
                        avgRowHeight = (lastD.y - firstD.y) / (lastD.index - firstD.index);
                    }
                    const ref = detectedDays[0];
                    yIsnin = ref.y - (ref.index - 1) * avgRowHeight;
                    ySelasa = ref.y - (ref.index - 2) * avgRowHeight;
                    yRabu = ref.y - (ref.index - 3) * avgRowHeight;
                    yKhamis = ref.y - (ref.index - 4) * avgRowHeight;
                    yJumaat = ref.y - (ref.index - 5) * avgRowHeight;
                } else {
                    showToast("Gagal mengesan koordinat hari. Pastikan gambar jadual waktu adalah jelas dan tegak.", "danger");
                    return;
                }
                
                const daysY = { 1: yIsnin, 2: ySelasa, 3: yRabu, 4: yKhamis, 5: yJumaat };
                const rowHeight = (yJumaat - yIsnin) / 4;
                const colWidth = (hoursX[17] - hoursX[8]) / 9;
                
                // Group words into cells
                const cellGroups = {};
                
                words.forEach(w => {
                    const cx = (w.bbox.x0 + w.bbox.x1) / 2;
                    const cy = (w.bbox.y0 + w.bbox.y1) / 2;
                    
                    let dayIndex = null;
                    for (let d = 1; d <= 5; d++) {
                        if (Math.abs(cy - daysY[d]) < rowHeight * 0.45) {
                            dayIndex = d;
                            break;
                        }
                    }
                    
                    let hourIndex = null;
                    for (let h = 8; h <= 16; h++) {
                        const xStart = hoursX[h];
                        const xEnd = hoursX[h+1];
                        if (cx >= xStart - colWidth*0.15 && cx <= xEnd + colWidth*0.15) {
                            hourIndex = h;
                            break;
                        }
                    }
                    
                    if (dayIndex && hourIndex) {
                        const key = `${dayIndex}_${hourIndex}`;
                        if (!cellGroups[key]) cellGroups[key] = [];
                        cellGroups[key].push(w);
                    }
                });
                
                // Reconstruct the new timetable state
                const newTimetable = { 1: {}, 2: {}, 3: {}, 4: {}, 5: {} };
                let detectedCount = 0;
                
                for (let key in cellGroups) {
                    const [d, h] = key.split("_").map(Number);
                    
                    // Sort words in cell left-to-right, top-to-bottom
                    const cellWords = cellGroups[key].sort((a, b) => {
                        if (Math.abs(a.bbox.y0 - b.bbox.y0) < 10) {
                            return a.bbox.x0 - b.bbox.x0;
                        }
                        return a.bbox.y0 - b.bbox.y0;
                    });
                    
                    let cellText = cellWords.map(w => w.text).join(" ").trim();
                    cellText = cellText.replace(/\s+/g, ' ');
                    
                    // Course code pattern filter
                    const hasCourseCode = /[A-Z]{3,4}\d{4,5}/i.test(cellText) || /\bPA\b/i.test(cellText) || /\bPENASIHAT\b/i.test(cellText);
                    
                    if (hasCourseCode) {
                        const noiseFilter = ["isnin", "selasa", "rabu", "khamis", "jumaat", "8:00", "9:00", "10:00", "11:00", "12:00", "1:00", "2:00", "3:00", "4:00", "5:00", "6:00"];
                        noiseFilter.forEach(nf => {
                            const reg = new RegExp("\\b" + nf + "\\b", "gi");
                            cellText = cellText.replace(reg, "");
                        });
                        cellText = cellText.trim();
                        
                        if (cellText.length > 2) {
                            newTimetable[d][h] = {
                                task: "Pelaksanaan Kelas",
                                info: cellText
                            };
                            detectedCount++;
                        }
                    }
                }
                
                if (detectedCount > 0) {
                    state.timetable = newTimetable;
                    localStorage.setItem("bdr_timetable", JSON.stringify(state.timetable));
                    syncLogsWithActiveTimetable();
                    
                    // Save image as visual reference too
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        state.visualTimetable = {
                            type: 'image',
                            data: e.target.result
                        };
                        localStorage.setItem("bdr_visual_timetable", JSON.stringify(state.visualTimetable));
                        updateTimetableStatus();
                        checkVisualTimetableBtn();
                        loadActiveDateLog();
                        showToast(`Jadual waktu berjaya diimbas! (Dikesan: ${detectedCount} slot kuliah aktif).`);
                    };
                    reader.readAsDataURL(file);
                } else {
                    showToast("Tiada slot jadual waktu kuliah sah dikesan dalam gambar. Cuba muat naik gambar yang lebih jelas.", "warning");
                }
            }).catch(err => {
                if (loadingOverlay) loadingOverlay.classList.add("hidden");
                console.error("Tesseract Error:", err);
                showToast("Gagal mengimbas gambar jadual waktu. Sila pastikan sambungan internet aktif untuk memuat turun enjin imbasan.", "danger");
            });
        }
    }
    // 3. Unsupported format
    else {
        showToast("Format fail tidak disokong! Sila muat naik fail .csv, .png, .jpg atau .pdf.", "danger");
    }
}

// Download CSV template
function downloadTimetableCSVTemplate() {
    const csvContent = 
`Hari,Waktu Mula,Waktu Tamat,Kod Kursus,Nama Kursus,Kumpulan/Kelas,Bilik/Makmal,Jenis Kelas (Kuliah/Amali)
Selasa,08:00,10:00,DFC10353,Programming Fundamentals,DIT1B,LAB2,Amali
Selasa,12:00,13:00,DFX40063,Server Administration,"DIT4, DIT5A, DIT5B",LAB2,Kuliah
Selasa,15:00,16:00,DFX50083,Python Programming,"DIT5A(B), DIT6(B)",LAB1,Kuliah
Selasa,16:00,17:00,DFX50083,Python Programming,"DIT5A(B), DIT6(B)",LAB1,Amali
Khamis,08:00,10:00,DFX50083,Python Programming,DIT5A(**)/DIT6(**),LAB3,Amali
Khamis,12:00,13:00,DFX40063,Server Administration,"DIT4, DIT5A, DIT5B",LAB2,Kuliah
Khamis,13:00,14:00,DFX40063,Server Administration,"DIT4, DIT5A, DIT5B",LAB2,Amali
Khamis,15:00,17:00,DFX50083,Python Programming,DIT5B,TEC2,Kuliah`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", url);
    downloadAnchor.setAttribute("download", "bdr_timetable_template.csv");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

// Update Timetable Card Status in Settings
function updateTimetableStatus() {
    const statusBox = document.getElementById("timetable-upload-status");
    const statusText = document.getElementById("timetable-status-text");

    if (!statusBox || !statusText) return;

    let totalSlots = 0;
    for (let day in state.timetable) {
        totalSlots += Object.keys(state.timetable[day]).length;
    }

    let statusMsg = "";
    if (totalSlots > 0) {
        statusMsg = `Jadual waktu tersimpan aktif. (Dikesan: ${totalSlots} slot kuliah bagi seluruh minggu).`;
    } else {
        statusMsg = `Tiada jadual waktu kuliah tersimpan.`;
    }

    if (state.visualTimetable && state.visualTimetable.data) {
        statusMsg += ` | Rujukan Jadual Visual (${state.visualTimetable.type.toUpperCase()}) dikesan & sedia dirujuk.`;
    }

    statusText.innerText = statusMsg;

    if (totalSlots > 0 || (state.visualTimetable && state.visualTimetable.data)) {
        statusBox.classList.remove("hidden");
    } else {
        statusBox.classList.add("hidden");
    }
}

// Toggle display of timetable upload section
function toggleTimetableSection(isLecturer) {
    const section = document.getElementById("timetable-upload-section");
    if (section) {
        if (isLecturer) {
            section.style.display = "block";
            updateTimetableStatus();
        } else {
            section.style.display = "none";
        }
    }
}

// Check if floating reference button should be visible
function checkVisualTimetableBtn() {
    const viewTimetableRefBtn = document.getElementById("view-timetable-ref-btn");
    if (!viewTimetableRefBtn) return;
    
    if (state.visualTimetable && state.visualTimetable.data && state.profile.isLecturer) {
        viewTimetableRefBtn.classList.remove("hidden");
    } else {
        viewTimetableRefBtn.classList.add("hidden");
    }
}

// Render manual grid input boxes in settings
function renderManualGridInputs() {
    const gridSelasa = document.getElementById("manual-grid-selasa");
    const gridKhamis = document.getElementById("manual-grid-khamis");
    if (!gridSelasa || !gridKhamis) return;

    const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16];
    
    // Tuesday (Day 2)
    let selasaHtml = "";
    hours.forEach(hr => {
        let savedVal = "";
        if (state.timetable[2] && state.timetable[2][hr]) {
            savedVal = state.timetable[2][hr].info;
        }
        let timeRange = formatHourRange(hr);
        selasaHtml += `
            <div class="timetable-manual-row">
                <label>${timeRange.split(" - ")[0]}</label>
                <input type="text" class="form-control manual-slot-input" data-day="2" data-hour="${hr}" value="${savedVal}" placeholder="Cth: DFC10353...">
            </div>
        `;
    });
    gridSelasa.innerHTML = selasaHtml;

    // Thursday (Day 4)
    let khamisHtml = "";
    hours.forEach(hr => {
        let savedVal = "";
        if (state.timetable[4] && state.timetable[4][hr]) {
            savedVal = state.timetable[4][hr].info;
        }
        let timeRange = formatHourRange(hr);
        khamisHtml += `
            <div class="timetable-manual-row">
                <label>${timeRange.split(" - ")[0]}</label>
                <input type="text" class="form-control manual-slot-input" data-day="4" data-hour="${hr}" value="${savedVal}" placeholder="Cth: DFX50083...">
            </div>
        `;
    });
    gridKhamis.innerHTML = khamisHtml;
}

// Save manual timetable inputs
function saveManualTimetable() {
    const inputs = document.querySelectorAll(".manual-slot-input");
    
    // Re-initialize Tuesday (2) and Thursday (4) structures
    state.timetable[2] = {};
    state.timetable[4] = {};
    
    inputs.forEach(input => {
        const day = parseInt(input.getAttribute("data-day"));
        const hour = parseInt(input.getAttribute("data-hour"));
        const val = input.value.trim();
        
        if (val) {
            state.timetable[day][hour] = {
                task: "Pelaksanaan Kelas",
                info: val
            };
        }
    });

    localStorage.setItem("bdr_timetable", JSON.stringify(state.timetable));
    syncLogsWithActiveTimetable();
    updateTimetableStatus();
    loadActiveDateLog();
    showToast("Jadual manual berjaya disimpan!");
}

// Synchronize all saved logs with the active timetable
function syncLogsWithActiveTimetable() {
    const isLecturer = state.profile.isLecturer;
    const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16];

    for (let dateKey in state.logs) {
        const logDate = new Date(dateKey);
        const logDay = logDate.getDay();
        
        // Only sync for Tuesday (2) and Thursday (4)
        if (logDay === 2 || logDay === 4) {
            if (!state.logs[dateKey]) continue;

            const timetableDay = isLecturer ? state.timetable[logDay] : null;

            hours.forEach(hr => {
                if (timetableDay && timetableDay[hr]) {
                    // New timetable has a class at this hour
                    if (!state.logs[dateKey][hr]) {
                        state.logs[dateKey][hr] = {
                            task: "Pelaksanaan Kelas",
                            desc: `Kelas: ${timetableDay[hr].info}\nCatatan Pengajaran: `
                        };
                    } else {
                        state.logs[dateKey][hr].task = "Pelaksanaan Kelas";
                        const currentDesc = state.logs[dateKey][hr].desc || "";
                        const match = currentDesc.match(/^(Kelas:\s*.*?\nCatatan Pengajaran:\s*)(.*)$/s);
                        if (match) {
                            state.logs[dateKey][hr].desc = `Kelas: ${timetableDay[hr].info}\nCatatan Pengajaran: ` + match[2];
                        } else {
                            // Strip old class prefix if it is there in some other format
                            const cleanDesc = currentDesc.replace(/^Kelas:\s*.*?\nCatatan Pengajaran:\s*/gi, "");
                            state.logs[dateKey][hr].desc = `Kelas: ${timetableDay[hr].info}\nCatatan Pengajaran: ` + cleanDesc;
                        }
                    }
                } else {
                    // New timetable does NOT have a class at this hour.
                    // If it was previously marked as "Pelaksanaan Kelas", revert it to "Urusan Kerja ICT"
                    if (state.logs[dateKey][hr] && state.logs[dateKey][hr].task === "Pelaksanaan Kelas") {
                        state.logs[dateKey][hr].task = "Urusan Kerja ICT";
                        state.logs[dateKey][hr].desc = "";
                    }
                }
            });
        }
    }
    localStorage.setItem("bdr_logs", JSON.stringify(state.logs));
}
