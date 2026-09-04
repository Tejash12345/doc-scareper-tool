class OnboardingApp {
  constructor() {
    this.currentStep = 0;
    this.totalSteps = 5;
    this.stepNames = ["Upload Documents", "Company Details", "Contact & KMP", "Banking & Compliance", "Preview & Download"];
    this.uploadedFiles = [];
    this.extractedData = {};
    this.formData = {};
    this.autoFilledCount = 0;
    this.totalFields = 0;
    this.theme = localStorage.getItem("theme") || "light";
    this.geminiKey = localStorage.getItem("geminiApiKey") || "";
    this.allExtractedTexts = [];
    this.fieldSourceMap = {};
    this.docFieldCounts = {};
    this.init();
  }

  init() {
    document.documentElement.setAttribute("data-theme", this.theme);
    this.renderApp();
    this.bindEvents();
    this.showStep(0);
  }

  renderApp() {
    const app = document.getElementById("app");
    app.innerHTML = `
      <header class="app-header">
        <div class="header-top">
          <div class="header-brand">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="8" fill="white" fill-opacity="0.15"/>
              <path d="M10 13h16v2H10zM10 17h12v2H10zM10 21h14v2H10zM24 17l4 4-4 4" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <div>
              <h1>DocScraper - Smart Form Filler</h1>
              <p>Upload PDFs &rarr; Extract Data &rarr; Auto-Fill Forms</p>
            </div>
          </div>
          <div class="header-actions">
            <button class="btn-icon" onclick="app.openSettings()" title="AI Settings" style="position:relative">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              ${this.geminiKey ? '<span style="position:absolute;top:2px;right:2px;width:8px;height:8px;background:#4CAF50;border-radius:50;border:1.5px solid var(--primary)"></span>' : ''}
            </button>
            <button class="btn-icon" onclick="app.toggleTheme()" title="Toggle theme">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            </button>
            <button class="btn-icon" onclick="app.resetForm()" title="Reset form">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
            </button>
          </div>
        </div>
        <div class="progress-bar-container">
          <div class="steps-indicator" id="stepsIndicator"></div>
        </div>
        <div id="formCategoryBar" style="display:none;padding:8px 24px;background:rgba(255,255,255,0.1);border-top:1px solid rgba(255,255,255,0.15);align-items:center;justify-content:center;gap:12px">
          <label style="font-size:0.8rem;font-weight:600;color:rgba(255,255,255,0.85);white-space:nowrap">Form Category:</label>
          <select id="formCategoryMain" class="form-input" style="max-width:280px;padding:6px 12px;font-size:0.82rem;border-radius:6px;background:rgba(255,255,255,0.95);color:#333;border:none;font-weight:500" onchange="app.switchFormCategory(this.value)">
            <option value="cifl">CIFL - Onboarding</option>
            <option value="indel">Indel - Onboarding</option>
            <option value="ciflFit">CIFL - FIT Transactions</option>
            <option value="ciflMice">CIFL - MICE Transactions</option>
            <option value="indelFit">Indel - FIT Transactions</option>
            <option value="indelMice">Indel - MICE Transactions</option>
          </select>
        </div>
      </header>
      <div class="main-container">
        <aside class="sidebar">
          <div class="card">
            <div class="card-header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Upload Documents
            </div>
            <div class="card-body">
              <div class="upload-zone" id="uploadZone">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 12 15 15"/></svg>
                <h3>Drop files here</h3>
                <p>PDF, PNG, JPG — any corporate or KYC document</p>
                <input type="file" id="fileInput" accept=".pdf,.png,.jpg,.jpeg,.webp" multiple>
              </div>
              <div class="uploaded-files" id="uploadedFiles"></div>
            </div>
          </div>
          <div class="card" id="accuracyCard" style="display:none">
            <div class="card-header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              Extraction Summary
            </div>
            <div class="card-body">
              <div class="accuracy-meter">
                <div class="accuracy-header">
                  <span>Auto-fill Accuracy</span>
                  <span class="accuracy-value" id="accuracyValue">0%</span>
                </div>
                <div class="accuracy-bar">
                  <div class="accuracy-fill" id="accuracyFill"></div>
                </div>
              </div>
              <div class="extraction-summary" id="extractionSummary" style="margin-top:16px"></div>
              <div id="reAnalyzeWrap" style="display:none;margin-top:12px;text-align:center">
                <button onclick="app.reAnalyzeWithAi()" style="background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;border:none;padding:8px 18px;border-radius:8px;font-size:0.82rem;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:6px;box-shadow:0 2px 8px rgba(124,58,237,0.3)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                  Re-analyze with AI
                </button>
                <div style="font-size:0.7rem;color:var(--text-muted);margin-top:4px">AI will cross-reference all docs to fill gaps</div>
              </div>
            </div>
          </div>
          <div class="card" id="aiInsightsCard" style="display:none">
            <div class="card-header" style="color:var(--accent)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              AI Document Advisor
            </div>
            <div class="card-body" id="aiInsightsBody" style="max-height:400px;overflow-y:auto"></div>
          </div>
          <div class="card" id="docIntelCard" style="display:none">
            <div class="card-header" style="color:#0ea5e9">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              Document Intelligence
            </div>
            <div class="card-body" id="docIntelBody" style="max-height:500px;overflow-y:auto"></div>
          </div>
          <div class="card" id="quickNavCard">
            <div class="card-header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              Quick Navigation
            </div>
            <div class="card-body" id="quickNavItems"></div>
          </div>
        </aside>
        <main class="content-area" id="contentArea"></main>
      </div>
      <div class="toast-container" id="toastContainer"></div>
      <div class="loading-overlay" id="loadingOverlay">
        <div class="loading-card">
          <div class="spinner"></div>
          <div class="loading-text" id="loadingText">Processing...</div>
          <div class="loading-subtext" id="loadingSubtext">Extracting data from PDF</div>
        </div>
      </div>
    `;
    this.renderSteps();
    this.renderQuickNav();
    this.renderFormSections();
  }

  renderSteps() {
    const container = document.getElementById("stepsIndicator");
    container.innerHTML = this.stepNames.map((name, i) => `
      <div class="step-item ${i === 0 ? 'active' : ''}" data-step="${i}" onclick="app.goToStep(${i})">
        <div class="step-circle">${i + 1}</div>
        <span class="step-label">${name}</span>
      </div>
      ${i < this.stepNames.length - 1 ? '<div class="step-connector"></div>' : ''}
    `).join("");
  }

  renderQuickNav() {
    const container = document.getElementById("quickNavItems");
    const navItems = [
      { label: "Company Info", step: 1, icon: "M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16" },
      { label: "Contact Details", step: 2, icon: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" },
      { label: "Banking", step: 3, icon: "M2 7l10-5 10 5M4 10v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" },
      { label: "Preview", step: 4, icon: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" }
    ];
    container.innerHTML = navItems.map(n => `
      <div class="extraction-item" style="cursor:pointer" onclick="app.goToStep(${n.step})">
        <span class="extraction-label">${n.label}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
    `).join("");
  }

  renderFormSections() {
    const content = document.getElementById("contentArea");
    content.innerHTML = `
      <!-- Step 0: Upload -->
      <div class="form-section active" data-section="0">
        <div class="card">
          <div class="card-body" style="padding:40px">
            <div class="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              <h3>Upload Your Documents to Begin</h3>
              <p>Upload PDF documents or images (PNG/JPG) — Bank Statements, Udyam Certificates, PAN Cards, GST Certificates, CoI, Invoices, Cancelled Cheques — and AI will automatically extract data and fill all forms.</p>
              <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin-top:20px">
                <button class="btn btn-primary btn-lg" onclick="document.getElementById('fileInput').click()">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  Select Files
                </button>
                <button class="btn btn-success btn-lg" onclick="app.loadPreAnalyzedData()">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  Load Demo Data
                </button>
              </div>
              <p style="margin-top:12px;font-size:0.8rem;color:var(--text-secondary)">Supported: PDF, PNG, JPG &bull; Bank Statements, Udyam/MSME, PAN, GST, CoI, Invoices, Cancelled Cheques, Aadhaar</p>
              <p style="font-size:0.75rem;color:var(--text-secondary);margin-top:4px">Or click "Load Demo Data" to see a sample auto-fill</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 1: Company Details -->
      <div class="form-section" data-section="1">
        <div class="card">
          <div class="card-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16"/><line x1="1" y1="21" x2="23" y2="21"/><rect x="9" y="7" width="6" height="5"/></svg>
            Company Details
            <span class="field-count-badge" id="companyFieldCount">0</span>
          </div>
          <div class="card-body">
            <div class="section-title">Registered Company Information</div>
            <div class="section-desc">All fields auto-filled from your uploaded documents. Review and edit if needed.</div>
            <div class="form-grid">
              <div class="form-group full-width">
                <label class="form-label">
                  1. Registered Name <span class="required">*</span>
                  <span class="source-badge" id="badge_registeredName"></span>
                </label>
                <input class="form-input" type="text" id="registeredName" placeholder="Enter registered name">
              </div>
              <div class="form-group full-width">
                <label class="form-label">2. Legal Status <span class="required">*</span> <span class="source-badge" id="badge_legalStatus"></span></label>
                <div class="radio-group" id="legalStatusGroup">
                  ${["Private Limited Company","Public Limited Company","Limited Company","Partnership","LLP","Association of Persons","Society","Trust","Proprietor","HUF"].map(s =>
                    `<div class="radio-item" data-value="${s}">
                      <input type="radio" name="legalStatus" value="${s}">
                      <div class="radio-dot"></div>
                      ${s}
                    </div>`
                  ).join("")}
                </div>
              </div>
              <div class="form-group full-width">
                <label class="form-label">
                  2. Registered Office Address <span class="required">*</span>
                  <span class="source-badge" id="badge_registeredAddress"></span>
                </label>
                <textarea class="form-textarea" id="registeredAddress" rows="3" placeholder="Enter registered address"></textarea>
              </div>
              <div class="form-group full-width">
                <label class="form-label">
                  3. Principal Place of Business
                  <span class="source-badge" id="badge_principalPlace"></span>
                </label>
                <textarea class="form-textarea" id="principalPlace" rows="3" placeholder="If different from registered address"></textarea>
              </div>
              <div class="form-group">
                <label class="form-label">
                  4. Date of Incorporation <span class="required">*</span>
                  <span class="source-badge" id="badge_dateOfIncorporation"></span>
                </label>
                <input class="form-input" type="text" id="dateOfIncorporation" placeholder="DD/MM/YYYY">
              </div>
              <div class="form-group">
                <label class="form-label">
                  5. PAN No <span class="required">*</span>
                  <span class="source-badge" id="badge_panNo"></span>
                </label>
                <input class="form-input" type="text" id="panNo" placeholder="Enter PAN number" maxlength="10" style="text-transform:uppercase">
              </div>
              <div class="form-group">
                <label class="form-label">
                  GST Number
                  <span class="source-badge" id="badge_gstNo"></span>
                </label>
                <input class="form-input" type="text" id="gstNo" placeholder="Enter GSTIN" maxlength="15" style="text-transform:uppercase">
                <input type="hidden" id="legalEntityName">
              </div>
              <div class="form-group full-width">
                <label class="form-label">
                  6. Nature of Business <span class="required">*</span>
                  <span class="source-badge" id="badge_natureOfBusiness"></span>
                </label>
                <input class="form-input" type="text" id="natureOfBusiness" placeholder="Enter nature of business">
              </div>
              <div class="form-group full-width">
                <label class="form-label">7. Listed on Stock Exchange?</label>
                <div class="radio-group" id="stockExchangeGroup">
                  <div class="radio-item" data-value="No">
                    <input type="radio" name="stockExchange" value="No"><div class="radio-dot"></div> No
                  </div>
                  <div class="radio-item" data-value="Yes">
                    <input type="radio" name="stockExchange" value="Yes"><div class="radio-dot"></div> Yes
                  </div>
                </div>
                <input class="form-input" type="text" id="stockExchangeName" placeholder="Name of stock exchange(s)" style="margin-top:8px;display:none">
              </div>
              <div class="form-group">
                <label class="form-label">8. Company Website</label>
                <input class="form-input" type="url" id="companyWebsite" placeholder="https://www.example.com">
              </div>
              <div class="form-group">
                <label class="form-label">
                  MSME/Udyam Number
                  <span class="source-badge" id="badge_udyamNumber"></span>
                </label>
                <input class="form-input" type="text" id="udyamNumber" placeholder="UDYAM-XX-XX-XXXXXXX">
              </div>
              <div class="form-group">
                <label class="form-label">
                  Percentage of Shares Held
                  <span class="source-badge" id="badge_sharesPercent"></span>
                </label>
                <input class="form-input" type="text" id="sharesPercent" placeholder="e.g., 100%">
              </div>
              <div class="form-group full-width">
                <label class="form-label">9. Products to be Availed <span class="required">*</span></label>
                <div class="checkbox-group" id="productsGroup">
                  ${["Telegraphic Transfer","Forex Prepaid Cards","Foreign Currency Notes"].map(p =>
                    `<div class="checkbox-item" data-value="${p}">
                      <input type="checkbox" value="${p}">
                      <div class="checkbox-box"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div>
                      ${p}
                    </div>`
                  ).join("")}
                </div>
              </div>
              <div class="form-group full-width">
                <label class="form-label">10. Annual Estimated Foreign Exchange Required (INR) <span class="required">*</span></label>
                <input class="form-input" type="text" id="annualFx" placeholder="e.g., 50,00,000">
              </div>
            </div>
            <div class="sub-card" id="txnFieldsCard" style="margin-top:16px;display:none">
              <div class="sub-card-title">Transaction Details</div>
              <div class="section-desc" style="margin-bottom:12px">Fill in the transaction-specific details for your documents. These fields appear in the preview and downloaded forms.</div>
              <div class="form-grid">
                <div class="form-group"><label class="form-label">Destination Country</label><input class="form-input" type="text" id="txnDestination" placeholder="e.g., Thailand, Dubai"></div>
                <div class="form-group"><label class="form-label">Number of Travelers</label><input class="form-input" type="text" id="txnTravelers" placeholder="e.g., 5"></div>
                <div class="form-group"><label class="form-label">Travel Date From</label><input class="form-input" type="text" id="txnDateFrom" placeholder="DD/MM/YYYY"></div>
                <div class="form-group"><label class="form-label">Travel Date To</label><input class="form-input" type="text" id="txnDateTo" placeholder="DD/MM/YYYY"></div>
                <div class="form-group"><label class="form-label">Currency</label><input class="form-input" type="text" id="txnCurrency" placeholder="e.g., USD, EUR"></div>
                <div class="form-group"><label class="form-label">Remittance Amount</label><input class="form-input" type="text" id="txnAmount" placeholder="e.g., 10,000"></div>
                <div class="form-group"><label class="form-label">Invoice Number</label><input class="form-input" type="text" id="txnInvoiceNo" placeholder="e.g., INV-2026-001"></div>
                <div class="form-group"><label class="form-label">Corporate Name (if different)</label><input class="form-input" type="text" id="txnCorporateName" placeholder="For TA/CU docs - appointing company"></div>
              </div>
              <div class="sub-card" style="margin-top:12px;background:var(--bg-tertiary);padding:12px">
                <div class="sub-card-title" style="font-size:0.8rem">Beneficiary Details</div>
                <div class="form-grid">
                  <div class="form-group"><label class="form-label">Beneficiary Name</label><input class="form-input" type="text" id="txnBenefName" placeholder="Beneficiary name"></div>
                  <div class="form-group"><label class="form-label">Beneficiary Bank</label><input class="form-input" type="text" id="txnBenefBank" placeholder="Bank name"></div>
                  <div class="form-group"><label class="form-label">Account Number</label><input class="form-input" type="text" id="txnBenefAccount" placeholder="Account number"></div>
                  <div class="form-group"><label class="form-label">Bank Address</label><input class="form-input" type="text" id="txnBenefBankAddr" placeholder="Bank address"></div>
                  <div class="form-group"><label class="form-label">Swift Code</label><input class="form-input" type="text" id="txnSwiftCode" placeholder="SWIFT/BIC code"></div>
                  <div class="form-group"><label class="form-label">IBAN</label><input class="form-input" type="text" id="txnIban" placeholder="IBAN number"></div>
                </div>
              </div>
            </div>
            <div class="sub-card" style="margin-top:16px">
              <div class="sub-card-title">Beneficial Owners / Shareholders</div>
              <div class="section-desc" style="margin-bottom:12px">Add persons holding more than 10% shares. Each person needs their own PAN and share percentage.</div>
              <div id="boRows">
                <div class="bo-row" style="display:grid;grid-template-columns:1fr 140px 1fr 120px;gap:8px;margin-bottom:8px;align-items:end">
                  <div class="form-group" style="margin-bottom:0"><label class="form-label">Name</label><input class="form-input bo-name" type="text" id="boName1" placeholder="Person name"></div>
                  <div class="form-group" style="margin-bottom:0"><label class="form-label">DOB</label><input class="form-input bo-dob" type="text" id="boDob1" placeholder="DD/MM/YYYY"></div>
                  <div class="form-group" style="margin-bottom:0"><label class="form-label">PAN Number</label><input class="form-input bo-pan" type="text" id="boPan1" placeholder="PAN" maxlength="10" style="text-transform:uppercase"></div>
                  <div class="form-group" style="margin-bottom:0"><label class="form-label">Share %</label><input class="form-input bo-share" type="text" id="boShare1" placeholder="e.g., 100%"></div>
                </div>
              </div>
              <button class="btn btn-outline btn-sm" type="button" onclick="app.addBoRow()">+ Add Person</button>
            </div>
            <div class="form-actions">
              <button class="btn btn-secondary" onclick="app.prevStep()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                Back
              </button>
              <button class="btn btn-primary" onclick="app.nextStep()">
                Continue
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 2: Contact & KMP -->
      <div class="form-section" data-section="2">
        <div class="card">
          <div class="card-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Contact Details & Key Managerial Persons
          </div>
          <div class="card-body">
            <div class="sub-card">
              <div class="sub-card-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.11 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                11. Contact Person / Coordinator
                <span class="source-badge" id="badge_contactName"></span>
              </div>
              <div class="form-grid">
                <div class="form-group"><label class="form-label">Name</label><input class="form-input" type="text" id="contactName" placeholder="Contact person name"></div>
                <div class="form-group"><label class="form-label">Designation</label><input class="form-input" type="text" id="contactDesignation" placeholder="Designation"></div>
                <div class="form-group"><label class="form-label">Mobile No</label><input class="form-input" type="tel" id="contactMobile" placeholder="Mobile number"></div>
                <div class="form-group"><label class="form-label">Email ID</label><input class="form-input" type="email" id="contactEmail" placeholder="Email address"></div>
              </div>
            </div>
            <div class="sub-card">
              <div class="sub-card-title">12. Key Managerial Person (KMP) <span class="source-badge" id="badge_kmpName"></span></div>
              <div id="kmpRows">
                <div class="kmp-row form-grid single">
                  <div class="form-group"><label class="form-label">Name of KMP who controls business activities</label><input class="form-input kmp-input" type="text" id="kmpName" placeholder="KMP name"></div>
                </div>
              </div>
              <button class="btn btn-outline btn-sm" type="button" onclick="app.addKmpRow()">+ Add New Row</button>
            </div>
            <div class="sub-card">
              <div class="sub-card-title">13. Chief Executive Officer <span class="source-badge" id="badge_ceoName"></span></div>
              <label class="copy-contact-label"><input type="checkbox" onchange="app.copyFromContact('ceo', this.checked)"> Copy from Contact Person</label>
              <div class="form-grid">
                <div class="form-group"><label class="form-label">Name</label><input class="form-input" type="text" id="ceoName" placeholder="CEO name"></div>
                <div class="form-group"><label class="form-label">Mobile No</label><input class="form-input" type="tel" id="ceoMobile" placeholder="Mobile"></div>
                <div class="form-group full-width"><label class="form-label">Email ID</label><input class="form-input" type="email" id="ceoEmail" placeholder="Email"></div>
              </div>
            </div>
            <div class="sub-card">
              <div class="sub-card-title">14. Managing Director / Partner / Trustee <span class="source-badge" id="badge_mdName"></span></div>
              <label class="copy-contact-label"><input type="checkbox" onchange="app.copyFromContact('md', this.checked)"> Copy from Contact Person</label>
              <div class="form-grid">
                <div class="form-group"><label class="form-label">Name</label><input class="form-input" type="text" id="mdName" placeholder="MD/Partner/Trustee name"></div>
                <div class="form-group"><label class="form-label">Mobile No</label><input class="form-input" type="tel" id="mdMobile" placeholder="Mobile"></div>
                <div class="form-group full-width"><label class="form-label">Email ID</label><input class="form-input" type="email" id="mdEmail" placeholder="Email"></div>
              </div>
            </div>
            <div class="sub-card">
              <div class="sub-card-title">15. Directors / Partners</div>
              <div id="directorRows">
                <div class="kmp-row form-grid single">
                  <div class="form-group"><label class="form-label">Name (as per MCA)</label><input class="form-input director-input" type="text" id="directorName1" placeholder="Director/Partner name"></div>
                </div>
              </div>
              <button class="btn btn-outline btn-sm" type="button" onclick="app.addDirectorRow()">+ Add New Row</button>
            </div>
            <div class="sub-card">
              <div class="sub-card-title">16. Authorized Officials for FX Transactions</div>
              <div id="officialRows">
                <div class="kmp-row form-grid single">
                  <div class="form-group"><label class="form-label">Name of authorized official</label><input class="form-input official-input" type="text" id="officialName1" placeholder="Official name"></div>
                </div>
              </div>
              <button class="btn btn-outline btn-sm" type="button" onclick="app.addOfficialRow()">+ Add New Row</button>
            </div>
            <div class="form-actions">
              <button class="btn btn-secondary" onclick="app.prevStep()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                Back
              </button>
              <button class="btn btn-primary" onclick="app.nextStep()">
                Continue
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 3: Banking & Compliance -->
      <div class="form-section" data-section="3">
        <div class="card">
          <div class="card-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            Banking Details & Compliance
          </div>
          <div class="card-body">
            <div class="sub-card">
              <div class="sub-card-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                17. Banking Details
                <span class="source-badge" id="badge_bankName"></span>
              </div>
              <div class="form-grid single">
                <div class="form-group"><label class="form-label">Bank Name</label><input class="form-input" type="text" id="bankName" placeholder="Bank name"></div>
              </div>
            </div>
            <div class="sub-card">
              <div class="sub-card-title">18. Regulatory Compliance</div>
              <div class="form-grid single">
                <div class="form-group">
                  <label class="form-label">Any case/complaint registered by regulatory/law enforcement authority?</label>
                  <div class="radio-group" id="caseRegisteredGroup">
                    <div class="radio-item" data-value="No"><input type="radio" name="caseRegistered" value="No"><div class="radio-dot"></div> No</div>
                    <div class="radio-item" data-value="Yes"><input type="radio" name="caseRegistered" value="Yes"><div class="radio-dot"></div> Yes</div>
                  </div>
                </div>
                <div class="form-group" id="caseDetailsGroup" style="display:none">
                  <label class="form-label">If yes, provide details</label>
                  <textarea class="form-textarea" id="caseDetails" rows="3" placeholder="Provide details of the case/complaint"></textarea>
                </div>
              </div>
            </div>
            <div class="sub-card">
              <div class="sub-card-title">19. Authorized Signatory</div>
              <label class="copy-contact-label"><input type="checkbox" onchange="app.copyFromContact('signatory', this.checked)"> Copy from Contact Person</label>
              <div class="form-grid">
                <div class="form-group"><label class="form-label">Name</label><input class="form-input" type="text" id="signatoryName" placeholder="Signatory name"></div>
                <div class="form-group"><label class="form-label">Designation</label><input class="form-input" type="text" id="signatoryDesignation" placeholder="Designation"></div>
              </div>
            </div>
            <div class="form-actions">
              <button class="btn btn-secondary" onclick="app.prevStep()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                Back
              </button>
              <button class="btn btn-primary" onclick="app.nextStep()">
                Preview Form
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 4: Preview -->
      <div class="form-section preview-section" data-section="4">
        <div class="card no-print" style="margin-bottom:16px">
          <div class="card-body" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
            <div>
              <div class="section-title">Preview & Download Forms</div>
              <div class="section-desc" style="margin-bottom:0">Select a document to preview, then download</div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button class="btn btn-secondary btn-sm" onclick="app.prevStep()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit
              </button>
            </div>
          </div>
        </div>
        <div class="card no-print" style="margin-bottom:16px">
          <div class="card-body" style="padding:0">
            <div style="padding:10px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px">
              <label style="font-size:0.8rem;font-weight:600;color:var(--text-secondary);white-space:nowrap">Form Category:</label>
              <select id="formCategorySelect" class="form-input" style="max-width:260px;padding:6px 10px;font-size:0.8rem" onchange="app.switchFormCategory(this.value)">
                <option value="cifl">CIFL - Onboarding</option>
                <option value="indel">Indel - Onboarding</option>
                <option value="ciflFit">CIFL - FIT Transactions</option>
                <option value="ciflMice">CIFL - MICE Transactions</option>
                <option value="indelFit">Indel - FIT Transactions</option>
                <option value="indelMice">Indel - MICE Transactions</option>
              </select>
            </div>
            <div id="docTabs" class="doc-tabs">
              <button class="doc-tab active" data-doc="onboarding" data-category="cifl" onclick="app.switchDocPreview('onboarding')">Client Onboarding</button>
              <button class="doc-tab" data-doc="authSignatory" data-category="cifl" onclick="app.switchDocPreview('authSignatory')">Auth Signatory Letter</button>
              <button class="doc-tab" data-doc="beneficialOwnership" data-category="cifl" onclick="app.switchDocPreview('beneficialOwnership')">Beneficial Ownership</button>
              <button class="doc-tab" data-doc="corporateProfile" data-category="cifl" onclick="app.switchDocPreview('corporateProfile')">Corporate Profile / KYC</button>
              <button class="doc-tab" data-doc="mou" data-category="cifl" onclick="app.switchDocPreview('mou')">Tour Operator MOU</button>
              <button class="doc-tab" data-doc="indelOnboarding" data-category="indel" style="display:none" onclick="app.switchDocPreview('indelOnboarding')">Corporate Onboarding</button>
              <button class="doc-tab" data-doc="indelAuthSignatory" data-category="indel" style="display:none" onclick="app.switchDocPreview('indelAuthSignatory')">Auth Signatory</button>
              <button class="doc-tab" data-doc="indelBeneficialOwnership" data-category="indel" style="display:none" onclick="app.switchDocPreview('indelBeneficialOwnership')">Beneficial Ownership</button>
              <button class="doc-tab" data-doc="indelFieldVerification" data-category="indel" style="display:none" onclick="app.switchDocPreview('indelFieldVerification')">Field Verification</button>
              <button class="doc-tab" data-doc="indelMou" data-category="indel" style="display:none" onclick="app.switchDocPreview('indelMou')">MOU</button>
              <button class="doc-tab" data-doc="ciflFitA2" data-category="ciflFit" style="display:none" onclick="app.switchDocPreview('ciflFitA2')">Form A2</button>
              <button class="doc-tab" data-doc="ciflFitTcs" data-category="ciflFit" style="display:none" onclick="app.switchDocPreview('ciflFitTcs')">TCS Declaration</button>
              <button class="doc-tab" data-doc="ciflFitFlight" data-category="ciflFit" style="display:none" onclick="app.switchDocPreview('ciflFitFlight')">Flight Declaration</button>
              <button class="doc-tab" data-doc="ciflFitVisa" data-category="ciflFit" style="display:none" onclick="app.switchDocPreview('ciflFitVisa')">Visa Declaration</button>
              <button class="doc-tab" data-doc="ciflFitCountry" data-category="ciflFit" style="display:none" onclick="app.switchDocPreview('ciflFitCountry')">Country Declaration</button>
              <button class="doc-tab" data-doc="ciflMiceA2" data-category="ciflMice" style="display:none" onclick="app.switchDocPreview('ciflMiceA2')">Form A2 (MICE)</button>
              <button class="doc-tab" data-doc="ciflMiceTcs" data-category="ciflMice" style="display:none" onclick="app.switchDocPreview('ciflMiceTcs')">TCS Declaration</button>
              <button class="doc-tab" data-doc="ciflMiceCu" data-category="ciflMice" style="display:none" onclick="app.switchDocPreview('ciflMiceCu')">Corporate Undertaking</button>
              <button class="doc-tab" data-doc="ciflMiceTa" data-category="ciflMice" style="display:none" onclick="app.switchDocPreview('ciflMiceTa')">TA Undertaking</button>
              <button class="doc-tab" data-doc="indelFitA2" data-category="indelFit" style="display:none" onclick="app.switchDocPreview('indelFitA2')">Form A2 (Tour)</button>
              <button class="doc-tab" data-doc="indelFitPassenger" data-category="indelFit" style="display:none" onclick="app.switchDocPreview('indelFitPassenger')">Passenger Details</button>
              <button class="doc-tab" data-doc="indelFitTcs" data-category="indelFit" style="display:none" onclick="app.switchDocPreview('indelFitTcs')">TCS Declaration</button>
              <button class="doc-tab" data-doc="indelMiceA2" data-category="indelMice" style="display:none" onclick="app.switchDocPreview('indelMiceA2')">Form A2 (MICE)</button>
              <button class="doc-tab" data-doc="indelMiceTcs" data-category="indelMice" style="display:none" onclick="app.switchDocPreview('indelMiceTcs')">TCS Declaration</button>
            </div>
            <div style="padding:12px 16px;display:flex;gap:8px;border-top:1px solid var(--border)" id="docDownloadBar">
              <button class="btn btn-primary btn-sm" onclick="app.downloadCurrentPdf()" id="btnDownloadPdf" style="justify-content:center;flex:1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download PDF
              </button>
              <button class="btn btn-success btn-sm" onclick="app.downloadCurrentDocx()" id="btnDownloadDocx" style="justify-content:center;flex:1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download DOCX
              </button>
            </div>
          </div>
        </div>
        <div id="previewContent"></div>
      </div>
      <div id="settingsModal" style="display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.6);align-items:center;justify-content:center;backdrop-filter:blur(4px)">
        <div style="background:var(--card-bg, #fff);border-radius:12px;padding:28px;max-width:520px;width:92%;box-shadow:0 20px 60px rgba(0,0,0,0.3);position:relative;max-height:90vh;overflow-y:auto">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <h3 style="margin:0;font-size:1.1rem">&#129302; AI Extraction Settings</h3>
            <button onclick="app.closeSettings()" style="background:none;border:none;cursor:pointer;font-size:1.3rem;color:var(--text-secondary)">&times;</button>
          </div>
          <p style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:14px">Enable AI-powered extraction for <strong>near 100% accuracy</strong>. Uses Google Gemini 2.0 Flash to intelligently read your documents and analyze missing fields.</p>
          <div style="background:linear-gradient(135deg,#dbeafe,#ede9fe);border-radius:10px;padding:14px;margin-bottom:14px">
            <div style="font-size:0.82rem;font-weight:700;color:var(--gray-800);margin-bottom:8px">&#128272; How to get your free API key:</div>
            <div style="font-size:0.78rem;color:var(--gray-700);line-height:1.6">
              <div style="display:flex;gap:8px;align-items:start;margin-bottom:6px"><span style="background:var(--primary);color:white;border-radius:50%;min-width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:700">1</span><span>Click the button below to open <strong>Google AI Studio</strong></span></div>
              <div style="display:flex;gap:8px;align-items:start;margin-bottom:6px"><span style="background:var(--primary);color:white;border-radius:50%;min-width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:700">2</span><span>Sign in with your <strong>Google account</strong></span></div>
              <div style="display:flex;gap:8px;align-items:start;margin-bottom:6px"><span style="background:var(--primary);color:white;border-radius:50%;min-width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:700">3</span><span>Click <strong>"Create API Key"</strong> and select any project</span></div>
              <div style="display:flex;gap:8px;align-items:start"><span style="background:var(--primary);color:white;border-radius:50%;min-width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:700">4</span><span><strong>Copy the key</strong> and paste it below</span></div>
            </div>
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" style="display:block;margin-top:10px;background:var(--primary);color:white;text-align:center;padding:10px;border-radius:8px;text-decoration:none;font-weight:600;font-size:0.85rem">&#128279; Open Google AI Studio &rarr; Get Free API Key</a>
            <div style="font-size:0.68rem;color:var(--gray-500);text-align:center;margin-top:4px">Free tier: 15 requests/min, 1500 requests/day — no credit card needed</div>
          </div>
          <div style="margin-bottom:12px">
            <label style="font-size:0.82rem;font-weight:600;display:block;margin-bottom:4px">Paste your API Key here:</label>
            <input id="geminiKeyInput" type="password" class="form-input" placeholder="AIzaSy..." style="width:100%;font-family:monospace">
          </div>
          <div id="geminiStatus" style="display:none;margin-bottom:12px;padding:8px 12px;border-radius:6px;font-size:0.8rem"></div>
          <div style="display:flex;gap:8px;justify-content:flex-end">
            <button class="btn btn-outline" onclick="app.testGeminiKey()">&#9889; Test Key</button>
            <button class="btn btn-primary" onclick="app.saveSettings()">&#128190; Save</button>
          </div>
          <div style="margin-top:12px;padding:10px;background:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0">
            <div style="font-size:0.75rem;font-weight:600;color:#166534;margin-bottom:4px">&#10024; What AI enables:</div>
            <div style="font-size:0.72rem;color:#15803d;line-height:1.5">
              &#10003; Intelligent document reading with near 100% accuracy<br>
              &#10003; Extracts fields that regex patterns miss<br>
              &#10003; Analyzes missing fields and suggests which documents to upload<br>
              &#10003; Works with any PDF — invoices, certificates, bank statements
            </div>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    const fileInput = document.getElementById("fileInput");
    const uploadZone = document.getElementById("uploadZone");

    fileInput.addEventListener("change", (e) => this.handleFiles(e.target.files));

    uploadZone.addEventListener("click", () => fileInput.click());
    uploadZone.addEventListener("dragover", (e) => { e.preventDefault(); uploadZone.classList.add("dragover"); });
    uploadZone.addEventListener("dragleave", () => uploadZone.classList.remove("dragover"));
    uploadZone.addEventListener("drop", (e) => {
      e.preventDefault();
      uploadZone.classList.remove("dragover");
      this.handleFiles(e.dataTransfer.files);
    });

    document.querySelectorAll(".radio-group .radio-item").forEach(item => {
      item.addEventListener("click", () => {
        const group = item.closest(".radio-group");
        group.querySelectorAll(".radio-item").forEach(r => r.classList.remove("selected"));
        item.classList.add("selected");
        item.querySelector("input").checked = true;

        if (group.id === "stockExchangeGroup") {
          document.getElementById("stockExchangeName").style.display = item.dataset.value === "Yes" ? "block" : "none";
        }
        if (group.id === "caseRegisteredGroup") {
          document.getElementById("caseDetailsGroup").style.display = item.dataset.value === "Yes" ? "block" : "none";
        }
      });
    });

    document.querySelectorAll(".checkbox-group .checkbox-item").forEach(item => {
      item.addEventListener("click", () => {
        item.classList.toggle("checked");
        item.querySelector("input").checked = item.classList.contains("checked");
      });
    });
  }

  loadPreAnalyzedData() {
    if (typeof EXTRACTED_DATA === "undefined") {
      this.showToast("Pre-analyzed data not available", "error");
      return;
    }
    this.showLoading("Loading data...", "Applying pre-analyzed document data");
    setTimeout(() => {
      const fm = EXTRACTED_DATA.formMapping;
      const bs = EXTRACTED_DATA.bankStatement;
      const uc = EXTRACTED_DATA.udyamCertificate;

      const setVal = (id, value, source) => {
        const el = document.getElementById(id);
        if (el && value) { el.value = value; el.classList.add("auto-filled"); }
        if (source) this.setBadge(id, source);
      };

      setVal("registeredName", fm.registeredName, "UDYAM");
      setVal("legalEntityName", fm.legalEntityName || fm.registeredName, "UDYAM");
      setVal("registeredAddress", fm.registeredAddress, "UDYAM");
      setVal("principalPlace", fm.principalPlaceOfBusiness, "UDYAM");
      setVal("dateOfIncorporation", fm.dateOfIncorporation, "UDYAM");
      setVal("panNo", fm.panNo, fm.panNo ? "PAN" : "");
      setVal("natureOfBusiness", fm.natureOfBusiness, "UDYAM");
      setVal("companyWebsite", fm.companyWebsite);
      setVal("udyamNumber", uc.udyamNumber, "UDYAM");
      setVal("annualFx", fm.annualEstimatedFx);

      setVal("contactName", fm.contactPerson.name, "UDYAM");
      setVal("contactDesignation", fm.contactPerson.designation, "UDYAM");
      setVal("contactMobile", fm.contactPerson.mobile, "UDYAM");
      setVal("contactEmail", fm.contactPerson.email, "UDYAM");
      setVal("kmpName", fm.kmpName, "BANK");
      setVal("ceoName", fm.ceo.name, "UDYAM");
      setVal("ceoMobile", fm.ceo.mobile, "UDYAM");
      setVal("ceoEmail", fm.ceo.email, "UDYAM");
      setVal("mdName", fm.mdPartnerTrustee.name, "UDYAM");
      setVal("mdMobile", fm.mdPartnerTrustee.mobile, "UDYAM");
      setVal("mdEmail", fm.mdPartnerTrustee.email, "UDYAM");
      // Fill director rows from UDYAM
      if (fm.directors) {
        const dirNames = fm.directors.split("\n").map(n => n.trim()).filter(Boolean);
        const dirInput1 = document.getElementById("directorName1");
        if (dirInput1 && dirNames[0]) { dirInput1.value = dirNames[0]; dirInput1.classList.add("auto-filled"); }
        for (let i = 1; i < dirNames.length; i++) {
          this.addDirectorRow();
          const rows = document.querySelectorAll("#directorRows .director-input");
          if (rows[i]) { rows[i].value = dirNames[i]; rows[i].classList.add("auto-filled"); }
        }
      }
      // Fill official rows from UDYAM
      if (fm.authorizedOfficials) {
        const offNames = fm.authorizedOfficials.split(",").map(n => n.trim()).filter(Boolean);
        const offInput1 = document.getElementById("officialName1");
        if (offInput1 && offNames[0]) { offInput1.value = offNames[0]; offInput1.classList.add("auto-filled"); }
        for (let i = 1; i < offNames.length; i++) {
          this.addOfficialRow();
          const rows = document.querySelectorAll("#officialRows .official-input");
          if (rows[i]) { rows[i].value = offNames[i]; rows[i].classList.add("auto-filled"); }
        }
      }

      setVal("bankName", bs.bankName, "BANK");
      setVal("bankBranch", bs.branchAddress, "BANK");
      setVal("accountNumber", bs.accountNumber, "BANK");
      setVal("accountType", bs.accountType, "BANK");
      setVal("ifscCode", bs.ifsc, "BANK");

      setVal("signatoryName", fm.authorizedSignatory.name, "UDYAM");
      setVal("signatoryDesignation", fm.authorizedSignatory.designation, "UDYAM");
      setVal("caseDetails", fm.caseDetails);

      this.selectRadio("legalStatusGroup", fm.legalStatus);
      this.setBadge("legalStatus", "UDYAM");
      this.selectRadio("stockExchangeGroup", fm.listedOnStockExchange);
      this.selectRadio("caseRegisteredGroup", fm.caseRegistered);
      this.selectCheckbox("productsGroup", ["Telegraphic Transfer", "Forex Prepaid Cards", "Foreign Currency Notes"]);

      const demoDirectors = typeof this.getDirectorNames === "function" ? this.getDirectorNames() : [];
      const demoPersonCount = demoDirectors.length > 0 ? demoDirectors.length : 1;
      const demoSharesPct = demoPersonCount === 1 ? "100%" : Math.round(100 / demoPersonCount) + "%";
      if (!document.getElementById("sharesPercent")?.value) setVal("sharesPercent", demoSharesPct, "AUTO");

      this.uploadedFiles = [
        { id: "pre-1", name: "Bank Statement (Union Bank of India)", status: "success", docType: "Bank Statement", fieldsExtracted: 8 },
        { id: "pre-2", name: "Udyam Registration Certificate", status: "success", docType: "Udyam Certificate", fieldsExtracted: 14 }
      ];
      this.renderUploadedFiles();
      this.docFieldCounts = {
        "Bank Statement (Bank Statement)": { filename: "Bank Statement (Union Bank of India)", docType: "Bank Statement", fields: [
          { id: "bankName", label: "Bank Name", value: "Union Bank of India" },
          { id: "bankBranch", label: "Branch", value: bs.branchAddress || "" },
          { id: "accountNumber", label: "Account Number", value: bs.accountNumber || "" },
          { id: "accountType", label: "Account Type", value: bs.accountType || "" },
          { id: "ifscCode", label: "IFSC Code", value: bs.ifsc || "" },
          { id: "kmpName", label: "KMP Name", value: fm.kmpName || "" }
        ].filter(f => f.value), accuracy: 0 },
        "Udyam Certificate (Udyam Certificate)": { filename: "Udyam Registration Certificate", docType: "Udyam Certificate", fields: [
          { id: "registeredName", label: "Company Name", value: fm.registeredName || "" },
          { id: "registeredAddress", label: "Address", value: (fm.registeredAddress || "").substring(0,40) },
          { id: "udyamNumber", label: "Udyam Number", value: uc.udyamNumber || "" },
          { id: "panNo", label: "PAN", value: fm.panNo || "" },
          { id: "dateOfIncorporation", label: "Date of Incorporation", value: fm.dateOfIncorporation || "" },
          { id: "natureOfBusiness", label: "Nature of Business", value: (fm.natureOfBusiness || "").substring(0,40) },
          { id: "contactName", label: "Contact Name", value: fm.contactPerson?.name || "" },
          { id: "contactMobile", label: "Mobile", value: fm.contactPerson?.mobile || "" },
          { id: "contactEmail", label: "Email", value: fm.contactPerson?.email || "" },
          { id: "signatoryName", label: "Signatory", value: fm.authorizedSignatory?.name || "" }
        ].filter(f => f.value), accuracy: 0 }
      };
      this.updateAccuracy();
      this.renderDocIntelligence();
      this.hideLoading();
      this.showToast("Demo data loaded - 30+ fields auto-filled!", "success");
      setTimeout(() => this.goToStep(1), 400);
    }, 800);
  }

  async handleFiles(files) {
    const supported = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
    for (const file of files) {
      if (!supported.includes(file.type)) {
        this.showToast("Supported: PDF, PNG, JPG, WEBP", "error");
        continue;
      }
      if (this.uploadedFiles.find(f => f.name === file.name)) {
        this.showToast(`${file.name} already uploaded`, "warning");
        continue;
      }
      if (file.type.startsWith("image/")) {
        await this.processImageFile(file);
      } else {
        await this.processFile(file);
      }
    }
  }

  async processImageFile(file) {
    const fileId = Date.now() + Math.random().toString(36).substring(2);
    this.uploadedFiles.push({ id: fileId, name: file.name, status: "processing", file });
    this.renderUploadedFiles();

    try {
      let text = "";
      if (typeof Tesseract !== "undefined") {
        this.showLoading("Running OCR on image...", `Reading ${file.name}`);
        const worker = await Tesseract.createWorker("eng");
        const { data } = await worker.recognize(file);
        text = data.text || "";
        await worker.terminate();
      }

      if (this.geminiKey) {
        this.showLoading("AI analyzing image...", `Gemini Vision reading ${file.name}`);
        const visionResult = await this.extractImageWithGemini(file);
        if (visionResult) {
          if (visionResult._rawText && visionResult._rawText.length > text.length) text = visionResult._rawText;
          delete visionResult._rawText;
          const docType = this.detectDocumentType(text);
          let extracted = this.extractFields(text, docType);
          extracted = this.mergeAiExtraction(extracted, visionResult);
          this.allExtractedTexts.push({ filename: file.name, docType, text: text.substring(0, 12000) });

          const idx = this.uploadedFiles.findIndex(f => f.id === fileId);
          if (idx >= 0) {
            this.uploadedFiles[idx].status = "success";
            this.uploadedFiles[idx].docType = docType + " + AI Vision";
            this.uploadedFiles[idx].fieldsExtracted = Object.keys(extracted).length;
          }
          Object.assign(this.extractedData, extracted);
          const beforeSnap = this.snapshotFormValues();
          this.autoFillForm();
          this.trackFieldSources(beforeSnap, file.name, docType);
          this.renderUploadedFiles();
          this.updateAccuracy();
          this.renderDocIntelligence();
          this.hideLoading();
          this.showToast(`Image processed with AI Vision - ${Object.keys(extracted).length} fields extracted`, "success");
          this.validateExtractedFields();
          this.analyzeGapsWithGemini();
          if (this.uploadedFiles.filter(f => f.status === "success").length > 0) setTimeout(() => this.goToStep(1), 600);
          return;
        }
      }

      if (!text || text.trim().length < 20) {
        throw new Error("Could not extract text from image. Enable AI (Gemini) for image analysis.");
      }

      const docType = this.detectDocumentType(text);
      let extracted = this.extractFields(text, docType);
      const idx = this.uploadedFiles.findIndex(f => f.id === fileId);
      if (idx >= 0) {
        this.uploadedFiles[idx].status = "success";
        this.uploadedFiles[idx].docType = docType + " (OCR)";
        this.uploadedFiles[idx].fieldsExtracted = Object.keys(extracted).length;
      }
      Object.assign(this.extractedData, extracted);
      this.autoFillForm();
      this.renderUploadedFiles();
      this.updateAccuracy();
      this.hideLoading();
      this.showToast(`Image OCR: ${Object.keys(extracted).length} fields extracted`, "success");
      if (this.uploadedFiles.filter(f => f.status === "success").length > 0) setTimeout(() => this.goToStep(1), 600);
    } catch (err) {
      const idx = this.uploadedFiles.findIndex(f => f.id === fileId);
      if (idx >= 0) this.uploadedFiles[idx].status = "error";
      this.renderUploadedFiles();
      this.hideLoading();
      this.showToast(`Error: ${err.message}`, "error");
    }
  }

  async extractImageWithGemini(file) {
    if (!this.geminiKey) return null;
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = () => reject(new Error("Failed to read image"));
      reader.readAsDataURL(file);
    });
    const mimeType = file.type || "image/jpeg";
    const cat = this.activeFormCategory || "cifl";
    const catLabel = { cifl: "CIFL Onboarding", indel: "Indel Onboarding", ciflFit: "CIFL FIT Transactions", ciflMice: "CIFL MICE Transactions", indelFit: "Indel FIT Transactions", indelMice: "Indel MICE Transactions" }[cat] || "Corporate Onboarding";
    const isTxn = cat.includes("Fit") || cat.includes("Mice") || cat.includes("fit") || cat.includes("mice");

    const prompt = `You are an expert at reading Indian business/corporate documents from images. This image is uploaded for a "${catLabel}" form.

Extract ALL data you can see in this image into a JSON object. Read every word, number, stamp, header, watermark, table cell.

Return this structure (use "" for not found):
{
  "companyName": "", "legalName": "", "tradeName": "",
  "registeredAddress": "", "city": "", "state": "", "pinCode": "",
  "panNumber": "10-char PAN", "gstNumber": "15-char GSTIN", "cinNumber": "",
  "udyamNumber": "", "msmeCategory": "",
  "dateOfIncorporation": "DD/MM/YYYY",
  "constitution": "Private Limited/LLP/Partnership/Proprietorship/etc",
  "natureOfBusiness": "", "website": "",
  "contactPerson": "", "contactDesignation": "", "contactMobile": "", "contactEmail": "",
  "directors": [{"name": "", "designation": "", "pan": "", "dob": "DD/MM/YYYY"}],
  "bankName": "", "bankBranch": "", "bankAccountNumber": "", "bankIfsc": "", "bankAccountType": "",
  ${isTxn ? '"invoiceNumber": "", "invoiceAmount": "", "invoiceCurrency": "", "destination": "", "travelDateFrom": "", "travelDateTo": "", "numberOfTravelers": "", "beneficiaryName": "", "beneficiaryBank": "", "swiftCode": "", "iban": "",' : ""}
  "_rawText": "paste ALL visible text from the image here for backup extraction"
}

RULES: Return ONLY valid JSON. PAN = 5 letters + 4 digits + 1 letter. GSTIN = 15 chars. Dates = DD/MM/YYYY. Amounts = numbers only.`;

    try {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [
            { text: prompt },
            { inlineData: { mimeType, data: base64 } }
          ]}],
          generationConfig: { temperature: 0.05, maxOutputTokens: 4096 }
        })
      });
      if (!resp.ok) return null;
      const data = await resp.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const jsonStr = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      return JSON.parse(jsonStr);
    } catch (e) {
      console.warn("Gemini Vision extraction failed:", e);
      return null;
    }
  }

  async processFile(file) {
    const fileId = Date.now() + Math.random().toString(36).substring(2);
    this.uploadedFiles.push({ id: fileId, name: file.name, status: "processing", file });
    this.renderUploadedFiles();
    this.showLoading("Extracting data...", `Processing ${file.name}`);

    try {
      const prevAccuracy = this.getAccuracyPercent();
      const text = await this.extractPdfText(file);
      const docType = this.detectDocumentType(text);
      let extracted = this.extractFields(text, docType);

      if (this.geminiKey) {
        this.showLoading("AI analyzing document...", `Gemini is reading ${file.name}`);
        this.allExtractedTexts.push({ filename: file.name, docType, text: text.substring(0, 12000) });
        const aiResult = await this.extractWithGemini(text, file.name, docType);
        if (aiResult) {
          extracted = this.mergeAiExtraction(extracted, aiResult);
        }
      }

      const idx = this.uploadedFiles.findIndex(f => f.id === fileId);
      if (idx >= 0) {
        this.uploadedFiles[idx].status = "success";
        this.uploadedFiles[idx].docType = docType + (this.geminiKey ? " + AI" : "");
        this.uploadedFiles[idx].fieldsExtracted = Object.keys(extracted).length;
      }

      Object.assign(this.extractedData, extracted);
      const beforeSnap = this.snapshotFormValues();
      this.autoFillForm();
      this.trackFieldSources(beforeSnap, file.name, docType);
      this.renderUploadedFiles();
      this.updateAccuracy();
      this.renderDocIntelligence();
      this.hideLoading();
      const newAccuracy = this.getAccuracyPercent();
      const boost = newAccuracy - prevAccuracy;
      const boostText = boost > 0 ? ` (+${boost}% accuracy)` : "";
      this.showToast(`${docType} processed - ${Object.keys(extracted).length} fields extracted${this.geminiKey ? " (AI enhanced)" : ""}${boostText}`, "success");
      this.validateExtractedFields();

      if (this.geminiKey) {
        const successCount = this.uploadedFiles.filter(f => f.status === "success").length;
        if (successCount === 1) this.suggestFormCategory(docType, extracted);
        if (successCount >= 2 && this.allExtractedTexts.length >= 2) {
          await this.smartReExtract();
          this.renderDocIntelligence();
        }
        this.analyzeGapsWithGemini();
      }

      if (this.uploadedFiles.filter(f => f.status === "success").length > 0) {
        setTimeout(() => this.goToStep(1), 600);
      }
    } catch (err) {
      const idx = this.uploadedFiles.findIndex(f => f.id === fileId);
      if (idx >= 0) this.uploadedFiles[idx].status = "error";
      this.renderUploadedFiles();
      this.hideLoading();
      this.showToast(`Error processing ${file.name}: ${err.message}`, "error");
    }
  }

  async extractPdfText(file) {
    const arrayBuffer = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsArrayBuffer(file);
    });

    let text = "";

    if (typeof pdfjsLib !== "undefined") {
      try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
        const pages = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map(item => item.str).join(" ");
          pages.push(pageText);
        }
        text = pages.join("\n").replace(/\s+/g, " ").trim();
      } catch (e) {
        console.warn("PDF.js extraction failed, falling back:", e.message);
      }
    }

    if (text.length < 50) {
      try {
        const extractor = new PdfTextExtractor();
        const fallback = await extractor.extract(arrayBuffer);
        if (fallback.length > text.length) text = fallback;
      } catch (e) {}
    }

    if (text.length < 30 && typeof Tesseract !== "undefined") {
      try {
        this.showLoading("Running OCR on scanned document...");
        const ocrText = await this.ocrPdf(arrayBuffer);
        if (ocrText.length > text.length) text = ocrText;
      } catch (e) {
        console.warn("Tesseract OCR failed:", e.message);
      }
    }

    return text;
  }

  async ocrPdf(arrayBuffer) {
    if (typeof pdfjsLib === "undefined" || typeof Tesseract === "undefined") return "";
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    const maxPages = Math.min(pdf.numPages, 5);
    const texts = [];
    const worker = await Tesseract.createWorker("eng");
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      await page.render({ canvasContext: ctx, viewport }).promise;
      const { data } = await worker.recognize(canvas);
      if (data.text.trim()) texts.push(data.text.trim());
    }
    await worker.terminate();
    return texts.join("\n").replace(/\s+/g, " ").trim();
  }

  detectDocumentType(text) {
    const lower = text.toLowerCase();
    if (lower.includes("udyam") || lower.includes("msme") || lower.includes("ministry of micro") || lower.includes("udyog aadhaar")) {
      return "Udyam Registration Certificate";
    }
    if (/\b(statement\s*of\s*account|account\s*statement|bank\s*statement|transaction\s*detail)\b/.test(lower) ||
        (lower.includes("ifsc") && lower.includes("account")) ||
        (/\b(opening\s*balance|closing\s*balance|debit|credit)\b/.test(lower) && lower.includes("account"))) {
      return "Bank Statement";
    }
    if (/\b(invoice|proforma|quotation|payment\s*receipt|tax\s*invoice|bill\s*of\s*supply)\b/.test(lower) ||
        (lower.includes("total") && /\b(amount|qty|quantity|rate|subtotal|grand\s*total)\b/.test(lower))) {
      return "Invoice";
    }
    if (/\bpermanent\s*account\s*number\b/.test(lower) || (/\bpan\b/.test(lower) && lower.includes("income tax"))) {
      return "PAN Card";
    }
    if (lower.includes("goods and services tax") || /\bgst(in|no|number)?\b/.test(lower)) {
      return "GST Certificate";
    }
    if (lower.includes("certificate of incorporation") || lower.includes("registrar of companies")) {
      return "Certificate of Incorporation";
    }
    if (lower.includes("aadhaar") || lower.includes("unique identification")) {
      return "Aadhaar Card";
    }
    if (lower.includes("trade license") || lower.includes("shop establishment")) {
      return "Trade License";
    }
    return "Document";
  }

  extractFields(text, docType) {
    const fields = {};
    const t = text.replace(/\s+/g, " ");

    const panGlobal = t.match(/\b([A-Z]{5}\d{4}[A-Z])\b/);
    if (panGlobal) fields.panNumber = panGlobal[1];

    const gstGlobal = t.match(/\b(\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z\d]{2})\b/);
    if (gstGlobal) fields.gstNumber = gstGlobal[1];

    const emailGlobal = t.match(/([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/i);
    if (emailGlobal) fields.extractedEmail = emailGlobal[1].toLowerCase();

    const mobileGlobal = t.match(/(?:Mobile|Phone|Contact|Tel|Mob)[\s:\-]*(\+?91[\s\-]?)?(\d{10})\b/i);
    if (mobileGlobal) fields.extractedMobile = mobileGlobal[2];
    else {
      const mob2 = t.match(/\b([6-9]\d{9})\b/);
      if (mob2) fields.extractedMobile = mob2[1];
    }

    const datePatterns = t.match(/\b(\d{2}[\/\-]\d{2}[\/\-]\d{4})\b/g);

    const globalDobMatch = t.match(/(?:Date\s*of\s*Birth|DOB|D\.O\.B|Birth\s*Date)\s*[:\-]?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
    if (globalDobMatch) fields.globalDob = globalDobMatch[1].replace(/-/g, "/");

    if (docType === "Bank Statement") {
      const namePatterns = [
        /(?:Account\s*(?:Holder|Name))\s*[:\-]?\s*(?:(?:MR|MS|MRS|SHRI|SMT|M\/S)\s+)?([A-Z][A-Z\s.&]+?)(?=\s*(?:Address|Account|Mobile|Email|Customer|Joint|Nominee|Branch|\d|$))/i,
        /(?:(?:Customer|Client)\s*Name)\s*[:\-]?\s*(?:(?:MR|MS|MRS|SHRI|SMT|M\/S)\s+)?([A-Z][A-Z\s.&]+?)(?=\s*(?:Address|Account|Mobile|Email|Customer|\d|$))/i,
        /(?:Name)\s*[:\-]?\s*(?:(?:MR|MS|MRS|SHRI|SMT|M\/S)\s+)?([A-Z][A-Z\s.&]+?)(?=\s*(?:Address|Account|Mobile|\d|$))/i,
      ];
      for (const p of namePatterns) {
        const m = t.match(p);
        if (m && m[1].trim().length > 2) {
          fields.bankAccountName = m[1].trim();
          fields.bankAccountHolderName = m[1].trim().replace(/^(MR|MS|MRS|SHRI|SMT|M\/S)\s+/i, "").trim();
          break;
        }
      }

      const accNumPatterns = [
        /(?:Account\s*(?:Number|No|#))\s*[:\-]?\s*(\d{8,20})/i,
        /(?:A\/c\s*(?:No|#))\s*[:\-]?\s*(\d{8,20})/i,
        /(?:Acct\s*(?:No|#))\s*[:\-]?\s*(\d{8,20})/i,
      ];
      for (const p of accNumPatterns) {
        const m = t.match(p);
        if (m) { fields.bankAccountNumber = m[1].trim(); break; }
      }

      const ifscMatch = t.match(/(?:IFSC|IFS\s*Code)\s*[:\-]?\s*([A-Z]{4}0[A-Z0-9]{6})/i);
      if (ifscMatch) fields.bankIfsc = ifscMatch[1].toUpperCase();
      else {
        const ifsc2 = t.match(/\b([A-Z]{4}0[A-Z0-9]{6})\b/);
        if (ifsc2) fields.bankIfsc = ifsc2[1];
      }

      const accTypeMatch = t.match(/(?:Account\s*Type|Type\s*of\s*Account)\s*[:\-]?\s*(Current\s*Account|Savings\s*Account|Cash\s*Credit|Overdraft|(?:Current|Savings|CC|OD))/i);
      if (accTypeMatch) fields.bankAccountType = accTypeMatch[1].trim();

      const bankNames = [
        [/union\s*bank\s*of\s*india/i, "Union Bank of India"],
        [/state\s*bank\s*of\s*india|SBI\b/i, "State Bank of India"],
        [/\bhdfc\s*bank/i, "HDFC Bank"], [/\bicici\s*bank/i, "ICICI Bank"],
        [/\baxis\s*bank/i, "Axis Bank"], [/\bkotak\s*mahindra/i, "Kotak Mahindra Bank"],
        [/\bpunjab\s*national\s*bank|\bPNB\b/i, "Punjab National Bank"],
        [/\bbank\s*of\s*baroda|\bBOB\b/i, "Bank of Baroda"],
        [/\bcanara\s*bank/i, "Canara Bank"], [/\bindian\s*bank/i, "Indian Bank"],
        [/\bbank\s*of\s*india\b/i, "Bank of India"],
        [/\bindian\s*overseas\s*bank|\bIOB\b/i, "Indian Overseas Bank"],
        [/\bcentral\s*bank\s*of\s*india/i, "Central Bank of India"],
        [/\buco\s*bank/i, "UCO Bank"], [/\byes\s*bank/i, "YES Bank"],
        [/\bindusind\s*bank/i, "IndusInd Bank"], [/\bfederal\s*bank/i, "Federal Bank"],
        [/\bidbi\s*bank/i, "IDBI Bank"], [/\bbandhan\s*bank/i, "Bandhan Bank"],
        [/\brbl\s*bank/i, "RBL Bank"], [/\bau\s*small\s*finance/i, "AU Small Finance Bank"],
        [/\bkarur\s*vysya/i, "Karur Vysya Bank"], [/\bsouth\s*indian\s*bank/i, "South Indian Bank"],
        [/\bdhanlaxmi\s*bank/i, "Dhanlaxmi Bank"], [/\bjammu.*kashmir\s*bank/i, "J&K Bank"],
        [/\bcity\s*union\s*bank/i, "City Union Bank"],
      ];
      for (const [re, name] of bankNames) {
        if (re.test(t)) { fields.bankName = name; break; }
      }

      const branchPatterns = [
        /(?:Branch)\s*[:\-]?\s*([A-Z][A-Za-z\s,.\-]+?)(?=\s*(?:Date|Statement|IFSC|Account|Customer|\d{2}[\/\-]|$))/i,
        /(?:Branch\s*(?:Name|Address|Office))\s*[:\-]?\s*([A-Z][A-Za-z\s,.\-]+?)(?=\s*(?:Date|IFSC|$))/i,
      ];
      for (const p of branchPatterns) {
        const m = t.match(p);
        if (m && m[1].trim().length > 3) { fields.bankBranch = m[1].trim(); break; }
      }

      const addressMatch = t.match(/(?:Address)\s*[:\-]?\s*([A-Za-z0-9][A-Za-z0-9\s,.\-\/]+?\d{6})/i);
      if (addressMatch) fields.bankAddress = addressMatch[1].trim();

      const holderMatch = t.match(/(?:Name)\s*[:\-]?\s*(?:MR|MS|MRS|SHRI|SMT|M\/S)?\s*([A-Z][A-Z\s]+?)(?=\s*(?:Address|Account|$))/i);
      if (holderMatch && !fields.bankAccountName) fields.bankAccountName = holderMatch[1].trim();
    }

    if (docType === "Udyam Registration Certificate") {
      const udyamMatch = t.match(/(UDYAM-[A-Z]{2}-\d{2}-\d{7})/i);
      if (udyamMatch) fields.udyamNumber = udyamMatch[1].toUpperCase();

      const entNamePatterns = [
        /(?:NAME\s*OF\s*(?:ENTERPRISE|UNIT|BUSINESS|FIRM))\s*[:\-]?\s*([A-Z][A-Z\s&.]+?)(?=\s*(?:TYPE|MAJOR|FLAT|SOCIAL|CATEGORY|MOBILE|DATE|NIC|\d{2}|$))/i,
        /(?:Enterprise\s*Name)\s*[:\-]?\s*([A-Z][A-Z\s&.]+?)(?=\s+(?:Type|Major|Flat|Social|Category|Mobile|Date|NIC|Micro|Small|Medium|\d{2}))/i,
        /(?:Enterprise\s*Name|Name\s*of\s*Enterprise)\s*[:\-]?\s*([A-Z][A-Z\s&.\-]+[A-Z.])/i,
      ];
      for (const p of entNamePatterns) {
        const m = t.match(p);
        if (m && m[1].trim().length > 2) { fields.enterpriseName = m[1].trim(); break; }
      }

      const typeMatch = t.match(/(?:TYPE\s*OF\s*(?:ENTERPRISE|UNIT))\s*[:\-]?\s*(MICRO|SMALL|MEDIUM)/i);
      if (typeMatch) fields.enterpriseType = typeMatch[1].charAt(0) + typeMatch[1].slice(1).toLowerCase();
      else {
        if (/\bmicro\b/i.test(t)) fields.enterpriseType = "Micro";
        else if (/\bsmall\b/i.test(t)) fields.enterpriseType = "Small";
        else if (/\bmedium\b/i.test(t)) fields.enterpriseType = "Medium";
      }

      const activityMatch = t.match(/(?:MAJOR\s*ACTIVITY)\s*[:\-]?\s*(SERVICES?|MANUFACTURING|TRADING)/i);
      if (activityMatch) fields.majorActivity = activityMatch[1].trim();

      const mobileMatch = t.match(/(?:Mobile|Phone)\s*[:\-]?\s*(\+?91\s*)?(\d{10})/i);
      if (mobileMatch) fields.udyamMobile = mobileMatch[2];

      const emailMatch = t.match(/(?:Email|E-?mail)\s*[:\-]?\s*([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/i);
      if (emailMatch) fields.udyamEmail = emailMatch[1].toLowerCase();

      const doiPatterns = [
        /(?:DATE\s*OF\s*(?:INCORPORATION|COMMENCEMENT|REGISTRATION\s*OF\s*ENTERPRISE))\s*[:\-]?\s*(\d{2}\/\d{2}\/\d{4})/i,
        /(?:DATE\s*OF\s*(?:INCORPORATION|COMMENCEMENT))\s*[:\-]?\s*(\d{2}[\-\/]\d{2}[\-\/]\d{4})/i,
      ];
      for (const p of doiPatterns) {
        const m = t.match(p);
        if (m) { fields.dateOfIncorporation = m[1].replace(/-/g, "/"); break; }
      }

      const nicPatterns = [
        /(\d{2}\s*[\-:]\s*[A-Za-z\s,]+?activit(?:y|ies))/i,
        /NIC\s*(?:Code)?[:\-]?\s*(\d{2}\s*[\-:]\s*[A-Za-z\s,]+)/i,
      ];
      for (const p of nicPatterns) {
        const m = t.match(p);
        if (m) { fields.nicDescription = m[1].trim(); break; }
      }
      const nic5Match = t.match(/(\d{5}\s*[\-:]\s*[A-Za-z\s]+?activit(?:y|ies))/i);
      if (nic5Match) fields.nic5Code = nic5Match[1].trim();

      const stateMatch = t.match(/(?:State)\s*[:\-]?\s*([A-Z][A-Z\s]+?)(?=\s*(?:District|Pin|City|$))/i);
      if (stateMatch) fields.state = stateMatch[1].trim();
      const distMatch = t.match(/(?:District)\s*[:\-]?\s*([A-Z][A-Za-z\s]+?)(?=\s*(?:State|Pin|City|Block|$))/i);
      if (distMatch) fields.district = distMatch[1].trim();
      const pinMatch = t.match(/(?:Pin|Pincode|PIN\s*Code)\s*[:\-]?\s*(\d{6})/i);
      if (pinMatch) fields.pin = pinMatch[1];
      else { const pin2 = t.match(/\b(\d{6})\b/); if (pin2 && parseInt(pin2[1]) >= 100000) fields.pin = pin2[1]; }
      const cityMatch = t.match(/(?:City|Town)\s*[:\-]?\s*([A-Z][A-Za-z\s]+?)(?=\s*(?:State|District|Pin|$))/i);
      if (cityMatch) fields.city = cityMatch[1].trim();
      const premisesMatch = t.match(/(?:Premises?|Building|Flat|Door|Block)\s*[:\-]?\s*([A-Z0-9][A-Z0-9\s,.]+?)(?=\s*(?:Village|Road|Street|City|$))/i);
      if (premisesMatch) fields.premises = premisesMatch[1].trim();
      const roadMatch = t.match(/(?:Road|Street|Lane)\s*[:\-]?\s*([A-Z0-9][A-Z0-9\s,]+?)(?=\s*(?:City|Village|Block|$))/i);
      if (roadMatch) fields.road = roadMatch[1].trim();
      const categoryMatch = t.match(/(?:SOCIAL\s*CATEGORY)\s*[:\-]?\s*(GENERAL|SC|ST|OBC)/i);
      if (categoryMatch) fields.socialCategory = categoryMatch[1].trim();

      const ownerNameMatch = t.match(/(?:NAME\s*(?:OF\s*)?(?:OWNER|PROPRIETOR|PARTNER|DIRECTOR)S?)\s*[:\-]?\s*([A-Z][A-Z\s]+?)(?=\s*(?:MOBILE|EMAIL|ADDRESS|DATE|PAN|AADHAR|AADHAAR|$))/i);
      if (ownerNameMatch) fields.ownerName = ownerNameMatch[1].trim();

      const ownerDesigMatch = t.match(/(?:NAME\s*OF\s*)(OWNER|PROPRIETOR|PARTNER|DIRECTOR)S?\b/i);
      if (ownerDesigMatch) {
        const raw = ownerDesigMatch[1].trim();
        fields.udyamDesignation = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
      }

      const udyamPersonPans = [...t.matchAll(/\b([A-Z]{5}\d{4}[A-Z])\b/g)].map(m => m[1]);
      const entPan = fields.panNumber || "";
      const udyamIndivPans = udyamPersonPans.filter(p => p !== entPan);
      if (udyamIndivPans.length > 0 && !fields.gstPersonPans) {
        fields.gstPersonPans = udyamIndivPans;
      }
    }

    if (docType === "PAN Card") {
      const panMatch = t.match(/([A-Z]{5}\d{4}[A-Z])/);
      if (panMatch) fields.panNumber = panMatch[1];
      const nameMatch = t.match(/(?:Name)\s*[:\-]?\s*([A-Z][A-Z\s]+?)(?=\s*(?:Father|Date|DOB|\d|$))/i);
      if (nameMatch) fields.panHolderName = nameMatch[1].trim();
      const dobPatterns = [
        /(?:Date\s*of\s*Birth|DOB|D\.O\.B)\s*[:\-]?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i,
        /(?:Birth)\s*[:\-]?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i,
      ];
      for (const p of dobPatterns) {
        const m = t.match(p);
        if (m) { fields.panDob = m[1].replace(/-/g, "/"); break; }
      }
    }

    if (docType === "GST Certificate") {
      const gstMatch = t.match(/(\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z\d][A-Z]\d)/);
      if (gstMatch) fields.gstNumber = gstMatch[1];

      const legalNamePatterns = [
        /(?:Legal\s*Name)\s*[:\-]?\s*([A-Z][A-Z\s&.\-]+?)(?=\s*(?:\d+\.?\s*Trade|Trade\s*Name|Additional|Constitution|Address|GSTIN|\d+\.\s|$))/i,
        /(?:Legal\s*Name)\s*[:\-]?\s*([A-Z][A-Z\s&.\-]{3,})/i,
      ];
      for (const p of legalNamePatterns) {
        const m = t.match(p);
        if (m && m[1].trim().length > 3) { fields.gstLegalName = m[1].trim(); break; }
      }

      const tradeNamePatterns = [
        /(?:Trade\s*Name,?\s*(?:if\s*any)?)\s*[:\-]?\s*([A-Z][A-Z\s&.\-]+?)(?=\s*(?:\d+\.?\s*Additional|Additional|Constitution|Address|GSTIN|\d+\.\s|$))/i,
        /(?:Trade\s*Name)\s*[:\-]?\s*([A-Z][A-Z\s&.\-]{3,})/i,
      ];
      for (const p of tradeNamePatterns) {
        const m = t.match(p);
        if (m && m[1].trim().length > 3) { fields.gstTradeName = m[1].trim(); break; }
      }

      const constitutionMatch = t.match(/(?:Constitution\s*(?:of\s*)?Business)\s*[:\-]?\s*([A-Za-z][A-Za-z\s]+?)(?=\s*(?:\d+\.?\s*Address|Address|Date|PIN|Floor|Building|$))/i);
      if (constitutionMatch) fields.gstConstitution = constitutionMatch[1].trim();

      const gstAddrMatch = t.match(/(?:Address\s*of\s*Principal\s*Place|Principal\s*Place\s*of\s*Business)\s*[:\-]?\s*([\s\S]{10,300}?)(?=\s*(?:\d+\.?\s*Date|\d+\.?\s*Type|Date\s*of\s*(?:Liability|Validity)|Type\s*of\s*Registration))/i);
      if (gstAddrMatch) {
        const addrBlock = gstAddrMatch[1];
        const stateM = addrBlock.match(/State\s*[:\-]?\s*([A-Za-z][A-Za-z\s]+?)(?=\s*(?:PIN|District|City|$))/i);
        if (stateM) fields.state = stateM[1].trim();
        const distM = addrBlock.match(/District\s*[:\-]?\s*([A-Za-z][A-Za-z\s]+?)(?=\s*(?:State|PIN|City|$))/i);
        if (distM) fields.district = distM[1].trim();
        const cityM = addrBlock.match(/(?:City|Town|Village)\s*[:\-]?\s*([A-Za-z][A-Za-z\s]+?)(?=\s*(?:District|State|PIN|$))/i);
        if (cityM) fields.city = cityM[1].trim();
        const pinM = addrBlock.match(/(?:PIN\s*Code?)\s*[:\-]?\s*(\d{6})/i);
        if (pinM) fields.pin = pinM[1];
        const roadM = addrBlock.match(/(?:Road|Street)\s*[:\-]?\s*([A-Za-z0-9][A-Za-z0-9\s]+?)(?=\s*(?:Locality|City|Town|Village|District|$))/i);
        if (roadM) fields.road = roadM[1].trim();
        const localityM = addrBlock.match(/(?:Locality|Sub\s*Locality)\s*[:\-]?\s*([A-Za-z][A-Za-z\s]+?)(?=\s*(?:City|Town|Village|District|$))/i);
        if (localityM) fields.premises = (fields.premises ? fields.premises + ", " : "") + localityM[1].trim();
        const floorM = addrBlock.match(/(?:Floor\s*No\.?)\s*[:\-]?\s*([A-Za-z0-9][A-Za-z0-9\s]+?)(?=\s*(?:Building|Flat|Road|Street|$))/i);
        const bldgM = addrBlock.match(/(?:Building\s*No\.?|Flat\s*No\.?)\s*[:\-]?\s*([A-Za-z0-9][A-Za-z0-9\s]+?)(?=\s*(?:Road|Street|Locality|Floor|$))/i);
        if (floorM || bldgM) fields.premises = [floorM && floorM[1].trim(), bldgM && bldgM[1].trim()].filter(Boolean).join(", ");
      }
      if (!fields.pin) {
        const pinFallback = t.match(/(?:PIN\s*Code?)\s*[:\-]?\s*(\d{6})/i);
        if (pinFallback) fields.pin = pinFallback[1];
        else { const p6 = t.match(/\b(\d{6})\b/); if (p6 && parseInt(p6[1]) >= 100000 && parseInt(p6[1]) <= 999999) fields.pin = p6[1]; }
      }

      const validityMatch = t.match(/(?:(?:Date|Period)\s*of\s*Validity)\s*(?:From)?\s*[:\-]?\s*(?:From\s*)?(\d{2}\/\d{2}\/\d{4})/i);
      if (validityMatch) fields.gstValidityFrom = validityMatch[1];
      if (!fields.gstValidityFrom) {
        const issueDate = t.match(/(?:Date\s*of\s*issue\s*(?:of\s*)?(?:Certificate)?)\s*[:\-]?\s*(\d{2}\/\d{2}\/\d{4})/i);
        if (issueDate) fields.gstValidityFrom = issueDate[1];
      }

      const compName = (fields.gstTradeName || "").toUpperCase();
      const extractPersonNames = (block, isDir) => {
        const names = [];
        const personPans = [];
        const patterns = [
          /(?:\bName\b)\s*[:\-]?\s*([A-Z][A-Za-z\s.]+?)(?=\s*(?:Designation|Resident|Status|DIN|PAN|Father|Date|Mobile|Photo|Name\b|Trade\b|Legal\b|Additional\b|Constitution\b|Address\b|Period\b|Type\b|Particulars\b|Annexure\b|Details\b|Signature\b|Total\b|\d{1,3}\s|$))/gi,
          /(?:\bName\b)\s+([A-Z][a-z]+(?:\s+[A-Za-z][a-z]+)+)/g,
          /\b(\d+)\s+Name\s+([A-Z][A-Za-z\s.]+?)(?=\s*(?:Designation|DIN|Resident|Status|Trade\b|Legal\b|$))/gi,
        ];
        for (const re of patterns) {
          const matches = block.matchAll(re);
          for (const nm of matches) {
            const n = (nm[2] || nm[1]).trim();
            const skip = /^(Legal|Trade|Additional|Total|Number|Goods|Services|Tax|Identification|Annexure|Signature|Registration|Certificate|Place|Business|Address|Floor|Building|Superintendent|Commissioner|Officer|Principal|Centre|Jurisdictional)\b/i.test(n);
            const nUp = n.toUpperCase();
            const corpWords = /\b(LIMITED|PRIVATE|LLP|PARTNERSHIP|COMPANY|CORPORATION|ENTERPRISES|INDUSTRIES|REPRESENTATIONS|SOLUTIONS|SERVICES|TECHNOLOGIES|PVT|LTD|INC)\b/i.test(n);
            const isComp = corpWords || nUp === compName || (compName && compName.length > 5 && (compName.includes(nUp) || nUp.includes(compName.substring(0, Math.min(10, compName.length))))) || n.split(/\s+/).length > 5;
            const cleaned = n.replace(/\s+(Trade|Legal|Additional|Constitution|Address|Period|Type|Particulars|Annexure|Details|Signature|Total|Number)$/i, "").trim();
            if (cleaned.length > 2 && cleaned.length < 60 && !skip && !isComp && /[a-z]/i.test(cleaned)) names.push(cleaned);
          }
          if (names.length > 0) break;
        }
        const unique = [...new Set(names)];
        if (unique.length > 0) {
          if (isDir) fields.gstDirectors = unique;
          else fields.gstPartners = unique;
        }
        const allPans = [...block.matchAll(/\b([A-Z]{5}\d{4}[A-Z])\b/g)].map(m => m[1]);
        const entityPan = fields.panNumber || (fields.gstNumber ? fields.gstNumber.substring(2, 12) : "");
        const individualPans = allPans.filter(p => p !== entityPan);
        if (individualPans.length > 0) {
          fields.gstPersonPans = individualPans;
        }
        const dobMatches = [...block.matchAll(/(?:Date\s*of\s*Birth|DOB|D\.O\.B|Birth\s*Date)\s*[:\-]?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/gi)].map(m => m[1].replace(/-/g, "/"));
        if (dobMatches.length > 0) {
          fields.personDobs = dobMatches;
        }
      };

      const blockHeadings = [
        /(?:Details\s*of\s*(?:Designated\s*)?(?:Partners|Directors|Promoters|Members|Karta|Trustees))([\s\S]*?)$/i,
        /(?:Annexure\s*B)([\s\S]*?)$/i,
        /(?:Particulars\s*of\s*(?:Partners|Directors|Promoters))([\s\S]*?)$/i,
      ];
      let foundBlock = false;
      for (const re of blockHeadings) {
        const partnersBlock = t.match(re);
        if (partnersBlock) {
          const isDir = /director/i.test(partnersBlock[0]) || /private\s*limited/i.test(fields.gstConstitution || "");
          extractPersonNames(partnersBlock[1], isDir);
          foundBlock = true;
          break;
        }
      }
      if (!foundBlock) {
        const afterSig = t.match(/(?:Signature|Date\s*of\s*issue)([\s\S]{50,}?)$/i);
        if (afterSig) {
          const isDir = /private|company|limited/i.test(fields.gstConstitution || fields.gstLegalName || "");
          extractPersonNames(afterSig[1], isDir);
        }
      }

      const gstEmailM = t.match(/(?:E[\-\s]?mail|Email\s*(?:Address|ID)?)\s*[:\-]?\s*([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/i);
      if (gstEmailM) fields.gstEmail = gstEmailM[1].toLowerCase();
      const gstMobileM = t.match(/(?:Mobile|Phone|Contact|Telephone)\s*(?:No\.?|Number)?\s*[:\-]?\s*(?:\+?91[\s\-]?)?(\d{10})/i);
      if (gstMobileM) fields.gstMobile = gstMobileM[1];
      if (!gstMobileM) {
        const mob10 = t.match(/\b([6-9]\d{9})\b/);
        if (mob10) fields.gstMobile = mob10[1];
      }

      const desigBlock = (fields.gstPartners || fields.gstDirectors || []).length > 0 ? t : "";
      if (desigBlock) {
        const desigMatches = desigBlock.match(/(?:Designation|Status)\s*[:\-\/]?\s*(Partner|Director|Proprietor|Managing\s*Partner|Designated\s*Partner|Karta|Trustee|Managing\s*Director|Whole\s*Time\s*Director)/gi);
        if (desigMatches && desigMatches.length > 0) {
          fields.gstPersonDesignations = desigMatches.map(d => d.replace(/^(?:Designation|Status)\s*[:\-\/]?\s*/i, "").trim());
        }
      }

      if (!fields.gstPartners && !fields.gstDirectors && fields.gstLegalName) {
        if (/proprietor/i.test(fields.gstConstitution || "")) {
          fields.gstPartners = [fields.gstLegalName];
          if (!fields.gstPersonDesignations || fields.gstPersonDesignations.length === 0) {
            fields.gstPersonDesignations = ["Proprietor"];
          }
        }
      }

      if (fields.gstNumber && fields.gstNumber.length >= 12 && !fields.panNumber) {
        fields.panNumber = fields.gstNumber.substring(2, 12);
      }

      if (!fields.gstAddress) {
        const fullAddr = this.buildAddress(fields);
        if (fullAddr) fields.gstAddress = fullAddr;
      }
    }

    if (docType === "Certificate of Incorporation") {
      const cinMatch = t.match(/\b([UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6})\b/);
      if (cinMatch) fields.cinNumber = cinMatch[1];
      const compNameMatch = t.match(/(?:company\s*name|name\s*of\s*(?:the\s*)?company)\s*[:\-]?\s*([A-Z][A-Z\s&.]+?(?:LIMITED|LLP|PVT|PRIVATE))/i);
      if (compNameMatch) fields.companyName = compNameMatch[1].trim();
      const incDateMatch = t.match(/(?:date\s*of\s*incorporation)\s*[:\-]?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
      if (incDateMatch) fields.dateOfIncorporation = incDateMatch[1].replace(/-/g, "/");

      const dirBlock = t.match(/(?:Directors?|Subscribers?|Signatories|Promoters?)([\s\S]*?)$/i);
      if (dirBlock) {
        const dirNames = [];
        const dirPans = [];
        const nameMatches = [...dirBlock[1].matchAll(/(?:Name|Director)\s*[:\-]?\s*([A-Z][A-Za-z\s.]+?)(?=\s*(?:DIN|PAN|Father|Address|Designation|Director|Name\b|\d|$))/gi)];
        for (const nm of nameMatches) {
          const n = nm[1].trim();
          if (n.length > 2 && n.length < 60 && !/\b(LIMITED|PRIVATE|LLP|COMPANY|PVT|LTD)\b/i.test(n)) dirNames.push(n);
        }
        const panMatches = [...dirBlock[1].matchAll(/\b([A-Z]{5}\d{4}[A-Z])\b/g)].map(m => m[1]);
        const entPan = fields.panNumber || "";
        const indivPans = panMatches.filter(p => p !== entPan);
        if (dirNames.length > 0 && !fields.gstDirectors) {
          fields.gstDirectors = [...new Set(dirNames)];
          if (indivPans.length > 0) fields.gstPersonPans = indivPans;
          if (!fields.gstPersonDesignations) fields.gstPersonDesignations = dirNames.map(() => "Director");
        }
      }
    }

    if (docType === "Invoice") {
      const panM = t.match(/\b([A-Z]{5}\d{4}[A-Z])\b/);
      if (panM) fields.panNumber = panM[1];

      const gstM = t.match(/\b(\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z\d][A-Z\d])\b/);
      if (gstM) fields.gstNumber = gstM[1];

      const compPatterns = [
        /(?:From|Seller|Biller|Company|Firm|Issued\s*by|Travel\s*Agent|Agent\s*Name|Remitter)\s*[:\-]?\s*([A-Z][A-Z\s&.\-'()]+?)(?=\s*(?:Address|PAN|GST|Phone|Mobile|Email|Invoice|GSTIN|Destination|Travel|Account|\d{6}|$))/i,
        /(?:M\/s|M\/S)\s+([A-Z][A-Za-z\s&.\-'()]+?)(?=\s+\d|,|\s+(?:Address|PAN|GST|Invoice|GSTIN|Destination|Travel|Account|\d{6})|\s*$)/i,
        /(?:Invoice\s*(?:from|by))\s*[:\-]?\s*([A-Z][A-Z\s&.\-'()]+?)(?=\s+(?:PAN|GST|Invoice|Address|\d)|$)/i,
      ];
      for (const p of compPatterns) {
        const m = t.match(p);
        if (m && m[1].trim().length > 2 && !/^(INVOICE|PROFORMA|TAX|DATE|TOTAL|AMOUNT)/i.test(m[1].trim())) {
          fields.genericName = m[1].trim().replace(/\s+(PVT|PRIVATE|LIMITED|LTD)\.?$/i, (x) => x);
          break;
        }
      }

      const addrM = t.match(/(?:Address|Office|Premises)\s*[:\-]?\s*([A-Za-z0-9][A-Za-z0-9\s,.\-\/]+?\d{6})/i);
      if (addrM) fields.genericAddress = addrM[1].trim();

      const invNoM = t.match(/(?:Invoice\s*(?:No|Number|#|Ref))\s*[:\-]?\s*([A-Za-z0-9\-\/]+)/i);
      if (invNoM) fields.invoiceNumber = invNoM[1].trim();

      const amtPatterns = [
        /(?:Grand\s*Total|Total\s*Amount|Net\s*Amount|Payable|Total\s*Payable|Amount\s*Payable)\s*[:\-]?\s*(?:(?:INR|USD|EUR|GBP|Rs\.?|₹|\$|€|£)\s*)?([0-9,]+(?:\.\d{1,2})?)/i,
        /(?:INR|USD|EUR|GBP|Rs\.?|₹|\$|€|£)\s*([0-9,]+(?:\.\d{1,2})?)(?:\s*(?:only|total|payable))/i,
      ];
      for (const p of amtPatterns) {
        const m = t.match(p);
        if (m) { fields.invoiceAmount = m[1].trim(); break; }
      }

      const currM = t.match(/\b(USD|EUR|GBP|AED|THB|SGD|MYR|JPY|AUD|CAD|CHF|SAR|QAR|KWD|OMR|BHD|NZD|SEK|NOK|DKK|HKD|CNY|KRW)\b/i);
      if (currM) fields.invoiceCurrency = currM[1].toUpperCase();

      const destPatterns = [
        /(?:Destination|Travel\s+to\b|Travelling\s+to\b|Tour\s+to\b|Trip\s+to\b)\s*[:\-]?\s*([A-Z][A-Za-z]+(?:\s*,\s*[A-Z][A-Za-z]+)*)/i,
        /(?:Country)\s*[:\-]\s*([A-Z][A-Za-z]+(?:\s*,\s*[A-Z][A-Za-z]+)*)/i,
      ];
      for (const p of destPatterns) {
        const m = t.match(p);
        if (m && m[1].trim().length > 2) { fields.invoiceDestination = m[1].trim(); break; }
      }

      const dateRangeM = t.match(/(?:Travel\s*Date|Date\s*of\s*Travel|Tour\s*Date|Trip\s*Date)\s*[:\-]?\s*(\d{1,2}[\/-]\w{3,9}[\/-]\d{2,4})\s*(?:to|-)\s*(\d{1,2}[\/-]\w{3,9}[\/-]\d{2,4})/i);
      if (dateRangeM) {
        fields.invoiceDateFrom = dateRangeM[1];
        fields.invoiceDateTo = dateRangeM[2];
      } else {
        const dateFromM = t.match(/(?:From|Departure|Start\s*Date|Check[\s-]*in|Travel\s*Date)\s*[:\-]?\s*(\d{1,2}[\/-]\w{3,9}[\/-]\d{2,4})/i);
        if (dateFromM) fields.invoiceDateFrom = dateFromM[1];
        const dateToM = t.match(/(?:To|Return|End\s*Date|Check[\s-]*out)\s*[:\-]?\s*(\d{1,2}[\/-]\w{3,9}[\/-]\d{2,4})/i);
        if (dateToM) fields.invoiceDateTo = dateToM[1];
      }

      const paxM = t.match(/(?:(?:No|Number)\.?\s*of\s*(?:Passengers?|Pax|Travell?ers?|Guests?|Persons?)|Passengers?|Pax)\s*[:\-]?\s*(\d+)/i);
      if (paxM) fields.invoicePax = paxM[1];

      const benefPatterns = [
        /(?:Beneficiary\s*(?:Name)?|Payee|Pay\s*to|Remit\s*to)\s*[:\-]?\s*([A-Z][A-Za-z\s&.\-']+?)(?=\s+(?:SWIFT|BIC|IBAN|Account|Bank|Address|PAN|GST|Phone|Mobile|Email|\d)|,|$)/i,
      ];
      for (const p of benefPatterns) {
        const m = t.match(p);
        if (m && m[1].trim().length > 2) { fields.invoiceBeneficiary = m[1].trim(); break; }
      }

      const swiftM = t.match(/(?:SWIFT|BIC)\s*[:\-]?\s*([A-Z]{6}[A-Z0-9]{2,5})/i);
      if (swiftM) fields.invoiceSwift = swiftM[1].toUpperCase();

      const ibanM = t.match(/(?:IBAN)\s*[:\-]?\s*([A-Z]{2}\d{2}[A-Z0-9]{4,30})/i);
      if (ibanM) fields.invoiceIban = ibanM[1];

      const bankAccM = t.match(/(?:Account\s*(?:No|Number|#))\s*[:\-]?\s*(\d{8,20})/i);
      if (bankAccM) fields.invoiceAccountNo = bankAccM[1];

      const bankNameM = t.match(/(?:Bank\s*Name|Beneficiary\s*Bank|Bank)\s*[:\-]?\s*([A-Z][A-Za-z\s&.\-]+?)(?=\s+(?:Branch|Account|IFSC|SWIFT|Contact|Authorized|Director|$)|,|$)/i);
      if (bankNameM) fields.invoiceBankName = bankNameM[1].trim();

      const personM = t.match(/(?:Contact|Authorized|Signatory|Director|Partner|Proprietor)\s*[:\-]?\s*([A-Z][A-Za-z\s.]+?)(?=\s+(?:PAN|GST|DIN|Phone|Mobile|Email|Address|\d)|,|$)/i);
      if (personM && personM[1].trim().length > 2) fields.genericPerson = personM[1].trim();
    }

    if (docType === "Document") {
      const namePatterns = [
        /(?:Company|Firm|Business|Enterprise|Entity|Organisation|Organization)\s*(?:Name)?\s*[:\-]?\s*([A-Z][A-Z\s&.\-]+?)(?=\s{2,}|\n|(?:Address|Date|Registration|Mobile|Phone|Email|$))/i,
        /(?:Name\s*of\s*(?:Company|Firm|Business|Enterprise|Entity|Applicant))\s*[:\-]?\s*([A-Z][A-Z\s&.\-]+?)(?=\s{2,}|\n|(?:Address|Date|$))/i,
        /(?:M\/s|M\/S)\s+([A-Z][A-Z\s&.\-]+?)(?=\s{2,}|\n|(?:Address|$))/i,
      ];
      for (const p of namePatterns) {
        const m = t.match(p);
        if (m && m[1].trim().length > 2) { fields.genericName = m[1].trim(); break; }
      }
      const addrMatch = t.match(/(?:Address|Office|Premises)\s*[:\-]?\s*([A-Za-z0-9][A-Za-z0-9\s,.\-\/]+?\d{6})/i);
      if (addrMatch) fields.genericAddress = addrMatch[1].trim();

      const personBlock = t.match(/(?:Directors?|Partners?|Promoters?|Authorized\s*(?:Person|Signatory)|Proprietor|Managing\s*(?:Partner|Director))([\s\S]*?)$/i);
      if (personBlock && !fields.gstDirectors && !fields.gstPartners) {
        const pNames = [];
        const pDesigs = [];
        const isDir = /director/i.test(personBlock[0]);
        const nameMs = [...personBlock[1].matchAll(/(?:Name|Director|Partner|Proprietor)\s*[:\-]?\s*([A-Z][A-Za-z\s.]+?)(?=\s*(?:DIN|PAN|Designation|Address|Father|Director|Partner|Name\b|\d|$))/gi)];
        for (const nm of nameMs) {
          const n = nm[1].trim();
          if (n.length > 2 && n.length < 60 && !/\b(LIMITED|PRIVATE|LLP|COMPANY|PVT|LTD)\b/i.test(n)) pNames.push(n);
        }
        if (pNames.length > 0) {
          const unique = [...new Set(pNames)];
          if (isDir) { fields.gstDirectors = unique; pDesigs.push(...unique.map(() => "Director")); }
          else { fields.gstPartners = unique; pDesigs.push(...unique.map(() => "Partner")); }
          if (!fields.gstPersonDesignations) fields.gstPersonDesignations = pDesigs;
        }
        const docPans = [...personBlock[1].matchAll(/\b([A-Z]{5}\d{4}[A-Z])\b/g)].map(m => m[1]);
        const entPan = fields.panNumber || "";
        const indivPans = docPans.filter(p => p !== entPan);
        if (indivPans.length > 0 && !fields.gstPersonPans) fields.gstPersonPans = indivPans;
      }

      const desigMatch = t.match(/(?:Designation|Status)\s*[:\-\/]?\s*(Partner|Director|Proprietor|Managing\s*Partner|Designated\s*Partner|Managing\s*Director|Trustee|Karta)/i);
      if (desigMatch && !fields.gstPersonDesignations) {
        fields.gstPersonDesignations = [desigMatch[1].trim()];
      }
    }

    return fields;
  }

  autoFillForm() {
    const d = this.extractedData;
    this.autoFilledCount = 0;

    const setVal = (id, value, source) => {
      const el = document.getElementById(id);
      if (el && value) {
        el.value = value;
        el.classList.add("auto-filled");
        this.autoFilledCount++;
        if (source) this.setBadge(id, source);
      }
    };

    const companyName = d.enterpriseName || d.gstTradeName || d.gstLegalName || d.companyName || d.genericName || d.bankAccountName || "";
    const companySource = d.enterpriseName ? "UDYAM" : d.gstTradeName || d.gstLegalName ? "GST" : d.companyName ? "CoI" : d.genericName ? "DOC" : d.bankAccountName ? "BANK" : "";

    const address = this.buildAddress(d) || d.gstAddress || d.bankAddress || d.genericAddress || "";
    const addrSource = this.buildAddress(d) ? (d.gstNumber ? "GST" : d.udyamNumber ? "UDYAM" : "DOC") : d.gstAddress ? "GST" : d.bankAddress ? "BANK" : d.genericAddress ? "DOC" : "";

    const personNames = d.gstPartners || d.gstDirectors || [];
    const personName = d.ownerName || d.panHolderName || (personNames.length > 0 ? personNames[0] : "") || d.bankAccountHolderName || "";
    const cleanName = personName.replace(/^(MR|MS|MRS|SHRI|SMT|M\/S)\s+/i, "").trim();
    const nameSource = d.ownerName ? "UDYAM" : d.panHolderName ? "PAN" : personNames.length > 0 ? "GST" : d.bankAccountHolderName ? "BANK" : "";

    const mobile = d.udyamMobile || d.gstMobile || d.extractedMobile || "";
    const mobileSource = d.udyamMobile ? "UDYAM" : d.gstMobile ? "GST" : d.extractedMobile ? "DOC" : "";
    const email = d.udyamEmail || d.gstEmail || d.extractedEmail || "";
    const emailSource = d.udyamEmail ? "UDYAM" : d.gstEmail ? "GST" : d.extractedEmail ? "DOC" : "";

    setVal("registeredName", companyName, companySource);
    const legalEntityName = d.gstLegalName || d.companyName || companyName;
    setVal("legalEntityName", legalEntityName, companySource);
    setVal("registeredAddress", address, addrSource);
    setVal("principalPlace", address, addrSource);
    setVal("dateOfIncorporation", d.dateOfIncorporation || d.gstValidityFrom, d.dateOfIncorporation ? "UDYAM" : d.gstValidityFrom ? "GST" : "");
    setVal("panNo", d.panNumber, d.panNumber ? "PAN" : "");
    setVal("udyamNumber", d.udyamNumber, d.udyamNumber ? "UDYAM" : "");
    setVal("gstNo", d.gstNumber, d.gstNumber ? "GST" : "");

    const nature = d.nicDescription || d.nic5Code || "Travel agency, tour operator and other reservation service activities";
    let full = nature;
    if (d.nic5Code && !full.includes(d.nic5Code)) full += ` (NIC: ${d.nic5Code})`;
    setVal("natureOfBusiness", full, d.nicDescription || d.nic5Code ? "UDYAM" : "AUTO");

    const desig = this.detectDesignation(d, companyName);

    if (cleanName) {
      setVal("contactName", cleanName, nameSource);
      setVal("contactDesignation", desig, nameSource);
      setVal("kmpName", cleanName, nameSource);
      setVal("ceoName", cleanName, nameSource);
      setVal("mdName", cleanName, nameSource);
      setVal("signatoryName", cleanName, nameSource);
      setVal("signatoryDesignation", desig, nameSource);
    }
    if (personNames.length > 1) {
      for (let i = 1; i < personNames.length; i++) {
        this.addKmpRow();
        const rows = document.querySelectorAll("#kmpRows .kmp-input");
        if (rows[i]) { rows[i].value = personNames[i]; rows[i].classList.add("auto-filled"); }
      }
    }
    setVal("contactMobile", mobile, mobileSource);
    setVal("contactEmail", email, emailSource);
    setVal("ceoMobile", mobile, mobileSource);
    setVal("ceoEmail", email, emailSource);
    setVal("mdMobile", mobile, mobileSource);
    setVal("mdEmail", email, emailSource);

    if (personNames.length > 0) {
      const pSource = d.gstPartners ? "GST" : d.gstDirectors ? "GST" : nameSource;
      const personDesigs = d.gstPersonDesignations || [];
      const dirLabel = (name, idx) => {
        const pd = personDesigs[idx] || desig;
        return pd ? name + " (" + pd + ")" : name;
      };
      const dirInput1 = document.getElementById("directorName1");
      if (dirInput1 && personNames[0]) { dirInput1.value = dirLabel(personNames[0], 0); dirInput1.classList.add("auto-filled"); }
      for (let i = 1; i < personNames.length; i++) {
        this.addDirectorRow();
        const rows = document.querySelectorAll("#directorRows .director-input");
        if (rows[i]) { rows[i].value = dirLabel(personNames[i], i); rows[i].classList.add("auto-filled"); }
      }
      // Fill official rows
      const offInput1 = document.getElementById("officialName1");
      if (offInput1 && personNames[0]) { offInput1.value = personNames[0]; offInput1.classList.add("auto-filled"); }
      for (let i = 1; i < personNames.length; i++) {
        this.addOfficialRow();
        const rows = document.querySelectorAll("#officialRows .official-input");
        if (rows[i]) { rows[i].value = personNames[i]; rows[i].classList.add("auto-filled"); }
      }
      if (!cleanName) {
        setVal("signatoryName", personNames[0], pSource);
        setVal("signatoryDesignation", desig, pSource);
      }
    } else if (cleanName) {
      const dirInput1 = document.getElementById("directorName1");
      if (dirInput1) { dirInput1.value = cleanName; dirInput1.classList.add("auto-filled"); }
      const offInput1 = document.getElementById("officialName1");
      if (offInput1) { offInput1.value = cleanName; offInput1.classList.add("auto-filled"); }
    }

    this.autoFillBeneficialOwners(d, personNames, desig);

    setVal("bankName", d.bankName, "BANK");

    setVal("txnInvoiceNo", d.invoiceNumber, "INV");
    setVal("txnAmount", d.invoiceAmount, "INV");
    setVal("txnCurrency", d.invoiceCurrency, "INV");
    setVal("txnDestination", d.invoiceDestination, "INV");
    setVal("txnDateFrom", d.invoiceDateFrom, "INV");
    setVal("txnDateTo", d.invoiceDateTo, "INV");
    setVal("txnTravelers", d.invoicePax, "INV");
    setVal("txnBenefName", d.invoiceBeneficiary, "INV");
    setVal("txnSwiftCode", d.invoiceSwift, "INV");
    setVal("txnIban", d.invoiceIban, "INV");
    setVal("txnBenefAccount", d.invoiceAccountNo, "INV");
    setVal("txnBenefBank", d.invoiceBankName, "INV");
    if (d.companyWebsite) setVal("companyWebsite", d.companyWebsite, "AI");
    if (d.bankAccountNumber) setVal("bankAccountNo", d.bankAccountNumber, "BANK");
    if (d.bankIfsc) setVal("bankIfsc", d.bankIfsc, "BANK");
    if (d.bankBranch) setVal("bankBranch", d.bankBranch, "BANK");
    if (d.bankAccountType) setVal("accountType", d.bankAccountType, "BANK");
    if (d.annualFxEstimate) setVal("annualFx", d.annualFxEstimate, "AI");
    if (d.annualTurnover && !d.annualFxEstimate) setVal("annualFx", d.annualTurnover, "AI");
    if (d.principalPlace && !document.getElementById("principalPlace")?.value) setVal("principalPlace", d.principalPlace, "AI");
    if (d.cinNumber) setVal("cinNumber", d.cinNumber, "AI");
    if (d.authorizedSignatory && !document.getElementById("signatoryName")?.value) setVal("signatoryName", d.authorizedSignatory, "AI");
    if (d.purposeOfRemittance) setVal("txnPurpose", d.purposeOfRemittance, "INV");
    if (d.genericPerson && !cleanName) {
      setVal("contactName", d.genericPerson, "INV");
      setVal("signatoryName", d.genericPerson, "INV");
    }

    const legalStatus = this.detectLegalStatus(d, companyName);
    if (legalStatus) {
      this.selectRadio("legalStatusGroup", legalStatus);
      const lsSource = d.gstConstitution ? "GST" : d.enterpriseType ? "UDYAM" : d.companyName ? "CoI" : "AUTO";
      this.setBadge("legalStatus", lsSource);
    }
    this.selectRadio("stockExchangeGroup", "No");
    this.selectRadio("caseRegisteredGroup", "No");

    this.selectCheckbox("productsGroup", ["Telegraphic Transfer", "Forex Prepaid Cards", "Foreign Currency Notes"]);
    this.setBadge("products", "AUTO");

    const directors = typeof this.getDirectorNames === "function" ? this.getDirectorNames() : [];
    const personCount = directors.length > 0 ? directors.length : 1;
    const sharesPct = personCount === 1 ? "100%" : Math.round(100 / personCount) + "%";
    if (!document.getElementById("sharesPercent")?.value) setVal("sharesPercent", sharesPct, "AUTO");

    this.applySmartDerivations();
  }

  applySmartDerivations() {
    const getVal = (id) => document.getElementById(id)?.value?.trim() || "";
    const setIfEmpty = (id, val, source) => {
      const el = document.getElementById(id);
      if (el && !el.value.trim() && val) { el.value = val; el.classList.add("auto-filled"); if (source) this.setBadge(id, source); }
    };

    const gst = getVal("gstNo");
    if (gst && gst.length === 15) {
      const panFromGst = gst.substring(2, 12);
      if (/^[A-Z]{5}\d{4}[A-Z]$/.test(panFromGst)) setIfEmpty("panNo", panFromGst, "GST");
      const stateCode = gst.substring(0, 2);
      const stateMap = { "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh", "05": "Uttarakhand", "06": "Haryana", "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh", "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh", "13": "Nagaland", "14": "Manipur", "15": "Mizoram", "16": "Tripura", "17": "Meghalaya", "18": "Assam", "19": "West Bengal", "20": "Jharkhand", "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat", "25": "Daman & Diu", "26": "Dadra & Nagar Haveli", "27": "Maharashtra", "29": "Karnataka", "30": "Goa", "31": "Lakshadweep", "32": "Kerala", "33": "Tamil Nadu", "34": "Puducherry", "35": "Andaman & Nicobar", "36": "Telangana", "37": "Andhra Pradesh" };
      const stateName = stateMap[stateCode];
      if (stateName) {
        const addrEl = document.getElementById("registeredAddress");
        if (addrEl && addrEl.value && !addrEl.value.includes(stateName)) {
          const pin = addrEl.value.match(/\d{6}/);
          if (!addrEl.value.toLowerCase().includes(stateName.toLowerCase())) {
            addrEl.value = addrEl.value.replace(/\s*$/, "") + (pin ? "" : ", " + stateName);
          }
        }
      }
    }

    const ifsc = getVal("ifscCode") || getVal("bankIfsc");
    if (ifsc && ifsc.length >= 4) {
      const ifscBankMap = { "SBIN": "State Bank of India", "HDFC": "HDFC Bank", "ICIC": "ICICI Bank", "UTIB": "Axis Bank", "KKBK": "Kotak Mahindra Bank", "PUNB": "Punjab National Bank", "BARB": "Bank of Baroda", "CNRB": "Canara Bank", "IDIB": "Indian Bank", "BKID": "Bank of India", "IOBA": "Indian Overseas Bank", "CBOI": "Central Bank of India", "UCBA": "UCO Bank", "YESB": "YES Bank", "INDB": "IndusInd Bank", "FDRL": "Federal Bank", "IBKL": "IDBI Bank", "BDBL": "Bandhan Bank", "RATN": "RBL Bank", "UBIN": "Union Bank of India", "MAHB": "Bank of Maharashtra" };
      const bankFromIfsc = ifscBankMap[ifsc.substring(0, 4).toUpperCase()];
      if (bankFromIfsc) setIfEmpty("bankName", bankFromIfsc, "BANK");
    }

    const contactName = getVal("contactName");
    if (contactName) {
      setIfEmpty("signatoryName", contactName, "AUTO");
      setIfEmpty("kmpName", contactName, "AUTO");
      setIfEmpty("ceoName", contactName, "AUTO");
      setIfEmpty("mdName", contactName, "AUTO");
    }
    const contactMob = getVal("contactMobile");
    if (contactMob) {
      setIfEmpty("ceoMobile", contactMob, "AUTO");
      setIfEmpty("mdMobile", contactMob, "AUTO");
    }
    const contactEm = getVal("contactEmail");
    if (contactEm) {
      setIfEmpty("ceoEmail", contactEm, "AUTO");
      setIfEmpty("mdEmail", contactEm, "AUTO");
    }
    const contactDesig = getVal("contactDesignation");
    if (contactDesig) setIfEmpty("signatoryDesignation", contactDesig, "AUTO");

    const addr = getVal("registeredAddress");
    if (addr && addr.length > 10) {
      const pinM = addr.match(/\b(\d{6})\b/);
      if (pinM) {
        const pinEl = document.querySelector("#registeredAddress")?.closest(".form-section")?.querySelector('[id*="pin"], [id*="Pin"]');
        if (pinEl && !pinEl.value.trim()) { pinEl.value = pinM[1]; pinEl.classList.add("auto-filled"); }
      }
      const stateNames = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Chandigarh","Puducherry","Jammu & Kashmir","Ladakh"];
      for (const st of stateNames) {
        if (addr.toLowerCase().includes(st.toLowerCase())) {
          this.extractedData.state = st;
          break;
        }
      }
      const cityNames = ["Mumbai","Delhi","Bangalore","Bengaluru","Hyderabad","Chennai","Kolkata","Pune","Ahmedabad","Jaipur","Lucknow","Surat","Kanpur","Nagpur","Indore","Bhopal","Patna","Vadodara","Ghaziabad","Ludhiana","Agra","Nashik","Coimbatore","Ranchi","Guwahati","Visakhapatnam","Chandigarh","Thiruvananthapuram","Kochi","Bhubaneswar","Dehradun","Noida","Gurugram","Gurgaon","Thane","Navi Mumbai","Sonitpur","Tezpur"];
      for (const ct of cityNames) {
        if (addr.toLowerCase().includes(ct.toLowerCase())) {
          this.extractedData.city = ct;
          break;
        }
      }
    }

    const regName = getVal("registeredName");
    if (regName) setIfEmpty("legalEntityName", regName, "AUTO");

    const pan = getVal("panNo");
    if (pan && pan.length === 10) {
      const fourthChar = pan[3];
      const entityTypes = { "C": "Private Limited Company", "P": "Proprietorship", "F": "Partnership Firm", "A": "Association of Persons", "T": "Trust", "H": "HUF", "L": "Public Limited Company", "J": "Joint Venture", "G": "Government" };
      const derivedType = entityTypes[fourthChar];
      if (derivedType) {
        const lsGroup = document.getElementById("legalStatusGroup");
        if (lsGroup && !lsGroup.querySelector(".radio-item.selected")) {
          this.selectRadio("legalStatusGroup", derivedType === "Private Limited Company" ? "Private Limited Company" : derivedType === "Partnership Firm" ? "Partnership" : derivedType === "Proprietorship" ? "Proprietorship" : derivedType);
          this.setBadge("legalStatus", "PAN");
        }
      }
    }

    const bo1Name = document.querySelector("#boRows .bo-name");
    if (bo1Name && !bo1Name.value.trim()) {
      const dirName = document.getElementById("directorName1")?.value?.replace(/\s*\(.*?\)\s*$/, "").trim();
      if (dirName) {
        bo1Name.value = dirName;
        bo1Name.classList.add("auto-filled");
        const bo1Pan = document.querySelector("#boRows .bo-pan");
        if (bo1Pan && !bo1Pan.value.trim() && pan) { bo1Pan.value = pan; bo1Pan.classList.add("auto-filled"); }
        const bo1Share = document.querySelector("#boRows .bo-share");
        if (bo1Share && !bo1Share.value.trim()) { bo1Share.value = "100%"; bo1Share.classList.add("auto-filled"); }
      }
    }
  }

  setBadge(fieldId, source) {
    const badgeId = "badge_" + fieldId;
    const el = document.getElementById(badgeId);
    if (!el || !source) return;
    const labels = { UDYAM: "UDYAM", GST: "GST", BANK: "BANK", PAN: "PAN", CoI: "CoI", DOC: "DOC", AUTO: "AUTO", INV: "INV" };
    const classes = { UDYAM: "udyam", GST: "gst", BANK: "bank", PAN: "pan", CoI: "coi", DOC: "doc", AUTO: "auto", INV: "inv" };
    el.textContent = labels[source] || source;
    el.className = "source-badge " + (classes[source] || "auto");
  }

  copyFromContact(section, checked) {
    const cName = document.getElementById("contactName")?.value || "";
    const cDesig = document.getElementById("contactDesignation")?.value || "";
    const cMobile = document.getElementById("contactMobile")?.value || "";
    const cEmail = document.getElementById("contactEmail")?.value || "";
    if (section === "ceo") {
      document.getElementById("ceoName").value = checked ? cName : "";
      document.getElementById("ceoMobile").value = checked ? cMobile : "";
      document.getElementById("ceoEmail").value = checked ? cEmail : "";
      if (checked) ["ceoName","ceoMobile","ceoEmail"].forEach(id => { if (document.getElementById(id)?.value) document.getElementById(id).classList.add("auto-filled"); });
    } else if (section === "md") {
      document.getElementById("mdName").value = checked ? cName : "";
      document.getElementById("mdMobile").value = checked ? cMobile : "";
      document.getElementById("mdEmail").value = checked ? cEmail : "";
      if (checked) ["mdName","mdMobile","mdEmail"].forEach(id => { if (document.getElementById(id)?.value) document.getElementById(id).classList.add("auto-filled"); });
    } else if (section === "signatory") {
      document.getElementById("signatoryName").value = checked ? cName : "";
      if (checked && cName) document.getElementById("signatoryName").classList.add("auto-filled");
    }
  }

  addKmpRow() {
    const container = document.getElementById("kmpRows");
    const count = container.querySelectorAll(".kmp-row").length + 1;
    const row = document.createElement("div");
    row.className = "kmp-row form-grid single";
    const kmpLabel = this.activeFormCategory === "indel" ? "Person " + count : "KMP " + count;
    const kmpPlaceholder = this.activeFormCategory === "indel" ? "Person name" : "KMP name";
    row.innerHTML = '<div class="form-group kmp-row-group"><label class="form-label">' + kmpLabel + '</label><div class="kmp-input-wrap"><input class="form-input kmp-input" type="text" placeholder="' + kmpPlaceholder + '"><button class="btn-remove-kmp" type="button" onclick="app.removeKmpRow(this)" title="Remove">&times;</button></div></div>';
    container.appendChild(row);
  }

  removeKmpRow(btn) {
    const row = btn.closest(".kmp-row");
    if (row) row.remove();
  }

  addDirectorRow() {
    const container = document.getElementById("directorRows");
    const count = container.querySelectorAll(".kmp-row").length + 1;
    const row = document.createElement("div");
    row.className = "kmp-row form-grid single";
    const dirLabel = this.activeFormCategory === "indel" ? "Director " + count : "Director/Partner " + count;
    const dirPlaceholder = this.activeFormCategory === "indel" ? "Director name" : "Director/Partner name";
    row.innerHTML = '<div class="form-group kmp-row-group"><label class="form-label">' + dirLabel + '</label><div class="kmp-input-wrap"><input class="form-input director-input" type="text" placeholder="' + dirPlaceholder + '"><button class="btn-remove-kmp" type="button" onclick="app.removeDirectorRow(this)" title="Remove">&times;</button></div></div>';
    container.appendChild(row);
  }

  removeDirectorRow(btn) {
    const row = btn.closest(".kmp-row");
    if (row) row.remove();
  }

  addOfficialRow() {
    const container = document.getElementById("officialRows");
    const count = container.querySelectorAll(".kmp-row").length + 1;
    const row = document.createElement("div");
    row.className = "kmp-row form-grid single";
    const offLabel = this.activeFormCategory === "indel" ? "Official " + count : "Official " + count;
    const offPlaceholder = this.activeFormCategory === "indel" ? "Authorised official name" : "Official name";
    row.innerHTML = '<div class="form-group kmp-row-group"><label class="form-label">' + offLabel + '</label><div class="kmp-input-wrap"><input class="form-input official-input" type="text" placeholder="' + offPlaceholder + '"><button class="btn-remove-kmp" type="button" onclick="app.removeOfficialRow(this)" title="Remove">&times;</button></div></div>';
    container.appendChild(row);
  }

  removeOfficialRow(btn) {
    const row = btn.closest(".kmp-row");
    if (row) row.remove();
  }

  addBoRow() {
    const container = document.getElementById("boRows");
    const count = container.querySelectorAll(".bo-row").length + 1;
    const row = document.createElement("div");
    row.className = "bo-row";
    row.style.cssText = "display:grid;grid-template-columns:1fr 140px 1fr 120px 36px;gap:8px;margin-bottom:8px;align-items:end";
    row.innerHTML = '<div class="form-group" style="margin-bottom:0"><label class="form-label">Name</label><input class="form-input bo-name" type="text" placeholder="Person name"></div><div class="form-group" style="margin-bottom:0"><label class="form-label">DOB</label><input class="form-input bo-dob" type="text" placeholder="DD/MM/YYYY"></div><div class="form-group" style="margin-bottom:0"><label class="form-label">PAN Number</label><input class="form-input bo-pan" type="text" placeholder="PAN" maxlength="10" style="text-transform:uppercase"></div><div class="form-group" style="margin-bottom:0"><label class="form-label">Share %</label><input class="form-input bo-share" type="text" placeholder="e.g., 50%"></div><div style="display:flex;align-items:center;height:38px"><button class="btn-remove-kmp" type="button" onclick="app.removeBoRow(this)" title="Remove">&times;</button></div>';
    container.appendChild(row);
  }

  removeBoRow(btn) {
    const row = btn.closest(".bo-row");
    if (row) row.remove();
  }

  getBeneficialOwners() {
    const rows = document.querySelectorAll("#boRows .bo-row");
    const owners = [];
    rows.forEach(row => {
      const name = row.querySelector(".bo-name")?.value?.trim();
      const dob = row.querySelector(".bo-dob")?.value?.trim();
      const pan = row.querySelector(".bo-pan")?.value?.trim();
      const share = row.querySelector(".bo-share")?.value?.trim();
      if (name) owners.push({ name, dob: dob || "", pan: pan || "", sharePercent: share || "" });
    });
    return owners;
  }

  autoFillBeneficialOwners(d, personNames, desig) {
    const boContainer = document.getElementById("boRows");
    if (!boContainer) return;
    const names = personNames.length > 0 ? personNames : (d.ownerName ? [d.ownerName] : (d.panHolderName ? [d.panHolderName] : []));
    if (names.length === 0) return;
    const personPans = d.gstPersonPans || [];
    const personDobs = d.personDobs || (d.panDob ? [d.panDob] : (d.globalDob ? [d.globalDob] : []));
    const entityPan = d.panNumber || "";
    const shareEach = names.length === 1 ? "100%" : Math.round(100 / names.length) + "%";
    const fillRow = (row, idx) => {
      if (!row) return;
      const nameInput = row.querySelector(".bo-name");
      const dobInput = row.querySelector(".bo-dob");
      const panInput = row.querySelector(".bo-pan");
      const shareInput = row.querySelector(".bo-share");
      if (nameInput) { nameInput.value = names[idx]; nameInput.classList.add("auto-filled"); }
      if (dobInput && personDobs[idx]) { dobInput.value = personDobs[idx]; dobInput.classList.add("auto-filled"); }
      if (panInput) { panInput.value = personPans[idx] || entityPan; panInput.classList.add("auto-filled"); }
      if (shareInput) { shareInput.value = shareEach; shareInput.classList.add("auto-filled"); }
    };
    fillRow(boContainer.querySelector(".bo-row"), 0);
    for (let i = 1; i < names.length; i++) {
      this.addBoRow();
      const rows = boContainer.querySelectorAll(".bo-row");
      fillRow(rows[rows.length - 1], i);
    }
  }

  getDirectorNames() {
    const inputs = document.querySelectorAll("#directorRows .director-input");
    return Array.from(inputs).map(i => i.value.trim()).filter(Boolean);
  }

  getOfficialNames() {
    const inputs = document.querySelectorAll("#officialRows .official-input");
    return Array.from(inputs).map(i => i.value.trim()).filter(Boolean);
  }

  detectDesignation(d, companyName) {
    if (d.aiDesignation) return d.aiDesignation;
    if (d.gstPersonDesignations && d.gstPersonDesignations.length > 0) return d.gstPersonDesignations[0];
    if (d.udyamDesignation) return d.udyamDesignation;
    if (d.gstDirectors) return "Director";
    if (d.gstPartners) return "Partner";
    if (d.gstConstitution) {
      const c = d.gstConstitution.toLowerCase();
      if (c.includes("partnership") || c.includes("llp")) return "Partner";
      if (c.includes("proprietor")) return "Proprietor";
      if (c.includes("company") || c.includes("limited")) return "Director";
    }
    if (d.enterpriseType === "Micro" || d.enterpriseType === "Small") return "Proprietor";
    const name = (companyName || "").toLowerCase();
    if (/\bllp\b|partnership/.test(name)) return "Partner";
    if (/\bpvt\b|limited|company/.test(name)) return "Director";
    if (d.enterpriseType) return "Proprietor";
    return "Director";
  }

  detectLegalStatus(d, companyName) {
    if (d.gstConstitution) {
      const c = d.gstConstitution.toLowerCase();
      if (c.includes("limited liability partnership") || c.includes("llp")) return "LLP";
      if (c.includes("private") && c.includes("limited")) return "Private Limited Company";
      if (c.includes("limited") && !c.includes("private")) return "Public Limited Company";
      if (c.includes("partnership")) return "Partnership";
      if (c.includes("proprietor")) return "Proprietor";
      if (c.includes("trust")) return "Trust";
      if (c.includes("society")) return "Society";
      if (c.includes("huf")) return "HUF";
    }
    const name = (companyName || "").toLowerCase();
    if (d.enterpriseType === "Micro" || d.enterpriseType === "Small") return "Proprietor";
    if (/\bprivate\s*limited\b/i.test(name) || /\bpvt\b/i.test(name)) return "Private Limited Company";
    if (/\blimited\s*liability\s*partnership\b/i.test(name) || /\bllp\b/i.test(name)) return "LLP";
    if (/\blimited\b/i.test(name) && !/private/i.test(name)) return "Public Limited Company";
    if (/\bpartnership\b/i.test(name)) return "Partnership";
    if (/\btrust\b/i.test(name)) return "Trust";
    if (/\bsociety\b/i.test(name)) return "Society";
    if (/\bhuf\b/i.test(name)) return "HUF";
    if (d.enterpriseType) return "Proprietor";
    return "";
  }

  buildAddress(d) {
    const parts = [];
    if (d.premises) parts.push(d.premises);
    if (d.road) parts.push(d.road);
    if (d.city) parts.push(d.city);
    if (d.district && d.district !== d.city) parts.push(d.district);
    if (d.state) parts.push(d.state);
    if (d.pin) parts.push("- " + d.pin);
    if (parts.length >= 2) return parts.join(", ");
    if (d.bankAddress) return d.bankAddress;
    if (d.gstAddress) return d.gstAddress;
    if (d.genericAddress) return d.genericAddress;
    return "";
  }

  selectRadio(groupId, value) {
    const group = document.getElementById(groupId);
    if (!group) return;
    group.querySelectorAll(".radio-item").forEach(item => {
      if (item.dataset.value === value) {
        item.classList.add("selected");
        const input = item.querySelector("input");
        if (input) input.checked = true;
      } else {
        item.classList.remove("selected");
      }
    });
  }

  selectCheckbox(groupId, values) {
    const group = document.getElementById(groupId);
    if (!group || !values || values.length === 0) return;
    group.querySelectorAll(".checkbox-item").forEach(item => {
      if (values.includes(item.dataset.value)) {
        item.classList.add("checked");
        const input = item.querySelector("input");
        if (input) input.checked = true;
      }
    });
  }

  updateAccuracy() {
    const isHiddenByToggle = (el) => {
      let node = el;
      while (node && node !== document.body) {
        if (node.style && node.style.display === "none" && !node.classList.contains("form-section")) return true;
        node = node.parentElement;
      }
      return false;
    };
    const naValues = new Set(["na", "n/a", "nil", "none", "-", "—", "null", "not available", "not applicable"]);
    const isRealValue = (v) => { const t = v.trim().toLowerCase(); return t.length > 0 && !naValues.has(t); };
    const allInputs = document.querySelectorAll(".form-input, .form-textarea");
    let filled = 0, total = 0;
    allInputs.forEach(el => {
      if (el.id && el.id !== "stockExchangeName" && el.id !== "caseDetails" && !isHiddenByToggle(el)) {
        total++;
        if (isRealValue(el.value)) filled++;
      }
    });

    const radioGroups = document.querySelectorAll(".radio-group");
    radioGroups.forEach(g => {
      if (isHiddenByToggle(g)) return;
      total++;
      if (g.querySelector(".radio-item.selected")) filled++;
    });

    const checkboxGroups = document.querySelectorAll(".checkbox-group");
    checkboxGroups.forEach(g => {
      if (isHiddenByToggle(g)) return;
      total++;
      if (g.querySelector(".checkbox-item.checked")) filled++;
    });

    this.totalFields = total;
    const accuracy = total > 0 ? Math.round((filled / total) * 100) : 0;

    const card = document.getElementById("accuracyCard");
    card.style.display = "block";

    document.getElementById("accuracyValue").textContent = accuracy + "%";
    document.getElementById("accuracyFill").style.width = accuracy + "%";

    const summary = document.getElementById("extractionSummary");
    const sources = {};
    this.uploadedFiles.filter(f => f.status === "success").forEach(f => {
      sources[f.docType] = f.fieldsExtracted || 0;
    });

    const remaining = total - filled;

    const stepNames = { "1": "Company Details", "2": "Contact & KMP", "3": "Banking & Compliance" };
    const stepIcons = { "1": "&#127970;", "2": "&#128100;", "3": "&#127974;" };

    const getFieldLabel = (el) => {
      const subCard = el.closest(".sub-card");
      const sectionTitle = subCard?.querySelector(".sub-card-title, .sub-card-header")?.textContent?.replace(/\*/g, "").trim() || "";
      let lbl = el.closest(".form-group")?.querySelector(".form-label")?.textContent?.replace(/\*/g, "").replace(/\d+\.\s*/g, "").trim() || "";
      if (!lbl || lbl.length < 3) lbl = el.placeholder || el.id.replace(/([A-Z])/g, " $1").trim();
      if (sectionTitle && sectionTitle !== lbl) lbl = sectionTitle + " → " + lbl;
      return lbl;
    };
    const getStepNum = (el) => el.closest(".form-section")?.dataset?.section || "0";

    const stepStats = {};
    const emptyFieldNames = [];
    allInputs.forEach(el => {
      if (el.id && el.id !== "stockExchangeName" && el.id !== "caseDetails" && !isHiddenByToggle(el)) {
        const step = getStepNum(el);
        if (!stepStats[step]) stepStats[step] = { filled: 0, empty: 0, emptyFields: [] };
        if (isRealValue(el.value)) { stepStats[step].filled++; }
        else {
          stepStats[step].empty++;
          const field = { label: getFieldLabel(el), id: el.id, step, currentValue: el.value.trim() };
          stepStats[step].emptyFields.push(field);
          emptyFieldNames.push(field);
        }
      }
    });
    radioGroups.forEach(g => {
      if (isHiddenByToggle(g)) return;
      const step = getStepNum(g);
      if (!stepStats[step]) stepStats[step] = { filled: 0, empty: 0, emptyFields: [] };
      if (g.querySelector(".radio-item.selected")) { stepStats[step].filled++; }
      else {
        stepStats[step].empty++;
        const subCard = g.closest(".sub-card");
        const sectionTitle = subCard?.querySelector(".sub-card-title, .sub-card-header")?.textContent?.replace(/\*/g, "").trim() || "";
        let lbl = g.closest(".form-group")?.querySelector(".form-label")?.textContent?.replace(/\*/g, "").replace(/\d+\.\s*/g, "").trim() || "Selection";
        if (sectionTitle && sectionTitle !== lbl) lbl = sectionTitle + " → " + lbl;
        const field = { label: lbl, id: "", step };
        stepStats[step].emptyFields.push(field);
        emptyFieldNames.push(field);
      }
    });
    checkboxGroups.forEach(g => {
      if (isHiddenByToggle(g)) return;
      const step = getStepNum(g);
      if (!stepStats[step]) stepStats[step] = { filled: 0, empty: 0, emptyFields: [] };
      if (g.querySelector(".checkbox-item.checked")) stepStats[step].filled++;
      else stepStats[step].empty++;
    });

    const fieldDocMap = [
      { doc: "PAN Card", reason: "PAN number is printed on PAN Card issued by Income Tax Dept", keywords: ["pan"], icon: "&#128179;" },
      { doc: "GST Certificate", reason: "GSTIN is on GST Registration Certificate from GST portal", keywords: ["gstin", "gst number", "gst"], icon: "&#128196;" },
      { doc: "Udyam / MSME Certificate", reason: "Udyam number, business details are on Udyam Registration Certificate", keywords: ["udyam", "msme", "nature of business", "nic"], icon: "&#127981;" },
      { doc: "Certificate of Incorporation / MOA", reason: "CIN, date of incorporation, directors listed on CoI issued by MCA", keywords: ["incorporation", "cin", "director"], icon: "&#128220;" },
      { doc: "Bank Statement / Cancelled Cheque", reason: "Bank name, A/C no, IFSC, branch printed on bank statement or cancelled cheque", keywords: ["bank", "ifsc", "branch", "account no"], icon: "&#127974;" },
      { doc: "Invoice / Proforma Invoice", reason: "Amount, currency, beneficiary, SWIFT/IBAN are on the vendor/travel invoice", keywords: ["invoice", "currency", "amount", "beneficiary", "swift", "iban", "destination", "travel", "pax", "txn"], icon: "&#128451;" },
      { doc: "Company Letterhead / Profile", reason: "Website, email, phone are on company letterhead or website", keywords: ["website", "email", "mobile", "phone", "contact"], icon: "&#127760;" },
      { doc: "Board Resolution", reason: "Authorized signatory details are in the Board Resolution document", keywords: ["official", "signatory", "authorized"], icon: "&#128221;" },
      { doc: "Shareholder Agreement / MOA", reason: "Beneficial owner name, DOB, PAN, shareholding % found in MOA or Shareholder Agreement", keywords: ["beneficial", "shareholder", "bo", "share %", "share"], icon: "&#128101;" },
      { doc: "RBI Compliance / Company Policy", reason: "Annual FX estimate, forex requirements are based on company treasury policy or RBI filings", keywords: ["annual", "foreign exchange", "forex", "fx"], icon: "&#128176;" },
      { doc: "Company Registration / Letterhead", reason: "Company name, trade name, registered address are on registration documents", keywords: ["registered", "company name", "trade name", "legal name"], icon: "&#127970;" },
      { doc: "Address Proof / Utility Bill", reason: "City, state, pin code found on address proof, utility bill, or registration certificate", keywords: ["city", "state", "pin", "address"], icon: "&#128205;" },
      { doc: "MCA Portal / Certificate of Incorporation", reason: "Date of incorporation, CIN, constitution type found on MCA records", keywords: ["date of incorporation", "constitution", "cin"], icon: "&#128197;" },
      { doc: "Director's PAN / KYC", reason: "Director/partner personal details (name, DOB, PAN) from their individual KYC", keywords: ["dob", "date of birth", "director name"], icon: "&#128100;" }
    ];

    const uploadedDocTypes = this.uploadedFiles.filter(f => f.status === "success").map(f => (f.docType || "").replace(" + AI", "").toLowerCase());

    const enrichField = (f) => {
      const key = " " + (f.label + " " + (f.id || "").replace(/([a-z])([A-Z])/g, "$1 $2")).toLowerCase().replace(/[→/.,_-]/g, " ") + " ";
      let matched = null;
      for (const entry of fieldDocMap) {
        if (entry.keywords.some(kw => key.includes(" " + kw) || key.includes(kw + " "))) { matched = entry; break; }
      }
      const isUploaded = matched ? uploadedDocTypes.some(d => matched.doc.toLowerCase().split("/").some(part => d.includes(part.trim().split(" ")[0].toLowerCase()))) : false;
      return { ...f,
        doc: matched?.doc || "Manual Entry",
        reason: matched?.reason || "Fill manually — not typically found in uploaded documents",
        icon: matched?.icon || "&#9997;",
        status: !matched ? "manual" : (isUploaded ? "not-found" : "missing-doc")
      };
    };

    const hasUploads = this.uploadedFiles.some(f => f.status === "success");

    let stepOverviewHtml = "";
    if (hasUploads) {
      const category = this.activeFormCategory || "cifl";
      const catLabel = document.querySelector("#formCategory")?.selectedOptions?.[0]?.text || category.toUpperCase();
      const isTxn = ["ciflFit", "ciflMice", "indelFit", "indelMice"].includes(category);
      const catDocs = {
        cifl: [
          { name: "PAN Card", desc: "Company PAN for KYC verification", required: true },
          { name: "GST Certificate", desc: "GSTIN, legal/trade name, constitution", required: true },
          { name: "Udyam / MSME Certificate", desc: "Udyam number, business nature, NIC code", required: false },
          { name: "Bank Statement / Cancelled Cheque", desc: "Bank name, account, IFSC, branch", required: true },
          { name: "Certificate of Incorporation", desc: "CIN, directors, date of incorporation", required: false },
          { name: "Shareholder Agreement / MOA", desc: "Beneficial owner details, shareholding %", required: true }
        ],
        indel: [
          { name: "PAN Card", desc: "Company PAN", required: true },
          { name: "GST Certificate", desc: "GSTIN, legal name, constitution", required: true },
          { name: "Bank Statement", desc: "Bank details for settlement", required: true },
          { name: "Udyam / MSME Certificate", desc: "Business details & registration", required: false }
        ]
      };
      if (isTxn) {
        const txnDocs = [
          { name: "Invoice / Proforma Invoice", desc: "Amount, currency, beneficiary, travel dates", required: true },
          { name: "Form A2 (auto-generated)", desc: "Generated from form data", required: false }
        ];
        (catDocs[category.startsWith("cifl") ? "cifl" : "indel"] || []).forEach(d => txnDocs.unshift(d));
        catDocs[category] = txnDocs;
      }
      const requiredDocs = catDocs[category] || catDocs[category.startsWith("indel") ? "indel" : "cifl"] || [];
      const uploadedLower = uploadedDocTypes.join(" ");

      let docChecklistHtml = "";
      if (requiredDocs.length > 0) {
        docChecklistHtml = `<div style="margin-bottom:10px;padding:10px;background:linear-gradient(135deg,#f0f9ff,#ede9fe);border-radius:8px;border:1px solid #c7d2fe">
          <div style="font-size:0.76rem;font-weight:700;color:var(--gray-800);margin-bottom:6px">&#128203; Required Documents for ${catLabel}:</div>
          ${requiredDocs.map(d => {
            const uploaded = uploadedLower.split(" ").some(u => d.name.toLowerCase().split("/").some(p => u.includes(p.trim().split(" ")[0].toLowerCase())));
            return `<div style="display:flex;align-items:start;gap:6px;padding:3px 0;font-size:0.72rem">
              <span style="color:${uploaded ? 'var(--success)' : 'var(--gray-400)'};font-size:0.85rem;line-height:1">${uploaded ? '&#10004;' : '&#9744;'}</span>
              <span style="flex:1"><strong style="color:${uploaded ? 'var(--success)' : 'var(--gray-700)'}">${d.name}</strong>${d.required ? '<span style="color:var(--danger);font-size:0.6rem;margin-left:3px">REQUIRED</span>' : ''}<br><span style="color:var(--gray-500);font-size:0.68rem">${d.desc}</span></span>
            </div>`;
          }).join("")}
        </div>`;
      }

      stepOverviewHtml = `<div style="margin-top:10px;border-top:1px solid var(--border);padding-top:10px">
        <div style="font-size:0.82rem;font-weight:700;color:var(--gray-800);margin-bottom:4px;display:flex;align-items:center;gap:5px">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.5"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>
          Form Audit — ${catLabel}
        </div>
        <div style="font-size:0.7rem;color:var(--text-secondary);margin-bottom:8px">${remaining === 0 ? "All fields complete!" : `${remaining} field${remaining > 1 ? "s" : ""} need attention across ${Object.keys(stepStats).filter(s => (stepStats[s]?.empty || 0) > 0 && s !== "0").length} section${Object.keys(stepStats).filter(s => (stepStats[s]?.empty || 0) > 0 && s !== "0").length > 1 ? "s" : ""}`}</div>
        ${docChecklistHtml}`;

      for (const stepKey of ["1", "2", "3"]) {
        const st = stepStats[stepKey];
        if (!st) continue;
        const stepTotal = st.filled + st.empty;
        const pct = stepTotal > 0 ? Math.round((st.filled / stepTotal) * 100) : 100;
        const barColor = pct === 100 ? "var(--success)" : (pct >= 70 ? "var(--warning)" : "var(--danger)");
        const statusIcon = pct === 100 ? "&#10004;" : (pct >= 70 ? "&#9888;" : "&#10060;");

        stepOverviewHtml += `
          <div style="margin-bottom:${st.empty > 0 ? '2' : '8'}px;padding:8px 10px;background:var(--bg);border:1px solid var(--border);border-radius:8px">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
              <span style="font-size:0.9rem">${stepIcons[stepKey] || ""}</span>
              <strong style="font-size:0.78rem;color:var(--gray-800);flex:1">Step ${stepKey}: ${stepNames[stepKey]}</strong>
              <span style="font-size:0.7rem;color:${barColor};font-weight:700">${statusIcon} ${pct}%</span>
            </div>
            <div style="height:4px;background:var(--gray-200);border-radius:2px;overflow:hidden;margin-bottom:4px">
              <div style="height:100%;width:${pct}%;background:${barColor};border-radius:2px;transition:width 0.3s"></div>
            </div>
            <div style="font-size:0.68rem;color:var(--text-secondary)">${st.filled}/${stepTotal} filled${st.empty > 0 ? ` — <span style="color:var(--danger);font-weight:600">${st.empty} missing</span>` : ""}</div>
          </div>`;

        if (st.empty > 0 && st.emptyFields.length > 0) {
          st.emptyFields.forEach(f => {
            const ef = enrichField(f);
            const colors = { "missing-doc": { bg: "#dbeafe", border: "#93c5fd", text: "#1e40af", badge: "#2563eb", badgeText: "Upload needed" },
              "not-found": { bg: "#fef3c7", border: "#fcd34d", text: "#92400e", badge: "#d97706", badgeText: "Not in uploaded doc" },
              "manual": { bg: "#f3f4f6", border: "#d1d5db", text: "#4b5563", badge: "#6b7280", badgeText: "Fill manually" } };
            const c = colors[ef.status];
            stepOverviewHtml += `
              <div style="margin:0 0 4px 12px;padding:6px 8px;background:${c.bg};border-left:3px solid ${c.border};border-radius:0 6px 6px 0">
                <div style="display:flex;align-items:center;gap:5px;margin-bottom:2px">
                  <span style="font-size:0.85rem">${ef.icon}</span>
                  <strong style="font-size:0.74rem;color:${c.text};flex:1">${ef.label}</strong>
                  <span style="font-size:0.58rem;background:${c.badge};color:white;padding:1px 5px;border-radius:8px;white-space:nowrap">${c.badgeText}</span>
                </div>
                ${f.currentValue ? `<div style="font-size:0.65rem;color:var(--danger);margin-bottom:2px">Current value: "${f.currentValue}" — needs real data</div>` : ""}
                <div style="font-size:0.68rem;color:var(--gray-500)">${ef.reason}</div>
                ${ef.status !== "manual" ? `<div style="font-size:0.68rem;color:${c.text};font-weight:600;margin-top:2px">&#128206; ${ef.doc}</div>` : ""}
              </div>`;
          });
          stepOverviewHtml += `<div style="height:6px"></div>`;
        }
      }

      const docsNeeded = {};
      emptyFieldNames.forEach(f => {
        const ef = enrichField(f);
        if (ef.status !== "manual") {
          if (!docsNeeded[ef.doc]) docsNeeded[ef.doc] = { count: 0, icon: ef.icon };
          docsNeeded[ef.doc].count++;
        }
      });
      const docEntries = Object.entries(docsNeeded).sort((a, b) => b[1].count - a[1].count);
      if (docEntries.length > 0) {
        stepOverviewHtml += `
          <div style="margin-top:4px;padding:8px;background:var(--primary-light);border-radius:8px;border:1px solid #93c5fd">
            <div style="font-size:0.75rem;font-weight:700;color:var(--primary-dark);margin-bottom:5px">&#128203; Documents to Upload</div>
            ${docEntries.map(([doc, info]) => `<div style="font-size:0.72rem;color:var(--primary-dark);padding:2px 0;display:flex;align-items:center;gap:4px">
              <span>${info.icon}</span> <strong>${doc}</strong> <span style="color:var(--gray-500)">→ fills ${info.count} field${info.count > 1 ? "s" : ""}</span>
            </div>`).join("")}
          </div>`;
      }

      if (remaining === 0) {
        stepOverviewHtml += `
          <div style="margin-top:8px;padding:10px;background:#d1fae5;border-radius:8px;text-align:center;border:1px solid #6ee7b7">
            <div style="font-size:1.5rem;margin-bottom:2px">&#10004;</div>
            <strong style="font-size:0.82rem;color:#065f46">All Fields Complete!</strong>
            <div style="font-size:0.72rem;color:#047857;margin-top:2px">Your documents covered all ${total} fields. Ready for preview & download.</div>
          </div>`;
      }

      stepOverviewHtml += `</div>`;
    }

    summary.innerHTML = `
      <div class="extraction-item"><span class="extraction-label">Total Fields</span><span class="extraction-count">${total}</span></div>
      <div class="extraction-item"><span class="extraction-label">Auto-filled</span><span class="extraction-count" style="color:var(--success)">${filled}</span></div>
      <div class="extraction-item"><span class="extraction-label">Remaining</span><span class="extraction-count" style="color:${remaining === 0 ? 'var(--success)' : 'var(--warning)'}">${remaining}</span></div>
      ${Object.entries(sources).map(([k, v]) => `<div class="extraction-item"><span class="extraction-label">${k}</span><span class="extraction-count">${v} fields</span></div>`).join("")}
      ${stepOverviewHtml}
    `;

    const badge = document.getElementById("companyFieldCount");
    if (badge) badge.textContent = filled;

    const reBtn = document.getElementById("reAnalyzeWrap");
    if (reBtn) reBtn.style.display = (this.geminiKey && remaining > 0 && this.uploadedFiles.some(f => f.status === "success")) ? "" : "none";
  }

  async reAnalyzeWithAi() {
    if (!this.geminiKey) { this.showToast("Set your Gemini API key in Settings first", "error"); return; }
    const btn = document.querySelector("#reAnalyzeWrap button");
    if (btn) { btn.disabled = true; btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Analyzing...'; }
    try {
      const prevAcc = this.getAccuracyPercent();
      this.cleanExtractedData();
      this.applySmartDerivations();
      if (this.allExtractedTexts.length > 0) await this.smartReExtract();
      this.validateExtractedFields();
      this.updateAccuracy();
      const newAcc = this.getAccuracyPercent();
      const boost = newAcc - prevAcc;
      if (this.geminiKey) this.analyzeGapsWithGemini();
      this.showToast(`AI re-analysis complete: ${newAcc}%${boost > 0 ? " (+" + boost + "%)" : ""}`, "success");
    } catch (e) {
      this.showToast("Re-analysis failed: " + e.message, "error");
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg> Re-analyze with AI'; }
    }
  }

  renderUploadedFiles() {
    const container = document.getElementById("uploadedFiles");
    container.innerHTML = this.uploadedFiles.map(f => `
      <div class="file-item ${f.status}">
        <div class="file-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        </div>
        <div class="file-info">
          <div class="file-name">${f.name}</div>
          <div class="file-status">
            ${f.status === "processing" ? "Extracting data..." : ""}
            ${f.status === "success" ? `${f.docType} - ${f.fieldsExtracted} fields extracted` : ""}
            ${f.status === "error" ? "Failed to process" : ""}
          </div>
        </div>
        <button class="file-remove" onclick="app.removeFile('${f.id}')" title="Remove">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    `).join("");
  }

  removeFile(id) {
    this.uploadedFiles = this.uploadedFiles.filter(f => f.id !== id);
    this.renderUploadedFiles();
    if (this.uploadedFiles.length === 0) {
      document.getElementById("accuracyCard").style.display = "none";
    }
  }

  showStep(step) {
    this.currentStep = step;
    document.querySelectorAll(".form-section").forEach(s => s.classList.remove("active"));
    const target = document.querySelector(`.form-section[data-section="${step}"]`);
    if (target) target.classList.add("active");

    document.querySelectorAll(".step-item").forEach((s, i) => {
      s.classList.remove("active", "completed");
      if (i === step) s.classList.add("active");
      else if (i < step) s.classList.add("completed");
    });

    document.querySelectorAll(".step-connector").forEach((c, i) => {
      c.classList.toggle("completed", i < step);
    });

    const catBar = document.getElementById("formCategoryBar");
    if (catBar) catBar.style.display = step > 0 ? "flex" : "none";
    if (step === 4) this.renderPreview();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  goToStep(step) {
    if (step >= 0 && step < this.totalSteps) this.showStep(step);
  }

  nextStep() {
    if (this.currentStep < this.totalSteps - 1) this.showStep(this.currentStep + 1);
  }

  prevStep() {
    if (this.currentStep > 0) this.showStep(this.currentStep - 1);
  }

  getFormValue(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  getKmpNames() {
    const inputs = document.querySelectorAll("#kmpRows .kmp-input");
    return Array.from(inputs).map(i => i.value.trim()).filter(Boolean);
  }

  getRadioValue(groupId) {
    const group = document.getElementById(groupId);
    if (!group) return "";
    const selected = group.querySelector(".radio-item.selected");
    return selected ? selected.dataset.value : "";
  }

  getCheckedValues(groupId) {
    const group = document.getElementById(groupId);
    if (!group) return [];
    return Array.from(group.querySelectorAll(".checkbox-item.checked")).map(c => c.dataset.value);
  }

  renderPreview() {
    const cat = this.activeFormCategory || "cifl";
    const firstDocMap = {
      cifl: "onboarding", indel: "indelOnboarding",
      ciflFit: "ciflFitA2", ciflMice: "ciflMiceA2",
      indelFit: "indelFitA2", indelMice: "indelMiceA2"
    };
    const firstDoc = firstDocMap[cat] || "onboarding";
    this.activeDocPreview = firstDoc;
    this.switchDocPreview(firstDoc);
  }

  switchFormCategory(category) {
    this.activeFormCategory = category;
    const mainSel = document.getElementById("formCategoryMain");
    const previewSel = document.getElementById("formCategorySelect");
    if (mainSel) mainSel.value = category;
    if (previewSel) previewSel.value = category;
    document.querySelectorAll(".doc-tab").forEach(t => {
      t.style.display = t.dataset.category === category ? "" : "none";
      t.classList.remove("active");
    });
    const firstDocMap = {
      cifl: "onboarding", indel: "indelOnboarding",
      ciflFit: "ciflFitA2", ciflMice: "ciflMiceA2",
      indelFit: "indelFitA2", indelMice: "indelMiceA2"
    };
    const firstDoc = firstDocMap[category] || "onboarding";
    this.switchDocPreview(firstDoc);
    const labelCat = category.startsWith("indel") ? "indel" : "cifl";
    this.applyFormLabels(labelCat);
    const isTxn = category.startsWith("ciflFit") || category.startsWith("ciflMice") || category.startsWith("indelFit") || category.startsWith("indelMice");
    this.toggleTransactionFields(isTxn);
    this.updateAccuracy();
  }

  toggleTransactionFields(isTxn) {
    const hideGroup = (id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const group = el.closest(".form-group");
      if (group) group.style.display = isTxn ? "none" : "";
    };
    const hideSubCard = (id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const card = el.closest(".sub-card");
      if (card) card.style.display = isTxn ? "none" : "";
    };

    hideGroup("legalStatusGroup");
    hideGroup("principalPlace");
    hideGroup("dateOfIncorporation");
    hideGroup("natureOfBusiness");
    hideGroup("stockExchangeGroup");
    const stockName = document.getElementById("stockExchangeName");
    if (stockName) stockName.style.display = isTxn ? "none" : "";
    hideGroup("companyWebsite");
    hideGroup("udyamNumber");
    hideGroup("sharesPercent");
    hideGroup("productsGroup");
    hideGroup("annualFx");

    hideSubCard("kmpName");
    hideSubCard("ceoName");
    hideSubCard("mdName");
    hideSubCard("directorName1");
    hideSubCard("officialName1");

    hideSubCard("bankName");
    const caseGroup = document.getElementById("caseRegisteredGroup");
    if (caseGroup) {
      const card = caseGroup.closest(".sub-card");
      if (card) card.style.display = isTxn ? "none" : "";
    }

    const step1Header = document.querySelector('[data-section="1"] .card-header');
    const step2Header = document.querySelector('[data-section="2"] .card-header');
    const step3Header = document.querySelector('[data-section="3"] .card-header');
    const setText = (el, text) => {
      if (!el) return;
      for (const node of el.childNodes) {
        if (node.nodeType === 3 && node.textContent.trim().length > 0) {
          node.textContent = text + " ";
          return;
        }
      }
    };
    if (isTxn) {
      setText(step1Header, "Transaction - Company Details");
      const sectionTitle = document.querySelector('[data-section="1"] .section-title');
      const sectionDesc = document.querySelector('[data-section="1"] .section-desc');
      if (sectionTitle) sectionTitle.textContent = "Company Information for Transaction Documents";
      if (sectionDesc) sectionDesc.textContent = "Only the fields required for transaction forms are shown. Review the auto-filled data from your uploaded documents.";
      setText(step2Header, "Contact & Signatory");
      setText(step3Header, "Authorized Signatory");
    } else {
      const sectionTitle = document.querySelector('[data-section="1"] .section-title');
      const sectionDesc = document.querySelector('[data-section="1"] .section-desc');
      if (sectionTitle) sectionTitle.textContent = "Registered Company Information";
      if (sectionDesc) sectionDesc.textContent = "All fields auto-filled from your uploaded documents. Review and edit if needed.";
    }

    const txnCard = document.getElementById("txnFieldsCard");
    if (txnCard) txnCard.style.display = isTxn ? "" : "none";
  }

  applyFormLabels(category) {
    const isIndel = category === "indel";
    const setText = (el, text) => {
      if (!el) return;
      for (const node of el.childNodes) {
        if (node.nodeType === 3 && node.textContent.trim().length > 0) {
          node.textContent = text + " ";
          return;
        }
      }
    };
    const fieldLabel = (id) => document.getElementById(id)?.closest(".form-group")?.querySelector(".form-label");
    const subCardTitle = (id) => document.getElementById(id)?.closest(".sub-card")?.querySelector(".sub-card-title");
    const groupLabel = (id) => document.getElementById(id)?.closest(".form-group")?.querySelector(".form-label");

    const step1Header = document.querySelector('[data-section="1"] .card-header');
    setText(step1Header, isIndel ? "Corporate Entity Details" : "Company Details");
    setText(fieldLabel("registeredName"), isIndel ? "1. Name of Corporate Entity" : "1. Registered Name");
    setText(fieldLabel("registeredAddress"), isIndel ? "2. Registered Address" : "2. Registered Office Address");
    setText(fieldLabel("principalPlace"), isIndel ? "3. Location of Head Office" : "3. Principal Place of Business");
    setText(fieldLabel("panNo"), isIndel ? "5. PAN of the Entity" : "5. PAN No");
    setText(fieldLabel("natureOfBusiness"), isIndel ? "6. Nature of Business / Type of Activity" : "6. Nature of Business");
    setText(groupLabel("stockExchangeGroup"), isIndel ? "7. Location of Branches" : "7. Listed on Stock Exchange?");
    setText(fieldLabel("companyWebsite"), isIndel ? "8. Website ID, If Any" : "8. Company Website");
    const productsLabel = document.getElementById("productsGroup")?.closest(".form-group")?.querySelector(".form-label");
    setText(productsLabel, isIndel ? "9. Products Offered / Nature of Services" : "9. Products to be Availed");
    setText(fieldLabel("annualFx"), isIndel ? "10. Annual Estimated Foreign Exchange Turnover" : "10. Annual Estimated Foreign Exchange Required (INR)");

    const stockGroup = document.getElementById("stockExchangeGroup");
    const stockNameInput = document.getElementById("stockExchangeName");
    if (stockGroup && stockNameInput) {
      if (isIndel) {
        stockGroup.style.display = "none";
        stockNameInput.style.display = "";
        stockNameInput.placeholder = "Location of branches in India/abroad";
      } else {
        stockGroup.style.display = "";
        const checked = stockGroup.querySelector('input[name="stockExchange"]:checked');
        stockNameInput.style.display = checked && checked.value === "Yes" ? "" : "none";
        stockNameInput.placeholder = "Name of stock exchange(s)";
      }
    }

    const step2Header = document.querySelector('[data-section="2"] .card-header');
    setText(step2Header, isIndel ? "Contact Details & Key Personnel" : "Contact Details & Key Managerial Persons");
    setText(subCardTitle("contactName"), isIndel ? "11. Contact / Authorized Person" : "11. Contact Person / Coordinator");
    setText(subCardTitle("kmpName"), isIndel ? "12. Natural Persons Controlling the Entity" : "12. Key Managerial Person (KMP)");
    setText(fieldLabel("kmpName"), isIndel ? "Name of natural person" : "Name of KMP who controls business activities");
    setText(subCardTitle("ceoName"), isIndel ? "13. Name of Chief Executive Officer" : "13. Chief Executive Officer");
    setText(subCardTitle("mdName"), isIndel ? "14. Name of Managing Director" : "14. Managing Director / Partner / Trustee");
    setText(subCardTitle("directorName1"), isIndel ? "15. Names of Other Directors" : "15. Directors / Partners");
    setText(fieldLabel("directorName1"), isIndel ? "Director name" : "Name (as per MCA)");
    setText(subCardTitle("officialName1"), isIndel ? "16. Officials Authorised to Transact FX" : "16. Authorized Officials for FX Transactions");
    setText(fieldLabel("officialName1"), isIndel ? "Name of authorised official" : "Name of authorized official");

    setText(subCardTitle("bankName"), isIndel ? "17. Names of Bankers" : "17. Banking Details");
  }

  switchDocPreview(docId) {
    this.activeDocPreview = docId;
    document.querySelectorAll(".doc-tab").forEach(t => t.classList.toggle("active", t.dataset.doc === docId));
    const pdfBtn = document.getElementById("btnDownloadPdf");
    const isTxn = docId.startsWith("ciflFit") || docId.startsWith("ciflMice") || docId.startsWith("indelFit") || docId.startsWith("indelMice");
    if (pdfBtn) pdfBtn.style.display = (docId.startsWith("indel") || isTxn) ? "none" : "";
    const previewEl = document.getElementById("previewContent");
    const renderers = {
      onboarding: () => this.renderOnboardingPreview(),
      authSignatory: () => this.renderAuthSignatoryPreview(),
      beneficialOwnership: () => this.renderBeneficialOwnershipPreview(),
      corporateProfile: () => this.renderCorporateProfilePreview(),
      mou: () => this.renderMouPreview(),
      indelOnboarding: () => this.renderIndelOnboardingPreview(),
      indelAuthSignatory: () => this.renderIndelAuthSignatoryPreview(),
      indelBeneficialOwnership: () => this.renderIndelBeneficialOwnershipPreview(),
      indelFieldVerification: () => this.renderIndelFieldVerificationPreview(),
      indelMou: () => this.renderIndelMouPreview(),
      ciflFitA2: () => this.renderCiflFitA2Preview(),
      ciflFitTcs: () => this.renderCiflFitTcsPreview(),
      ciflFitFlight: () => this.renderCiflFitFlightPreview(),
      ciflFitVisa: () => this.renderCiflFitVisaPreview(),
      ciflFitCountry: () => this.renderCiflFitCountryPreview(),
      ciflMiceA2: () => this.renderCiflMiceA2Preview(),
      ciflMiceTcs: () => this.renderCiflMiceTcsPreview(),
      ciflMiceCu: () => this.renderCiflMiceCuPreview(),
      ciflMiceTa: () => this.renderCiflMiceTaPreview(),
      indelFitA2: () => this.renderIndelFitA2Preview(),
      indelFitPassenger: () => this.renderIndelFitPassengerPreview(),
      indelFitTcs: () => this.renderIndelFitTcsPreview(),
      indelMiceA2: () => this.renderIndelMiceA2Preview(),
      indelMiceTcs: () => this.renderIndelMiceTcsPreview(),
    };
    previewEl.innerHTML = renderers[docId] ? renderers[docId]() : "<p>No preview available</p>";
  }

  downloadCurrentPdf() {
    const map = {
      onboarding: () => this.downloadPdf(),
      authSignatory: () => this.downloadAuthSignatoryPdf(),
      beneficialOwnership: () => this.downloadBeneficialOwnershipPdf(),
      corporateProfile: () => this.downloadCorporateProfilePdf(),
      mou: () => this.downloadMouPdf(),
    };
    if (map[this.activeDocPreview]) map[this.activeDocPreview]();
  }

  downloadCurrentDocx() {
    const type = this.activeDocPreview;
    this.downloadTemplateDocx(type);
  }

  async downloadTemplateDocx(type) {
    const templateMap = {
      onboarding: "templates/onboarding.docx",
      authSignatory: "templates/auth-signatory.docx",
      beneficialOwnership: "templates/beneficial-ownership.docx",
      corporateProfile: "templates/corporate-profile.docx",
      mou: "templates/mou.docx",
      indelOnboarding: "templates/indel-onboarding.docx",
      indelAuthSignatory: "templates/indel-auth-signatory.docx",
      indelBeneficialOwnership: "templates/indel-beneficial-ownership.docx",
      indelFieldVerification: "templates/indel-field-verification.docx",
      indelMou: "templates/indel-mou.docx",
      ciflFitA2: "templates/cifl-fit-a2.docx",
      ciflFitTcs: "templates/cifl-fit-tcs.docx",
      ciflFitFlight: "templates/cifl-fit-flight-decl.docx",
      ciflFitVisa: "templates/cifl-fit-visa-decl.docx",
      ciflFitCountry: "templates/cifl-fit-country-decl.docx",
      ciflMiceA2: "templates/cifl-mice-a2.docx",
      ciflMiceTcs: "templates/cifl-mice-tcs.docx",
      ciflMiceCu: "templates/cifl-mice-cu.docx",
      ciflMiceTa: "templates/cifl-mice-ta.docx",
      indelFitA2: "templates/indel-fit-a2.docx",
      indelFitPassenger: "templates/indel-fit-passenger.docx",
      indelFitTcs: "templates/indel-fit-tcs.docx",
      indelMiceA2: "templates/indel-mice-a2.docx",
      indelMiceTcs: "templates/indel-mice-tcs.docx",
    };
    const filenameMap = {
      onboarding: "Client_Onboarding_Form",
      authSignatory: "Authorised_Signatory_Letter",
      beneficialOwnership: "Beneficial_Ownership",
      corporateProfile: "Corporate_Profile",
      mou: "Tour_Operator_MOU",
      indelOnboarding: "Indel_Corporate_Onboarding",
      indelAuthSignatory: "Indel_Auth_Signatory",
      indelBeneficialOwnership: "Indel_Beneficial_Ownership",
      indelFieldVerification: "Indel_Field_Verification",
      indelMou: "Indel_MOU",
      ciflFitA2: "CIFL_FIT_Form_A2",
      ciflFitTcs: "CIFL_FIT_TCS_Declaration",
      ciflFitFlight: "CIFL_FIT_Flight_Declaration",
      ciflFitVisa: "CIFL_FIT_Visa_Declaration",
      ciflFitCountry: "CIFL_FIT_Country_Declaration",
      ciflMiceA2: "CIFL_MICE_Form_A2",
      ciflMiceTcs: "CIFL_MICE_TCS_Declaration",
      ciflMiceCu: "CIFL_MICE_Corporate_Undertaking",
      ciflMiceTa: "CIFL_MICE_TA_Undertaking",
      indelFitA2: "Indel_FIT_Form_A2",
      indelFitPassenger: "Indel_FIT_Passenger_Details",
      indelFitTcs: "Indel_FIT_TCS_Declaration",
      indelMiceA2: "Indel_MICE_Form_A2",
      indelMiceTcs: "Indel_MICE_TCS_Declaration",
    };

    this.showLoading("Generating DOCX from template...");
    try {
      const engine = new DocxTemplateEngine();
      await engine.loadTemplate(templateMap[type]);
      let xml = await engine.getDocumentXml();

      const v = (id) => this.getFormValue(id) || "NA";
      const today = new Date().toLocaleDateString("en-IN");
      const companyName = this.getFormValue("registeredName") || "NA";
      const sigName = this.getFormValue("signatoryName") || this.getFormValue("kmpName") || "NA";
      const sigDesig = this.getFormValue("signatoryDesignation") || this.getFormValue("contactDesignation") || "NA";
      const contactName = this.getFormValue("contactName") || sigName;
      const legalStatus = this.getRadioValue("legalStatusGroup") || "NA";
      const products = this.getCheckedValues("productsGroup");
      const productStr = products.length > 0 ? products.join(", ") : "NA";
      const directors = typeof this.getDirectorNames === "function" ? this.getDirectorNames() : [];
      const officials = typeof this.getOfficialNames === "function" ? this.getOfficialNames() : [];
      const kmpNames = this.getKmpNames();
      const stockListed = this.getRadioValue("stockExchangeGroup") || "No";
      const caseReg = this.getRadioValue("caseRegisteredGroup") || "No";

      if (type === "onboarding") {
        xml = engine.fillByLabel(xml, "Registered Name", companyName);
        xml = engine.fillByLabelFull(xml, "Legal Status", legalStatus);
        xml = engine.fillByLabel(xml, "Registered Office Address", v("registeredAddress"));
        xml = engine.fillByLabel(xml, "Principal Place of Undertaking", this.getFormValue("principalPlace") || v("registeredAddress"));
        xml = engine.fillByLabel(xml, "Date of Incorporation", v("dateOfIncorporation"));
        xml = engine.fillByLabel(xml, "PAN no", v("panNo"));
        xml = engine.fillByLabel(xml, "Nature of business", v("natureOfBusiness"));
        xml = engine.fillByLabel(xml, "Whether listed on recognized stock", stockListed === "Yes" ? "Yes - " + v("stockExchangeName") : "No");
        xml = engine.fillByLabel(xml, "Company Website", this.getFormValue("companyWebsite") || "NA");
        xml = engine.fillByLabelFull(xml, "Products to be availed", productStr);
        xml = engine.fillByLabel(xml, "Annual estimated Foreign Exchange", this.getFormValue("annualFx") || "NA");
        xml = engine.fillByLabelMulti(xml, "Contact Person Name", {
          "Name": contactName,
          "Designation": this.getFormValue("contactDesignation") || "NA",
          "Mobile No": this.getFormValue("contactMobile") || "NA",
          "Email ID": this.getFormValue("contactEmail") || "NA"
        });
        xml = engine.fillByLabel(xml, "Key Managerial Person", kmpNames.length > 0 ? kmpNames.join(", ") : "NA");
        xml = engine.fillByLabelMulti(xml, "Chief Executive Officer", {
          "Name": v("ceoName"),
          "Mobile No": this.getFormValue("ceoMobile") || "NA",
          "Email ID": this.getFormValue("ceoEmail") || "NA"
        });
        xml = engine.fillByLabelMulti(xml, "Managing Director", {
          "Name": v("mdName"),
          "Mobile No": this.getFormValue("mdMobile") || "NA",
          "Email ID": this.getFormValue("mdEmail") || "NA"
        });
        xml = engine.fillByLabel(xml, "Name of Directors", directors.length > 0 ? directors.join(", ") : "NA");
        xml = engine.fillByLabel(xml, "Names of officials who are authorized", officials.length > 0 ? officials.join(", ") : "NA");
        xml = engine.fillByLabel(xml, "Names of bankers", v("bankName"));
        xml = engine.fillByLabelFull(xml, "Confirm whether any case", caseReg === "Yes" ? "Yes - " + v("caseDetails") : "No");
        xml = xml.replace(/>Date:\s*<\/w:t>/i, ">Date: " + engine.escXml(today) + "</w:t>");
        xml = xml.replace(/>Name\s{2,}<\/w:t>/i, ">Name: " + engine.escXml(sigName) + "</w:t>");
        xml = xml.replace(/>Designation:\s*<\/w:t>/i, ">Designation: " + engine.escXml(sigDesig) + "</w:t>");
      }

      else if (type === "authSignatory") {
        const legalEntity = this.getFormValue("legalEntityName") || companyName;
        xml = xml.replace(/_{10,}/, engine.escXml(legalEntity));
        xml = xml.replace(/>Date:-<\/w:t>/, ">Date: " + engine.escXml(today) + "</w:t>");
        const authPersons = officials.length > 0 ? officials : (directors.length > 0 ? directors : [contactName]);
        if (authPersons[0]) {
          xml = engine.fillTableCell(xml, 1, 1, authPersons[0]);
          xml = engine.fillTableCell(xml, 1, 2, sigDesig);
        }
        if (authPersons.length > 1) {
          xml = engine.fillTableCell(xml, 2, 1, authPersons[1]);
          xml = engine.fillTableCell(xml, 2, 2, sigDesig);
        }
        xml = xml.replace(/For\s+_{5,}/, "For " + engine.escXml(companyName));
        xml = xml.replace(/>Name:<\/w:t>/, ">Name: " + engine.escXml(sigName) + "</w:t>");
        xml = xml.replace(/>Designation\s*<\/w:t>/i, ">Designation: " + engine.escXml(sigDesig) + "</w:t>");
        xml = xml.replace(/>\s*\(\s*Director\s*\/\s*CFO\s*\/?\s*Company\s*Secreto?r?y?\s*\)\s*<\/w:t>/i, "></w:t>");
        xml = xml.replace(/>\s*1\.\s*<\/w:t>/i, ">1. Aadhaar Card</w:t>");
        xml = xml.replace(/>\s*2\.\s*<\/w:t>/i, ">2. PAN Card</w:t>");
      }

      else if (type === "beneficialOwnership") {
        xml = xml.replace(/>Date:\s*<\/w:t>/i, ">Date: " + engine.escXml(today) + "</w:t>");
        const boOwners = this.getBeneficialOwners();
        const boFallbackNames = directors.length > 0 ? directors : [contactName];
        const boData = boOwners.length > 0 ? boOwners : boFallbackNames.map(name => ({ name, pan: v("panNo"), sharePercent: this.getFormValue("sharesPercent") || (boFallbackNames.length === 1 ? "100%" : Math.round(100 / boFallbackNames.length) + "%") }));
        xml = xml.replace(/_{5,}(\s*authorized|\s*<\/w:t>[\s\S]*?authorized)/i, engine.escXml(sigName) + "$1");
        xml = xml.replace(/M\/s\s*_{5,}/i, "M/s " + engine.escXml(companyName));
        xml = xml.replace(/registered office at\s*_{5,}/i, "registered office at " + engine.escXml(v("registeredAddress")));
        boData.forEach((p, i) => {
          if (i < 3) {
            xml = engine.fillTableCell(xml, i + 1, 1, p.name);
            xml = engine.fillTableCell(xml, i + 1, 2, sigDesig);
            xml = engine.fillTableCell(xml, i + 1, 3, p.sharePercent);
            xml = engine.fillTableCell(xml, i + 1, 4, p.pan);
          }
        });
        let msM;
        while ((msM = xml.match(/M\/s\s*_{3,}/))) { xml = xml.replace(msM[0], "M/s " + engine.escXml(companyName)); }
        xml = xml.replace(/>Name:\s*<\/w:t>/i, ">Name: " + engine.escXml(sigName) + "</w:t>");
        xml = xml.replace(/>Designation:\s*<\/w:t>/i, ">Designation: " + engine.escXml(sigDesig) + "</w:t>");
        xml = xml.replace(/>Director\s*\/\s*Company\s*Secretary\s*<\/w:t>/i, "></w:t>");
      }

      else if (type === "corporateProfile") {
        xml = engine.fillByLabel(xml, "Name of corporate entity", companyName);
        xml = engine.fillByLabel(xml, "Registered Office address", v("registeredAddress"));
        xml = engine.fillByLabel(xml, "Principal Place of Undertaking", this.getFormValue("principalPlace") || v("registeredAddress"));
        xml = engine.fillByLabel(xml, "Date of Incorporation", v("dateOfIncorporation"));
        xml = engine.fillByLabel(xml, "PAN of the entity", v("panNo"));
        xml = engine.fillByLabel(xml, "Nature of business", v("natureOfBusiness"));
        xml = engine.fillByLabel(xml, "Products offered by the entity", productStr);
        xml = engine.fillByLabel(xml, "Location of branches", v("registeredAddress"));
        xml = engine.fillByLabel(xml, "Information about clients", v("natureOfBusiness") + ", " + v("registeredAddress"));
        xml = engine.fillByLabel(xml, "Whether listed on recognized stock", stockListed === "Yes" ? "Yes" : "No");
        xml = engine.fillByLabel(xml, "Ownership and control structure", legalStatus + " - " + (this.getFormValue("legalEntityName") || companyName));
        xml = engine.fillByLabel(xml, "Names of natural persons controlling", kmpNames.length > 0 ? kmpNames.join(", ") : contactName);
        xml = engine.fillByLabel(xml, "Purpose and intended nature", "Foreign Exchange Transactions");
        xml = engine.fillByLabel(xml, "Name of Chairman", kmpNames.length > 0 ? kmpNames[0] : contactName);
        xml = engine.fillByLabel(xml, "Name of Managing Director", v("mdName"));
        xml = engine.fillByLabel(xml, "Name of Chief Executive Officer", v("ceoName"));
        xml = engine.fillByLabel(xml, "Names of another directors", directors.length > 0 ? directors.join(", ") : "NA");
        xml = engine.fillByLabel(xml, "Names of relevant person holding senior", kmpNames.length > 0 ? kmpNames.join(", ") : "NA");
        xml = engine.fillByLabel(xml, "Names of officials who are authorized", officials.length > 0 ? officials.join(", ") : "NA");
        xml = engine.fillByLabel(xml, "Names of bankers", v("bankName"));
        xml = engine.fillByLabel(xml, "Annual estimated foreign exchange", this.getFormValue("annualFx") || "NA");
        xml = xml.replace(/>Date:\s*<\/w:t>/i, ">Date: " + engine.escXml(today) + "</w:t>");
        xml = xml.replace(/>Name\s{2,}<\/w:t>/i, ">Name: " + engine.escXml(sigName) + "</w:t>");
        xml = xml.replace(/>Designation:\s*<\/w:t>/i, ">Designation: " + engine.escXml(sigDesig) + "</w:t>");
      }

      else if (type === "mou") {
        xml = engine.replaceText(xml, "[Company Name]", companyName);
        xml = engine.replaceText(xml, "[ Company registered Address]", v("registeredAddress"));
        xml = xml.replace(/<w:r><w:rPr>[^<]*<w:u\s[^/]*\/>[^<]*<\/w:rPr><w:tab\/><\/w:r>/g, "");
        xml = xml.replace(/<w:u w:val="thick"\/>/g, "");
        xml = xml.replace(/<w:r><w:rPr>[^<]*<\/w:rPr>(<w:tab\/>){2,}<\/w:r>/g, "");
        xml = xml.replace(/<w:r><w:rPr>[^<]*<\/w:rPr>(<w:tab\/>\s*)+<w:t[^>]*>\s*<\/w:t><\/w:r>/g, "");
        xml = xml.replace(/<w:t[^>]*>[\s_]*_{3,}[\s_]*<\/w:t>/g, "<w:t></w:t>");
        xml = xml.replace(/_{3,}/g, "");
        let nameCount = 0;
        xml = xml.replace(/>Name:\s*<\/w:t>/gi, (m) => {
          nameCount++;
          return nameCount === 2 ? ">Name: " + engine.escXml(sigName) + "</w:t>" : m;
        });
        let desigCount = 0;
        xml = xml.replace(/>Designation:\s*<\/w:t>/gi, (m) => {
          desigCount++;
          return desigCount === 2 ? ">Designation: " + engine.escXml(sigDesig) + "</w:t>" : m;
        });
      }

      else if (type === "indelOnboarding") {
        xml = engine.fillByLabel(xml, "Name of corporate entity", companyName);
        xml = engine.fillByLabel(xml, "Registered address", v("registeredAddress"));
        xml = engine.fillByLabel(xml, "Location of Head Office", this.getFormValue("principalPlace") || v("registeredAddress"));
        xml = engine.fillByLabel(xml, "Date of Incorporation", v("dateOfIncorporation"));
        xml = engine.fillByLabel(xml, "PAN of the entity", v("panNo"));
        xml = engine.fillByLabel(xml, "Nature of business", v("natureOfBusiness"));
        xml = engine.fillByLabel(xml, "Products offered by the entity", productStr);
        xml = engine.fillByLabel(xml, "Location of branches", v("registeredAddress"));
        xml = engine.fillByLabel(xml, "Names of natural persons controlling", kmpNames.length > 0 ? kmpNames.join(", ") : contactName);
        xml = engine.fillByLabel(xml, "Purpose and intended nature", "Foreign Exchange Transactions");
        xml = engine.fillByLabel(xml, "Name of Chairman", kmpNames.length > 0 ? kmpNames[0] : contactName);
        xml = engine.fillByLabel(xml, "Name of Managing Director", v("mdName"));
        xml = engine.fillByLabel(xml, "Name of Chief Executive Officer", v("ceoName"));
        xml = engine.fillByLabel(xml, "Names of other directors", directors.length > 0 ? directors.join(", ") : "NA");
        xml = engine.fillByLabel(xml, "Names of officials", officials.length > 0 ? officials.join(", ") : sigName);
        xml = engine.fillByLabel(xml, "Names of bankers", v("bankName"));
        xml = engine.fillByLabel(xml, "Annual estimated foreign exchange", this.getFormValue("annualFx") || "NA");
        xml = xml.replace(/>Name\s+:\s*<\/w:t>/i, ">Name: " + engine.escXml(sigName) + "</w:t>");
        xml = xml.replace(/>Designation:\s*<\/w:t>/i, ">Designation: " + engine.escXml(sigDesig) + "</w:t>");
        xml = xml.replace(/>Date:\s*<\/w:t>/i, ">Date: " + engine.escXml(today) + "</w:t>");
      }

      else if (type === "indelAuthSignatory") {
        xml = engine.replaceText(xml, "Travel Safe Travel India", companyName);
        xml = xml.replace(
          /<w:r>(<w:rPr>[\s\S]*?<\/w:rPr>)<w:t[^>]*>11<\/w:t><\/w:r>\s*<w:r><w:rPr>[\s\S]*?<w:vertAlign[\s\S]*?<\/w:rPr><w:t[^>]*>TH<\/w:t><\/w:r>\s*<w:r><w:rPr>[\s\S]*?<\/w:rPr><w:t[^>]*>\s*September\s+2025<\/w:t><\/w:r>/i,
          '<w:r>$1<w:t xml:space="preserve">' + engine.escXml(today) + '</w:t></w:r>'
        );
        const authPersons = officials.length > 0 ? officials : (directors.length > 0 ? directors : [contactName]);
        authPersons.forEach((name, i) => {
          if (i < 3) {
            xml = engine.fillTableCell(xml, i + 1, 1, name);
            xml = engine.fillTableCell(xml, i + 1, 2, sigDesig);
          }
        });
        xml = xml.replace(/>For<\/w:t>/, ">For " + engine.escXml(companyName) + "</w:t>");
        xml = xml.replace(/>Authorised persons name[^<]*<\/w:t>/i, ">Authorised persons name – " + engine.escXml(sigName) + "</w:t>");
        xml = xml.replace(/>Designation\s*-[^<]*<\/w:t>/i, ">Designation - " + engine.escXml(sigDesig) + "</w:t>");
        xml = xml.replace(/>Company name and seal[^<]*<\/w:t>/i, ">Company name and seal: " + engine.escXml(companyName) + "</w:t>");
      }

      else if (type === "indelBeneficialOwnership") {
        xml = xml.replace(/(>)…[…\s.]+Registered/i, "$1" + engine.escXml(companyName) + " Registered");
        xml = xml.replace(/(>)…[…\s.]+\(Wherever/i, "$1" + engine.escXml(v("cinNo")) + " (Wherever");
        xml = xml.replace(/(Address:[\s\S]{0,300}?>)…[…\s.]+(<\/w:t>)/i, "$1" + engine.escXml(v("registeredAddress")) + "$2");
        const indelBoOwners = this.getBeneficialOwners();
        const indelBoFallback = kmpNames.length > 0 ? kmpNames : [contactName];
        const indelBoData = indelBoOwners.length > 0 ? indelBoOwners : indelBoFallback.map(name => ({ name, pan: v("panNo"), sharePercent: this.getFormValue("sharesPercent") || (indelBoFallback.length === 1 ? "100%" : Math.round(100 / indelBoFallback.length) + "%") }));
        indelBoData.forEach((p, i) => {
          if (i < 3) {
            xml = engine.fillTableCell(xml, i + 2, 0, String(i + 1));
            xml = engine.fillTableCell(xml, i + 2, 1, p.name);
            xml = engine.fillTableCell(xml, i + 2, 2, p.dob || "");
            xml = engine.fillTableCell(xml, i + 2, 3, "Indian");
            xml = engine.fillTableCell(xml, i + 2, 4, v("registeredAddress"));
            xml = engine.fillTableCell(xml, i + 2, 5, "PAN: " + (p.pan || v("panNo")));
            xml = engine.fillTableCell(xml, i + 2, 7, p.sharePercent);
          }
        });
        xml = xml.replace(
          />…[…\s.]*Designation\s*\/\s*Position:\s*…[…\s.]*Date:\s*…[…\s.]*<\/w:t>/i,
          ">" + engine.escXml(sigName) + " Designation / Position: " + engine.escXml(sigDesig) + " Date: " + engine.escXml(today) + "</w:t>"
        );
        xml = xml.replace(/>Axis<\/w:t>/, ">Indel Money</w:t>");
        xml = xml.replace(/>Bank<\/w:t>/, ">Limited</w:t>");
      }

      else if (type === "indelFieldVerification") {
        xml = xml.replace(
          /(VENDOR[’']S NAME:\s*)…[…\s.]*(\s*ADDRESS:)/i,
          "$1" + engine.escXml(companyName) + " $2"
        );
        xml = xml.replace(
          /(>)…[…\s.]+(\s*Pan card No:)/i,
          "$1" + engine.escXml(v("registeredAddress")) + " $2"
        );
        xml = xml.replace(
          /(Pan card No:\s*)…[…\s.]+/i,
          "$1" + engine.escXml(v("panNo"))
        );
        const fvFields = [
          ["Contact\\/Authorized Person:", contactName],
          ["Office Contact No:", v("contactMobile")],
          ["E-Mail for Communication:", v("contactEmail")],
          ["Web Site ID, If any:", this.getFormValue("companyWebsite") || "NA"],
          ["Primary Business activities", v("natureOfBusiness")],
          ["Primary Bank name", v("bankName")],
        ];
        for (const [label, value] of fvFields) {
          const re = new RegExp(
            "(" + label + "[\\s\\S]{0,500}?<w:t[^>]*>)[\\u2026\\s.\"\\u201d]+(<\\/w:t>)", "i"
          );
          xml = xml.replace(re, "$1" + engine.escXml(value) + "$2");
        }
      }

      else if (type === "indelMou") {
        xml = engine.replaceText(xml, "[Company Name]", companyName);
        xml = engine.replaceText(xml, "[Company rgistered address]", v("registeredAddress"));
        xml = engine.replaceText(xml, "[Company registered address]", v("registeredAddress"));
        xml = engine.replaceText(xml, "LUXURY TRIPS", companyName);
        xml = xml.replace(/07\s+MAY\s+2025/i, engine.escXml(today));
        xml = xml.replace(
          /<w:t xml:space="preserve">\s{20,}<\/w:t>/,
          '<w:t xml:space="preserve">' + engine.escXml(companyName) + '</w:t>'
        );
        let indelNameCount = 0;
        xml = xml.replace(/>Name:\s*<\/w:t>/gi, (m) => {
          indelNameCount++;
          return indelNameCount === 2 ? ">Name: " + engine.escXml(sigName) + "</w:t>" : m;
        });
        xml = xml.replace(
          />Designatio<\/w:t><\/w:r>\s*<w:r>(?:<w:rPr>[\s\S]*?<\/w:rPr>)?<w:t[^>]*>n:<\/w:t><\/w:r>/,
          ">Designation: " + engine.escXml(sigDesig) + "</w:t></w:r>"
        );
      }

      else if (type === "ciflFitA2" || type === "ciflMiceA2") {
        xml = xml.replace(/>\s*Date\s*:\s*<\/w:t>/i, ">Date: " + engine.escXml(today) + "</w:t>");
        xml = xml.replace(/>Date\s*<\/w:t>/i, ">Date: " + engine.escXml(today) + "</w:t>");
        xml = engine.fillTableCell(xml, 0, 1, companyName);
        xml = engine.fillTableCell(xml, 1, 1, v("registeredAddress"));
        xml = engine.fillTableCell(xml, 2, 1, contactName + ", " + (this.getFormValue("contactMobile") || "") + ", " + (this.getFormValue("contactEmail") || ""));
        xml = xml.replace(/>For\s*<\/w:t>/i, ">For " + engine.escXml(companyName) + "</w:t>");
        xml = xml.replace(/>Authorised\s*Signatory\s*<\/w:t>/i, ">Authorised Signatory: " + engine.escXml(sigName) + "</w:t>");
      }

      else if (type === "ciflFitTcs" || type === "ciflMiceTcs") {
        xml = xml.replace(/>\s*Date\s*:\s*<\/w:t>/i, ">Date: " + engine.escXml(today) + "</w:t>");
        xml = xml.replace(/>Date\s*:\s*-?\s*<\/w:t>/i, ">Date: " + engine.escXml(today) + "</w:t>");
        xml = xml.replace(/>Date\s*<\/w:t>/i, ">Date: " + engine.escXml(today) + "</w:t>");
        xml = xml.replace(/>For:\s*<\/w:t>/i, ">For: " + engine.escXml(companyName) + "</w:t>");
        xml = xml.replace(/>For\s*<\/w:t>/i, ">For " + engine.escXml(companyName) + "</w:t>");
        xml = xml.replace(/>\(Authorized\s*Signatory\)\s*<\/w:t>/i, ">(Authorized Signatory): " + engine.escXml(sigName) + "</w:t>");
        xml = xml.replace(/>Authorized\s*Signatory\s*<\/w:t>/i, ">Authorized Signatory: " + engine.escXml(sigName) + "</w:t>");
      }

      else if (type === "ciflFitFlight") {
        xml = xml.replace(/>\s*Date\s*:\s*<\/w:t>/i, ">Date: " + engine.escXml(today) + "</w:t>");
        xml = xml.replace(/>Date\s*<\/w:t>/i, ">Date: " + engine.escXml(today) + "</w:t>");
        xml = xml.replace(/>For:\s*<\/w:t>/i, ">For: " + engine.escXml(companyName) + "</w:t>");
        xml = xml.replace(/>For\s*<\/w:t>/i, ">For " + engine.escXml(companyName) + "</w:t>");
        xml = xml.replace(/>Authorized\s*Signatory\s*<\/w:t>/i, ">Authorized Signatory: " + engine.escXml(sigName) + "</w:t>");
        xml = xml.replace(/>Name:\s*<\/w:t>/i, ">Name: " + engine.escXml(sigName) + "</w:t>");
        xml = xml.replace(/>Designation\s*<\/w:t>/i, ">Designation: " + engine.escXml(sigDesig) + "</w:t>");
      }

      else if (type === "ciflFitVisa") {
        xml = xml.replace(/>\s*Date\s*:\s*<\/w:t>/i, ">Date: " + engine.escXml(today) + "</w:t>");
        xml = xml.replace(/>Date\s*<\/w:t>/i, ">Date: " + engine.escXml(today) + "</w:t>");
        xml = xml.replace(/>For:\s*<\/w:t>/i, ">For: " + engine.escXml(companyName) + "</w:t>");
        xml = xml.replace(/>For\s*<\/w:t>/i, ">For " + engine.escXml(companyName) + "</w:t>");
        xml = xml.replace(/>Authorized\s*Signatory\s*<\/w:t>/i, ">Authorized Signatory: " + engine.escXml(sigName) + "</w:t>");
        xml = xml.replace(/>Name:\s*<\/w:t>/i, ">Name: " + engine.escXml(sigName) + "</w:t>");
        xml = xml.replace(/>Designation\s*<\/w:t>/i, ">Designation: " + engine.escXml(sigDesig) + "</w:t>");
      }

      else if (type === "ciflFitCountry") {
        xml = xml.replace(/>\s*Date\s*:\s*<\/w:t>/i, ">Date: " + engine.escXml(today) + "</w:t>");
        xml = xml.replace(/>Date\s*<\/w:t>/i, ">Date: " + engine.escXml(today) + "</w:t>");
        xml = xml.replace(/>TRAVEL\s+TOURS\s*<\/w:t>/i, ">" + engine.escXml(companyName) + "</w:t>");
        xml = xml.replace(/>INDIA\s*<\/w:t>/i, "></w:t>");
        xml = xml.replace(/>Authorised\s*Signatory\s*<\/w:t>/i, ">Authorised Signatory: " + engine.escXml(sigName) + "</w:t>");
      }

      else if (type === "ciflMiceCu") {
        xml = xml.replace(/>\s*Date\s*:\s*<\/w:t>/i, ">Date: " + engine.escXml(today) + "</w:t>");
        xml = xml.replace(/>Date\s*<\/w:t>/i, ">Date: " + engine.escXml(today) + "</w:t>");
        xml = engine.replaceText(xml, "[TA NAme]", companyName);
        xml = engine.replaceText(xml, "[TA Name]", companyName);
        xml = engine.replaceText(xml, "[Corporate Name]", companyName);
        xml = engine.replaceText(xml, "[CORPORATE NAME]", companyName);
        xml = xml.replace(/>For:\s*<\/w:t>/i, ">For: " + engine.escXml(companyName) + "</w:t>");
        xml = xml.replace(/>Authorized\s*Signatory\s*<\/w:t>/i, ">Authorized Signatory: " + engine.escXml(sigName) + "</w:t>");
        xml = xml.replace(/>Authorised\s*Signatory\s*<\/w:t>/i, ">Authorised Signatory: " + engine.escXml(sigName) + "</w:t>");
        xml = xml.replace(/>Name\s*<\/w:t>/i, ">Name: " + engine.escXml(sigName) + "</w:t>");
        xml = xml.replace(/>Name:\s*<\/w:t>/i, ">Name: " + engine.escXml(sigName) + "</w:t>");
        xml = xml.replace(/>Designation:\s*Director\s*<\/w:t>/i, ">Designation: " + engine.escXml(sigDesig) + "</w:t>");
        xml = xml.replace(/>Designation\s*:\s*<\/w:t>/i, ">Designation: " + engine.escXml(sigDesig) + "</w:t>");
      }

      else if (type === "ciflMiceTa") {
        xml = xml.replace(/>\s*Date\s*:\s*<\/w:t>/i, ">Date: " + engine.escXml(today) + "</w:t>");
        xml = xml.replace(/>Date\s*<\/w:t>/i, ">Date: " + engine.escXml(today) + "</w:t>");
        xml = engine.replaceText(xml, "[CORPORATE NAME]", companyName);
        xml = engine.replaceText(xml, "[TA Name]", companyName);
        xml = engine.replaceText(xml, "[TA NAme]", companyName);
        xml = engine.replaceText(xml, "[AMOUNT]", "");
        xml = xml.replace(/>pan card number:\s*<\/w:t>/i, ">pan card number: " + engine.escXml(v("panNo")) + "</w:t>");
        xml = xml.replace(/_{5,}/g, engine.escXml(v("panNo")));
        xml = xml.replace(/>For\s*<\/w:t>/i, ">For " + engine.escXml(companyName) + "</w:t>");
        xml = xml.replace(/>Authorized\s*Signatory\s*<\/w:t>/i, ">Authorized Signatory: " + engine.escXml(sigName) + "</w:t>");
        xml = xml.replace(/>Authorised\s*Signatory\s*<\/w:t>/i, ">Authorised Signatory: " + engine.escXml(sigName) + "</w:t>");
      }

      else if (type === "indelFitA2" || type === "indelMiceA2") {
        xml = xml.replace(/>\s*Date\s*:\s*<\/w:t>/i, ">Date: " + engine.escXml(today) + "</w:t>");
        xml = xml.replace(/>Date\s*<\/w:t>/i, ">Date: " + engine.escXml(today) + "</w:t>");
        xml = xml.replace(/02-04-2025/g, engine.escXml(today));
        xml = engine.fillTableCell(xml, 0, 1, companyName);
        xml = engine.fillTableCell(xml, 1, 1, v("registeredAddress"));
        xml = engine.fillTableCell(xml, 2, 1, contactName + ", " + (this.getFormValue("contactMobile") || "") + ", " + (this.getFormValue("contactEmail") || ""));
        if (type === "indelFitA2") {
          xml = engine.fillTableCell(xml, 3, 1, "TOUR");
        }
        xml = xml.replace(/>Authorized\s*Signature\s*<\/w:t>/i, ">Authorized Signature: " + engine.escXml(sigName) + "</w:t>");
        xml = xml.replace(/>Authorised\s*Signatory\s*<\/w:t>/i, ">Authorised Signatory: " + engine.escXml(sigName) + "</w:t>");
      }

      else if (type === "indelFitPassenger") {
        xml = xml.replace(/02-04-2025/g, engine.escXml(today));
        xml = xml.replace(/>\s*Date\s*:\s*<\/w:t>/i, ">Date: " + engine.escXml(today) + "</w:t>");
        xml = xml.replace(/>Date\s*<\/w:t>/i, ">Date: " + engine.escXml(today) + "</w:t>");
        const boData = this.getBeneficialOwners();
        boData.forEach((p, i) => {
          if (i < 6) {
            xml = engine.fillTableCell(xml, i + 1, 0, p.name);
            xml = engine.fillTableCell(xml, i + 1, 1, p.pan || v("panNo"));
            xml = engine.fillTableCell(xml, i + 1, 2, p.dob || "");
          }
        });
        xml = xml.replace(/>Authorized\s*Signatory\s*<\/w:t>/i, ">Authorized Signatory: " + engine.escXml(sigName) + "</w:t>");
        xml = xml.replace(/>Authorised\s*Signatory\s*<\/w:t>/i, ">Authorised Signatory: " + engine.escXml(sigName) + "</w:t>");
        xml = xml.replace(/_{10,}/g, "");
      }

      else if (type === "indelFitTcs" || type === "indelMiceTcs") {
        xml = xml.replace(/>\s*Date\s*:\s*<\/w:t>/i, ">Date: " + engine.escXml(today) + "</w:t>");
        xml = xml.replace(/>Date\s*<\/w:t>/i, ">Date: " + engine.escXml(today) + "</w:t>");
        xml = xml.replace(/0nd\s*April.?2025/gi, engine.escXml(today));
        xml = xml.replace(/>\(Authorized\s*Signatory\)\s*<\/w:t>/i, ">(Authorized Signatory): " + engine.escXml(sigName) + "</w:t>");
        xml = xml.replace(/>Authorized\s*Signatory\s*<\/w:t>/i, ">Authorized Signatory: " + engine.escXml(sigName) + "</w:t>");
        xml = xml.replace(/>For:\s*<\/w:t>/i, ">For: " + engine.escXml(companyName) + "</w:t>");
        xml = xml.replace(/>For\s*<\/w:t>/i, ">For " + engine.escXml(companyName) + "</w:t>");
        xml = xml.replace(/>For \(TA Name\)<\/w:t>/i, ">For " + engine.escXml(companyName) + "</w:t>");
        xml = xml.replace(/_{3,}/g, "");
      }

      await engine.setDocumentXml(xml);
      const company = companyName.replace(/[^A-Za-z0-9]/g, "_").substring(0, 30);
      await engine.download(`${filenameMap[type]}_${company}.docx`);
      this.hideLoading();
      this.showToast("DOCX downloaded successfully!", "success");
    } catch (e) {
      this.hideLoading();
      this.showToast("DOCX generation failed: " + e.message, "error");
      console.error(e);
    }
  }

  pRow(label, value) {
    const display = value ? `<strong>${value}</strong>` : `<span style="color:#999;font-style:italic">To be filled</span>`;
    return `<tr><td style="width:260px;font-weight:500;background:#f9f9f9">${label}</td><td>${display}</td></tr>`;
  }

  renderOnboardingPreview() {
    const products = this.getCheckedValues("productsGroup");
    const productStr = products.length > 0 ? products.join(", ") : "NA";
    const stockListed = this.getRadioValue("stockExchangeGroup");
    const stockDetail = stockListed === "Yes" ? "Yes - " + (this.getFormValue("stockExchangeName") || "") : "No";
    const caseReg = this.getRadioValue("caseRegisteredGroup");
    const caseDetail = caseReg === "Yes" ? "Yes - " + (this.getFormValue("caseDetails") || "") : "No";
    const v = (id) => this.getFormValue(id) || "NA";

    return `
      <div class="preview-container">
        <div class="preview-header">
          <h1>Client Onboarding Form</h1>
          <p>(Corporates &amp; Tour Operators)</p>
        </div>
        <table class="preview-table">
          <thead><tr><th style="width:40px">Sr. No.</th><td><strong>Particulars</strong></td><td><strong>Details</strong></td></tr></thead>
          <tbody>
            <tr><th>1</th><td>Registered Name</td><td><strong>${v("registeredName")}</strong></td></tr>
            <tr><th>2</th><td>Legal Status</td><td>${this.getRadioValue("legalStatusGroup") || "NA"}</td></tr>
            <tr><th>2</th><td>Registered Office Address</td><td>${v("registeredAddress")}</td></tr>
            <tr><th>3</th><td>Principal Place of Undertaking Business (if different from Registered Address)</td><td>${this.getFormValue("principalPlace") || v("registeredAddress")}</td></tr>
            <tr><th>4</th><td>Date of Incorporation</td><td>${v("dateOfIncorporation")}</td></tr>
            <tr><th>5</th><td>PAN no</td><td>${v("panNo")}</td></tr>
            <tr><th>6</th><td>Nature of business</td><td>${v("natureOfBusiness")}</td></tr>
            <tr><th>7</th><td>Whether listed on recognized stock exchange(s), if so, name(s) of the stock exchange(s)</td><td>${stockDetail}</td></tr>
            <tr><th>8</th><td>Company Website</td><td>${this.getFormValue("companyWebsite") || "NA"}</td></tr>
            <tr><th>9</th><td>Products to be availed</td><td>${productStr}</td></tr>
            <tr><th>10</th><td>Annual estimated Foreign Exchange required (in INR)</td><td>${this.getFormValue("annualFx") || "NA"}</td></tr>
            <tr><th>11</th><td>Contact Person Name, Mobile No and Email ID of coordinator</td><td>Name: ${v("contactName")}<br>Designation: ${v("contactDesignation")}<br>Mobile No: ${v("contactMobile")}<br>Email ID: ${v("contactEmail")}</td></tr>
            <tr><th>12</th><td>Name of the Key Managerial Person (KMP) who controls the business activities of the company</td><td>${this.getKmpNames().join(", ") || "NA"}</td></tr>
            <tr><th>13</th><td>Name, Contact No and Email ID of the Chief Executive Officer</td><td>Name: ${v("ceoName")}<br>Mobile No: ${this.getFormValue("ceoMobile") || "NA"}<br>Email ID: ${this.getFormValue("ceoEmail") || "NA"}</td></tr>
            <tr><th>14</th><td>Name, Contact No and Email ID of Managing Director / Partner / Trustee</td><td>Name: ${v("mdName")}<br>Mobile No: ${this.getFormValue("mdMobile") || "NA"}<br>Email ID: ${this.getFormValue("mdEmail") || "NA"}</td></tr>
            <tr><th>15</th><td>Name of Directors (should be as per MCA)/Partners</td><td style="white-space:pre-line">${this.getDirectorNames().join(", ") || "NA"}</td></tr>
            <tr><th>16</th><td>Names of officials who are authorized to transact foreign exchange business on behalf of the company (Customer identification documents to be furnished in respect of the officials named)</td><td style="white-space:pre-line">${this.getOfficialNames().join(", ") || "NA"}</td></tr>
            <tr><th>17</th><td>Names of bankers with whom the bank accounts are maintained</td><td>${v("bankName")}</td></tr>
            <tr><th>18</th><td>Confirm whether any case/complaint has been registered by regulatory/law enforcement authority against the company and or its directors or KMPs</td><td>${caseDetail}</td></tr>
          </tbody>
        </table>
        <div class="preview-declaration">
          <strong>Declaration</strong><br><br>
          We hereby certify and declare that all our transactions are Bonafide transactions and that we will abide by the prevailing RBI rules, regulations, directives and notifications.<br><br>
          We hereby indemnify CIFL and agree to keep it always indemnified against any claims, losses, damages, fines, penalties, cost, expenses, that may accrue or arise to CIFL because of our non-compliance to such regulatory requirements.<br><br>
          We irrevocably agree and undertake to provide additional details of any transactions if so desired by the CIFL or that may be required by any government/regulatory authority from time to time.<br><br>
          We hereby confirm and present that the person signing herein below has full authority to do so and execution hereof by him creates a legal, valid binding and enforceable obligation on us.
        </div>
        <div class="preview-signature">
          <div class="signature-block">
            <div style="height:60px"></div>
            <div class="signature-line">Authorized Signatory</div>
            <div>Name: <strong>${this.getFormValue("signatoryName") || ""}</strong></div>
            <div>Designation: ${this.getFormValue("signatoryDesignation") || ""}</div>
            <div style="margin-top:12px;font-size:0.85rem;color:#666">(Round Seal)</div>
          </div>
        </div>
      </div>`;
  }

  renderAuthSignatoryPreview() {
    const companyName = this.getFormValue("registeredName") || "NA";
    const sigName = this.getFormValue("signatoryName") || this.getFormValue("kmpName") || "NA";
    const sigDesig = this.getFormValue("signatoryDesignation") || this.getFormValue("contactDesignation") || "NA";
    const contactName = this.getFormValue("contactName") || sigName;
    const contactDesig = this.getFormValue("contactDesignation") || sigDesig;
    const officials = this.getOfficialNames();
    const authPersons = officials.length > 0 ? officials : (this.getDirectorNames().length > 0 ? this.getDirectorNames() : [contactName]);
    const today = this.todayFormatted();

    return `
      <div class="preview-container">
        <div class="preview-header">
          <p style="text-align:center;font-style:italic">(To be obtained on the Company/Firm's Letter Head)</p>
        </div>
        <p style="text-align:right"><strong>Date:</strong> ${today}</p>
        <p>The Manager<br>Capital India Finance Limited</p>
        <p><strong>Sub: Authority to Place Request / Authorized Signatory for Purchase / Sales of Foreign Exchange</strong></p>
        <p>Dear Sir,</p>
        <p>I/We, <strong>${this.getFormValue("legalEntityName") || companyName}</strong> (Legal entity name), (hereinafter referred to as "<strong>APPLICANT</strong>") have authorized the following person(s) as an authorized representative(s) of the APPLICANT to execute foreign exchange transactions with M/s Capital India Finance Limited (CIFL), from time to time, and to purchase Foreign Exchange for and on behalf of the APPLICANT against Cheque issued by the APPLICANT or against credit.</p>
        <p>We have specifically authorized the person(s) named herein below to sign request letter for purchase /surrender of foreign exchange for the employees of the APPLICANT travelling abroad for and on behalf of the APPLICANT.</p>
        <p>We hereby take the complete responsibility for any transaction undertaken by the said authorized representative(s) with CIFL.</p>
        <p><strong>The Signature of the authorized person(s)/representative(s) is attested below:</strong></p>
        <table class="preview-table">
          <thead><tr><th style="width:40px">Sr. No</th><td><strong>Name</strong></td><td><strong>Designation</strong></td><td><strong>Signature</strong></td></tr></thead>
          <tbody>
            <tr><th>1</th><td>${authPersons[0] || ""}</td><td>${contactDesig}</td><td style="height:40px"></td></tr>
            <tr><th>2</th><td>${authPersons[1] || ""}</td><td>${sigDesig}</td><td style="height:40px"></td></tr>
          </tbody>
        </table>
        <p style="margin-top:16px">This authority is irrevocable and binding on the APPLICANT as long as the APPLICANT continues to deal with CIFL for its Foreign Exchange requirements.</p>
        <p>Further the APPLICANT is responsible to make payment for the foreign exchange released to the APPLICANT and its employees by CIFL from time to time under the instructions of our aforesaid authorized representative(s).</p>
        <p>In the event, we wish to change our authorized representative(s) for any reason whatsoever, it shall be mandatory on our part to inform the same in writing to CIFL and such writing must be acknowledged by the authorized representative(s) of CIFL. However, we specifically admit that any transaction undertaken by our aforesaid authorized representative(s) with CIFL, prior to the receipt of our written communication intimating the aforesaid modification for change of the APPLICANT's 'authorized representative(s)' shall be binding on us.</p>
        <p>We further declare that the undersigned has the approval from Board to give this letter of authority on behalf of the APPLICANT.</p>
        <p>The identity proofs of the aforesaid authorized person(s) and for the undersigned are enclosed herewith.</p>
        <div class="preview-signature">
          <div class="signature-block">
            <div style="height:50px"></div>
            <div class="signature-line">For <strong>${companyName}</strong></div>
            <div>Signature</div>
            <div>Name: <strong>${sigName}</strong></div>
            <div>Designation: ${sigDesig}</div>
          </div>
        </div>
        <p style="margin-top:16px"><strong>Encl.:</strong> Officially valid documents of<br>1. Aadhaar Card<br>2. PAN Card</p>
      </div>`;
  }

  renderBeneficialOwnershipPreview() {
    const companyName = this.getFormValue("registeredName") || "NA";
    const address = this.getFormValue("registeredAddress") || "NA";
    const legalEntity = this.getFormValue("legalEntityName") || companyName;
    const sigName = this.getFormValue("signatoryName") || this.getFormValue("kmpName") || "NA";
    const sigDesig = this.getFormValue("signatoryDesignation") || "Director / Company Secretary";
    const directors = this.getDirectorNames();
    const contactName = this.getFormValue("contactName") || sigName;
    const boOwners = this.getBeneficialOwners();
    const boFallback = directors.length > 0 ? directors : [contactName];
    const boData = boOwners.length > 0 ? boOwners : boFallback.map(name => ({ name, pan: this.getFormValue("panNo") || "", sharePercent: this.getFormValue("sharesPercent") || (boFallback.length === 1 ? "100%" : Math.round(100 / boFallback.length) + "%") }));
    const today = this.todayFormatted();
    const boRows = [];
    for (let i = 0; i < Math.max(3, boData.length); i++) {
      const p = boData[i];
      boRows.push(`<tr><th>${i + 1}</th><td>${p ? p.name : ""}</td><td>${p ? (this.getFormValue("contactDesignation") || sigDesig) : ""}</td><td>${p ? p.sharePercent : ""}</td><td>${p ? p.pan : ""}</td></tr>`);
    }

    return `
      <div class="preview-container">
        <div class="preview-header">
          <h1>Annexure 3 - BO_ Limited &amp; Private Limited</h1>
        </div>
        <p style="text-align:right"><strong>Date:</strong> ${today}</p>
        <p>To,<br>The Manager<br>Capital India Finance Limited</p>
        <p>Dear Sir,</p>
        <p><strong style="text-decoration:underline">Sub: Beneficial Ownership Details</strong></p>
        <p>I, <strong>${sigName}</strong>, authorized signatory of M/s <strong>${companyName}</strong>, a company incorporated under the Companies Act, 1956 and having its registered office at <strong>${address}</strong>, hereby declare and state that the following natural person of our company holds more than 10% of the shares or capital or profits of the company which falls within the definition of Beneficial ownership as defined under PMLA, 2002.</p>
        <table class="preview-table">
          <thead><tr><th style="width:40px">Sr.No.</th><td><strong>Name and address of the natural person/s</strong></td><td><strong>Designation</strong></td><td><strong>Percentage of shares held</strong></td><td><strong>ID No (PAN/Aadhar/Driving License/Passport)</strong></td></tr></thead>
          <tbody>
            ${boRows.join("\n            ")}
          </tbody>
        </table>
        <p style="margin-top:8px"><strong>Website:</strong> ${this.getFormValue("companyWebsite") || "NA"}</p>
        <p style="margin-top:16px">I further declare, in case of changes in the beneficial ownership structure of the company, I hereby undertake to furnish the details to you.</p>
        <div class="preview-signature">
          <div class="signature-block">
            <div style="height:50px"></div>
            <div class="signature-line">For M/s <strong>${companyName}</strong></div>
            <div>Name: <strong>${sigName}</strong></div>
            <div>Designation: ${sigDesig}</div>
          </div>
        </div>
      </div>`;
  }

  renderCorporateProfilePreview() {
    const companyName = this.getFormValue("registeredName") || "NA";
    const legalEntity = this.getFormValue("legalEntityName") || companyName;
    const legalStatus = this.getRadioValue("legalStatusGroup") || "NA";
    const products = this.getCheckedValues("productsGroup");
    const productStr = products.length > 0 ? products.join(", ") : "NA";
    const stockExchange = this.getRadioValue("stockExchangeGroup") || "No";
    const sigName = this.getFormValue("signatoryName") || this.getFormValue("kmpName") || "NA";
    const sigDesig = this.getFormValue("signatoryDesignation") || legalStatus;
    const today = this.todayFormatted();
    const v = (id) => this.getFormValue(id) || "NA";
    const kmpNames = this.getKmpNames();
    const contactName = v("contactName");

    return `
      <div class="preview-container">
        <div class="preview-header">
          <h1>Annexure 2 - Corporate Profile</h1>
          <p>Customer Profile &ndash; Money Changing Activities<br>(For corporate, Goods &amp; Services &amp; Franchisee's)</p>
        </div>
        <p style="font-size:0.8rem;color:#666;margin-bottom:16px"><em>Note: Each supporting document has to be certified as "True Copy" by an authorized person indicating his name and designation.</em></p>
        <table class="preview-table">
          <thead><tr><th style="width:40px">Sr. No.</th><td><strong>KYC particulars</strong></td><td><strong>Details</strong></td></tr></thead>
          <tbody>
            <tr><th>1</th><td>Name of corporate entity</td><td><strong>${companyName}</strong></td></tr>
            <tr><th>2</th><td>Registered Office address</td><td>${v("registeredAddress")}</td></tr>
            <tr><th>3</th><td>Principal Place of Undertaking Business (if different from Registered Address)</td><td>${this.getFormValue("principalPlace") || v("registeredAddress")}</td></tr>
            <tr><th>4</th><td>Date of Incorporation</td><td>${v("dateOfIncorporation")}</td></tr>
            <tr><th>5</th><td>PAN of the entity</td><td>${v("panNo")}</td></tr>
            <tr><th>6</th><td>Nature of business / type of activity</td><td>${v("natureOfBusiness")}</td></tr>
            <tr><th>7</th><td>Products offered by the entity / nature of services provided</td><td>${productStr}</td></tr>
            <tr><th>8</th><td>Location of branches in India/abroad</td><td>${v("registeredAddress")}</td></tr>
            <tr><th>9</th><td>Information about clients' business and their locations</td><td>${v("natureOfBusiness") + ", " + v("registeredAddress")}</td></tr>
            <tr><th>10</th><td>Whether listed on recognized stock exchange(s), if so, name(s) of the stock exchange(s)</td><td>${stockExchange}</td></tr>
          </tbody>
        </table>
        <table class="preview-table" style="margin-top:16px">
          <tbody>
            ${this.pRow("Ownership and control structure", legalStatus + " - " + legalEntity)}
            ${this.pRow("Names of natural persons controlling the entity", kmpNames.length > 0 ? kmpNames.join(", ") : contactName)}
            ${this.pRow("Purpose and intended nature of the business relationship", "Foreign Exchange Transactions")}
          </tbody>
        </table>
        <h3 style="margin:20px 0 12px;font-size:1rem">Details of Key Personnel who comprise the Management</h3>
        <table class="preview-table">
          <tbody>
            ${this.pRow("Name of Chairman", kmpNames.length > 0 ? kmpNames[0] : contactName)}
            ${this.pRow("Name of Managing Director / Partner/Trustee", v("mdName"))}
            ${this.pRow("Name of Chief Executive Officer", v("ceoName"))}
            ${this.pRow("Names of another directors/partners/trustee's", this.getDirectorNames().join(", ") || "NA")}
            ${this.pRow("Names of relevant person holding senior management position and main business activities of the company", kmpNames.length > 0 ? kmpNames.join(", ") : "NA")}
            ${this.pRow("Names of officials who are authorized to transact foreign exchange business on behalf of the customer. (Customer identification documents to be furnished in respect of the officials named)", this.getOfficialNames().join(", ") || contactName)}
            ${this.pRow("Names of bankers with whom the bank accounts are maintained", v("bankName"))}
            ${this.pRow("Sources of funds", "Equity / Debt")}
            ${this.pRow("Annual estimated foreign exchange required", this.getFormValue("annualFx") || "NA")}
          </tbody>
        </table>
        <div class="preview-declaration">
          <strong>Certificate and Declaration</strong><br><br>
          We hereby certify and declare that all our transactions are bonafide transactions and that we will abide by the prevailing RBI rules, regulations, directives and notifications.
        </div>
        <div class="preview-signature">
          <div class="signature-block">
            <div style="height:50px"></div>
            <div class="signature-line">Authorized Signatory</div>
            <div>Name: <strong>${sigName}</strong></div>
            <div>Designation: ${sigDesig}</div>
            <div>Date: ${today}</div>
            <div style="margin-top:8px;font-size:0.85rem;color:#666">(Round Seal)</div>
          </div>
        </div>
        <p style="margin-top:16px;font-size:0.85rem"><strong>Documents (certified copies) attached:</strong><br>1. Certificate of Incorporation<br>2. Memorandum &amp; Articles of Association<br>3. Authorization letter signed by either CFO or Director</p>
      </div>`;
  }

  renderMouPreview() {
    const companyName = this.getFormValue("registeredName") || "[Company Name]";
    const address = this.getFormValue("registeredAddress") || "[ Company registered Address]";
    const sigName = this.getFormValue("signatoryName") || this.getFormValue("kmpName") || "";
    const sigDesig = this.getFormValue("signatoryDesignation") || "";
    const today = this.todayFormatted();

    return `
      <div class="preview-container">
        <div class="preview-header">
          <h1>MEMORANDUM OF UNDERSTANDING (MOU)</h1>
        </div>

        <p>This MOU is made on this <strong>${today}</strong> ("Effective Date") by and between</p>
        <p><strong>Capital India Finance Limited</strong>, a company incorporated under the laws of India and having its registered office at 701, 7th floor, Aggarwal Corporate Tower, Plot No. 23, District Centre, Rajendra Place, New Delhi &ndash; 110008 through its branch office situated at, hereinafter referred to as <strong>"CIFL"</strong> which expression shall unless the context requires otherwise include its successors and permitted assigns, on one part,</p>
        <p style="text-align:center"><strong>AND</strong></p>
        <p><strong>${companyName}</strong>, a company legal entity incorporated under the applicable laws of India and having its registered office at <strong>${address}</strong>, carrying out the business or subsidiary of Travels and Tour Operator, directly or under implied authority, and hereinafter referred to as <strong>"Client"</strong> which expression shall unless the context requires otherwise include its associates, successors and permitted assigns, on the other part,</p>
        <p>CIFL and <strong>${companyName}</strong>, are individually referred to as a "Party" and collectively referred to as "Parties".</p>

        <h3 style="margin:20px 0 8px">WHEREAS</h3>
        <p>CIFL is an Authorised Dealer Category II Money Changer engaged in the business of purchase, sale &amp; Remittance of foreign exchange and other foreign exchange related services.</p>
        <p><strong>${companyName}</strong>, is engaged in the business of Overseas Tour Management.</p>
        <p>CIFL has requisite skill and expertise to provide such foreign exchange services.</p>
        <p>The <strong>${companyName}</strong>, hereby agrees to appoint CIFL to provide foreign exchange services and such other related services on the terms and conditions mentioned hereunder in this MOU to the directors/partners/proprietor's and employees working at its office.</p>

        <h3 style="margin:20px 0 8px">NOW THEREFORE THIS MOU WITNESSETH AND PARTIES HERETO AGREE AS FOLLOWS:</h3>

        <h3 style="margin:16px 0 8px">SCOPE OF SERVICES</h3>
        <p>Subject to the terms and conditions of this MOU, the Client hereby appoints CIFL to provide foreign exchange Services. CIFL hereby agrees to provide the Services to the Client as per its requirements, from time to time, as per the standards and within the time frame, stipulated in this MOU and/or the Service Request, as the case may be.</p>
        <p>The Client shall provide a list of its authorized personnel to the CIFL, ("Authorization Letter") hereto ("Authorized Representatives"), who are authorized to coordinate with the CIFL for smooth, efficient, and timely performance of the Services in accordance with the terms of this MOU. The Client shall immediately intimate the CIFL in writing, if there is any change in its Authorized Representative and/or the authority granted to its Authorized Representatives.</p>
        <p>The Authorized Representative of Client shall send a duly filled and executed written request on email to the CIFL hereto ("Service Request"), stating the Services required to be provided along with the basic details and valid KYC document of the Customer, in line with the Anti-Money Laundering Laws, to the CIFL. The execution of transaction would be done by the authorized representative of the CIFL.</p>
        <p>The foreign exchange shall be handed over only to the Customer identified in the relevant Service Request and not to any third party. In case of any telegraphic transfers / remittances, the original copy of written service request shall be delivered to the CIFL on or before the date of transaction.</p>
        <p>For avoidance of doubt, it is hereby clarified that the CIFL shall act based on the Service Requests received from an Authorized Representative only. The Client hereby agrees and acknowledges that the Service Provider may reject the Service Request for any reason as it may deem fit, and shall be communicated to Client by CIFL.</p>
        <p>The Client shall not dispute the delivery of the foreign exchange if the acknowledgement has been given by the Customer to whom such foreign exchange has been delivered and such acknowledgment shall be sufficient proof to show delivery and/or the amount of foreign exchange delivered. Further, in case of any telegraphic transfer / remittance Service, the Client hereby agrees to recognize the receipt of a scanned copy of telegraphic transfer as sufficient proof for completion of performance of the relevant Service and shall not dispute the performance of such Service.</p>
        <p>In case of Telegraphic transfers, the Client shall be responsible for collecting TCS and other government taxes from their customers. Further, details of passengers/customers as provided/declared by the Client on Form A2 shall be final and modification will not be allowed. The remitting bank shall report to RBI the details of Client's customers / passengers availing remittance under the LRS scheme of RBI. CIFL will not liable/responsible for any query that may arise in future from regulated authorities related to LRS, TCS etc of the customer.</p>
        <p>Client shall always during the subsistence of this relationship, agree to co-operate and co-ordinate with CIFL for complying with among other the Reserve Bank of India ("RBI") notified Anti Money Laundering Rules &amp; Regulations including Know Your Customer Policy ("KYC") and Foreign Exchange Management Act ("FEMA"), prevailing from time to time. The Client shall supply all such information, which any legal or regulatory authority may require and/or which we may be required to supply in relation to the transaction or the customer. This clause will continue without limit of time, and will survive the termination of this MOU.</p>
        <p>CIFL will provide foreign exchange service only against clear fund in the designated bank account provided by CIFL and on receipt of transaction documents as mentioned in Annexure A or specified from time to time. All payment shall be made to CIFL without any deduction or set off against the bill/invoice raised against release of foreign exchange. If Payments are not received, CIFL shall not carry on the transaction, in this event CIFL shall not be liable for any losses, costs, charges or expenses incurred by the Client.</p>
        <p>It will be sole responsibility of the Client to verify the 'Source of Funds' received from the remitter and transferred to CIFL designated bank account in accordance of law of the land. CIFL reserves the right to seek clarification and proof of the said source of fund before or after processing the remittance. In case of any discrepancy, the client (Tour Operator) will be solely responsible for any financial or reputational loss to CIFL.</p>
        <p>The provisions of this MOU shall survive the termination or expiration of this MOU for a period of 5 years from such expiration or earlier termination ("Survival Period") and shall be complied with by the Parties in the same manner as if the present MOU is valid and in force even after termination or expiry.</p>
        <p>Each Party shall, indemnify, defend and hold harmless the other Party, its affiliates and its officers, directors, employees, representatives, agent's respective directors, and assigns from and against any liability or any other losses that may occur, arising from or relating to a breach of any of the terms, conditions, covenants, representations, undertakings, obligations, or warranties under this MOU. The acts, errors, representations, misrepresentations, wilful misconduct or negligence of the Party or its employees, subcontractors, and agents in performance of its obligations under this MOU.</p>
        <p>The Client shall be deemed to have acknowledged that the Client and its Employees have complied with all the laws, rules, and authorizations and have taken all required permission under FEMA and any other applicable law necessary for the purposes of this MOU. In the event the same has not been complied with by the Client and/or its Employees, CIFL shall not be held responsible or liable and Client in such circumstances shall not withhold any payment to CIFL on account of such default.</p>

        <h3 style="margin:20px 0 8px">Limitation of Liability</h3>
        <p>CIFL shall not be liable for any of the following events:</p>
        <ul style="margin-left:20px;margin-bottom:16px">
          <li>fraudulent transactions occurring after the sale and delivery of the third-party products to the Client / the Customers viz: prepaid forex card, Telegraphic Transfers or any other products that may be available in future.</li>
          <li>failure on the part of a third-party service provider used by the Parties, for instance the issuer of the prepaid forex card, including but not limited to the failure of the third-party server, additional charges applicable at an overseas ATM, etc.</li>
          <li>non catering of / rejecting any Service Request in terms of this MOU.</li>
          <li>delays in the disbursement of funds remitted to overseas beneficiary including the withholding of such funds by the correspondent and /or beneficiary bank.</li>
          <li>intermediary bank charges may be levied by correspondent and/or beneficiary banks, which may vary from banks to banks.</li>
          <li>incorrect information submitted by client, any charges levied by the beneficiary bank or exchange loss incurred for overseas remittance.</li>
          <li>failure of the CIFL to provide telegraphic transfer or overseas remittance services requested by the Client on account of refusal by the remitting bank to undertake such transaction.</li>
        </ul>

        <h3 style="margin:20px 0 8px">KNOW YOUR CUSTOMERS ("KYC") AND AML REQUIREMENT</h3>
        <p>In performing Services under this MOU, the Client shall provide CIFL with KYC documents based on the type of Legal Entity. CIFL will communicate to client the list of documents required for onboarding the Client.</p>
        <p>The Client shall immediately intimate CIFL in writing, if any, change in the KYC documents and authority granted to its authorized personnel.</p>
        <p>The Client will furnish any documents as required by Reserve Bank of India and/or under Foreign Exchange Management Act (FEMA) as and when requested upon by CIFL.</p>
        <p>The Client and its employees will use such foreign exchange released by CIFL for legitimate purposes only.</p>
        <p>As a process of Due diligence, CIFL reserves the right to call for fresh KYC documents at periodical intervals.</p>
        <p>In case of Client holds any title, permission, certification to perform his business as Tour Operator or its intermediary's, such as IATA Certification, Licenses, including Shop and establishment license/Local municipality permission etc, then any revocation thereof, shall be intimated by Client to CIFL.</p>

        <h3 style="margin:20px 0 8px">TERM AND TERMINATION</h3>
        <p>The term of the MOU shall commence on "Effective Date" and shall continue for a term of one (1) years (the "Initial Term"). The MOU shall automatically renew for successive one (1) year period after the Initial Term (each a "Renewal Term",) unless no less than thirty (30) days' notice in writing is given by either party terminating the MOU and if no such notice is given by either party, the term will be extended for a further period of one (1) year. The Initial Term and each Renewal Term shall be referred to herein collectively as the "Term".</p>
        <p>Either Party can terminate this MOU by giving thirty (30) days prior written notice to the other Party without assigning any reason.</p>
        <p>Notwithstanding anything contained herein, CIFL shall be entitled to terminate this MOU forthwith in the event of any contravention or failure in complying with the provisions of this MOU, the Foreign Exchange Management Act, 1999, the Regulations framed there under, the prevailing RBI regulations regarding money changing, Anti Money Laundering guidelines, KYC Policy, as prescribed by RBI from time to time.</p>
        <p>CIFL shall terminate this MOU promptly without any notice if any Proprietor, Partner, Director, Owner, Beneficial Owner, Trustee, Authorised Person etc. is/are likely to be involved in illegal /criminal activity.</p>

        <p style="margin-top:20px"><strong>IN WITNESS WHEREOF</strong>, the Parties to this MOU have signed and executed this MOU on the date and day first above written in the presence of their respective witnesses.</p>

        <table class="preview-table" style="margin-top:24px">
          <tbody>
            <tr>
              <td style="width:50%;vertical-align:top;padding:16px">
                <strong>FOR AND ON BEHALF OF</strong><br>
                <strong>Capital India Finance Limited</strong><br><br>
                Signature:<br>
                Name:<br>
                Designation:<br><br>
                Witness:<br>
                Signature:<br>
                Name:
              </td>
              <td style="width:50%;vertical-align:top;padding:16px">
                <strong>FOR AND ON BEHALF OF</strong><br>
                <strong>${companyName}</strong><br><br>
                Signature:<br>
                Name: <strong>${sigName}</strong><br>
                Designation: ${sigDesig}<br><br>
                Witness:<br>
                Signature:<br>
                Name:
              </td>
            </tr>
          </tbody>
        </table>

        <h3 style="margin:24px 0 8px">Annexure A &ndash; Tour Remittance transaction documents</h3>
        <ul style="margin-left:20px">
          <li>FORM A2 and Application cum declaration signed by the Authorised signatory</li>
          <li>Attested copy of Invoice from overseas beneficiary</li>
          <li>List of Passengers in excel sheet for whom the remittance is being made</li>
          <li>Self-attested Passport copies &amp; PAN copies of passengers travelling abroad</li>
          <li>Air Ticket Copies and Visa Copies of passengers travelling abroad</li>
          <li>TCS Declaration</li>
          <li>Any other documentation as may be required by the remitting bank</li>
        </ul>
      </div>`;
  }

  renderIndelOnboardingPreview() {
    const companyName = this.getFormValue("registeredName") || "[Company Name]";
    const address = this.getFormValue("registeredAddress") || "NA";
    const sigName = this.getFormValue("signatoryName") || this.getFormValue("kmpName") || "";
    const sigDesig = this.getFormValue("signatoryDesignation") || "";
    const today = this.todayFormatted();
    const contactName = this.getFormValue("contactName") || sigName;
    const kmpNames = this.getKmpNames();
    const directors = typeof this.getDirectorNames === "function" ? this.getDirectorNames() : [];
    const officials = typeof this.getOfficialNames === "function" ? this.getOfficialNames() : [];
    const products = this.getCheckedValues("productsGroup");
    const productStr = products.length > 0 ? products.join(", ") : "NA";

    return `
      <div class="preview-container">
        <div class="preview-header">
          <h1>Customer Profile &mdash; For Onboarding Corporate Entities / Agents</h1>
          <p style="text-align:center;font-size:0.85rem;color:var(--text-secondary)">INDEL MONEY LIMITED &bull; New Customer</p>
        </div>
        <table class="preview-table">
          <tbody>
            <tr><th>1</th><td>Name of corporate entity</td><td><strong>${companyName}</strong></td></tr>
            <tr><th>2</th><td>Registered address</td><td>${address}</td></tr>
            <tr><th>3</th><td>Location of Head Office</td><td>${this.getFormValue("principalPlace") || address}</td></tr>
            <tr><th>4</th><td>Date of Incorporation</td><td>${this.getFormValue("dateOfIncorporation") || "NA"}</td></tr>
            <tr><th>5</th><td>PAN of the entity</td><td>${this.getFormValue("panNo") || "NA"}</td></tr>
            <tr><th>6</th><td>Nature of business / type of activity</td><td>${this.getFormValue("natureOfBusiness") || "NA"}</td></tr>
            <tr><th>7</th><td>Products offered / nature of services</td><td>${productStr}</td></tr>
            <tr><th>8</th><td>Location of branches in India/abroad</td><td>${address}</td></tr>
            <tr><th>9</th><td>Names of natural persons controlling the entity</td><td>${kmpNames.length > 0 ? kmpNames.join(", ") : contactName}</td></tr>
            <tr><th>10</th><td>Purpose and intended nature of business relationship</td><td>Foreign Exchange Transactions</td></tr>
            <tr><th>11</th><td>Names of Key Personnel (Chairman, MD, CEO, Directors)</td><td>${kmpNames.length > 0 ? kmpNames.join(", ") : contactName}</td></tr>
            <tr><th>12</th><td>Names of officials authorized to transact foreign exchange</td><td>${officials.length > 0 ? officials.join(", ") : sigName || "NA"}</td></tr>
            <tr><th>13</th><td>Names of bankers</td><td>${this.getFormValue("bankName") || "NA"}</td></tr>
            <tr><th></th><td>Annual estimated foreign exchange turnover</td><td>${this.getFormValue("annualFx") || "NA"}</td></tr>
          </tbody>
        </table>
        <div style="margin-top:24px;padding:16px;background:var(--bg-secondary);border-radius:8px">
          <p style="font-size:0.85rem;font-style:italic">"We hereby certify and declare that all our transactions are bonafide transactions and that we will abide by the prevailing RBI rules, regulations, directives and notifications."</p>
          <div style="margin-top:16px;display:flex;justify-content:flex-end">
            <div style="text-align:right">
              <div>Name: <strong>${sigName}</strong></div>
              <div>Designation: ${sigDesig}</div>
              <div>Date: ${today}</div>
            </div>
          </div>
        </div>
      </div>`;
  }

  renderIndelAuthSignatoryPreview() {
    const companyName = this.getFormValue("registeredName") || "[Company Name]";
    const sigName = this.getFormValue("signatoryName") || this.getFormValue("kmpName") || "";
    const sigDesig = this.getFormValue("signatoryDesignation") || "";
    const today = this.todayFormatted();
    const officials = typeof this.getOfficialNames === "function" ? this.getOfficialNames() : [];

    let tableRows = "";
    const authPersons = officials.length > 0 ? officials : (sigName ? [sigName] : []);
    authPersons.forEach((name, i) => {
      tableRows += `<tr><td>${i + 1}</td><td>${name}</td><td>${i === 0 ? sigDesig : ""}</td><td></td></tr>`;
    });
    for (let i = authPersons.length; i < 3; i++) {
      tableRows += `<tr><td>${i + 1}</td><td></td><td></td><td></td></tr>`;
    }

    return `
      <div class="preview-container">
        <div class="preview-header">
          <h1>LIST OF AUTHORIZED PERSONS</h1>
          <p style="text-align:center;font-size:0.85rem;color:var(--text-secondary)">INDEL MONEY LIMITED</p>
        </div>
        <p style="text-align:right"><strong>Date:</strong> ${today}</p>
        <p>To,<br>The Manager,<br><strong>Indel Money Limited</strong>, Hyderabad</p>
        <p>This is to certify that the following persons are authorized to undertake foreign Exchange Transactions on behalf of <strong>${companyName}</strong></p>
        <table class="preview-table">
          <thead><tr><th>Sl No</th><td><strong>Name of Official</strong></td><td><strong>Designation</strong></td><td><strong>Signature</strong></td></tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
        <div style="margin-top:24px;text-align:right">
          <div>For <strong>${companyName}</strong></div>
          <div style="margin-top:12px">Name: <strong>${sigName}</strong></div>
          <div>Designation: ${sigDesig}</div>
          <div style="margin-top:4px;font-size:0.85rem;color:var(--text-secondary)">Company name and seal</div>
        </div>
      </div>`;
  }

  renderIndelBeneficialOwnershipPreview() {
    const companyName = this.getFormValue("registeredName") || "[Company Name]";
    const address = this.getFormValue("registeredAddress") || "NA";
    const sigName = this.getFormValue("signatoryName") || this.getFormValue("kmpName") || "";
    const sigDesig = this.getFormValue("signatoryDesignation") || "";
    const today = this.todayFormatted();
    const kmpNames = this.getKmpNames();
    const contactName = this.getFormValue("contactName") || sigName;
    const indelBoOwners = this.getBeneficialOwners();
    const indelBoFallback = kmpNames.length > 0 ? kmpNames : [contactName];
    const indelBoData = indelBoOwners.length > 0 ? indelBoOwners : indelBoFallback.map(name => ({ name, pan: this.getFormValue("panNo") || "", sharePercent: this.getFormValue("sharesPercent") || (indelBoFallback.length === 1 ? "100%" : Math.round(100 / indelBoFallback.length) + "%") }));

    let boRows = "";
    indelBoData.forEach((p, i) => {
      boRows += `<tr><td>${i + 1}</td><td>${p.name}</td><td>${p.dob || ""}</td><td>Indian</td><td>${address}</td><td>PAN: ${p.pan}</td><td>${p.sharePercent}</td></tr>`;
    });

    return `
      <div class="preview-container">
        <div class="preview-header">
          <h1>DECLARATION OF BENEFICIAL OWNERSHIP</h1>
          <p style="text-align:center;font-size:0.85rem;color:var(--text-secondary)">INDEL MONEY LIMITED &bull; NOT APPLICABLE FOR SOLE PROPRIETORSHIP ACCOUNTS</p>
        </div>
        <p><strong>Name of the Customer/Company:</strong> ${companyName}</p>
        <p><strong>Registered Number:</strong> ${this.getFormValue("cinNo") || "NA"}</p>
        <p><strong>Registered Address:</strong> ${address}</p>
        <table class="preview-table" style="margin-top:16px">
          <thead><tr><th>Sr No.</th><td><strong>Full Name</strong></td><td><strong>DOB</strong></td><td><strong>Nationality</strong></td><td><strong>Address</strong></td><td><strong>KYC Documents</strong></td><td><strong>Controlling ownership (%)</strong></td></tr></thead>
          <tbody>${boRows}</tbody>
        </table>
        <div style="margin-top:24px;text-align:right">
          <div>For and on behalf of <strong>${companyName}</strong></div>
          <div style="margin-top:12px">Full Name: <strong>${sigName}</strong></div>
          <div>Designation / Position: ${sigDesig}</div>
          <div>Date: ${today}</div>
        </div>
      </div>`;
  }

  renderIndelFieldVerificationPreview() {
    const companyName = this.getFormValue("registeredName") || "[Company Name]";
    const address = this.getFormValue("registeredAddress") || "NA";
    const contactName = this.getFormValue("contactName") || this.getFormValue("kmpName") || "";

    return `
      <div class="preview-container">
        <div class="preview-header">
          <h1>FIELD VERIFICATION REPORT</h1>
          <p style="text-align:center;font-size:0.85rem;color:var(--text-secondary)">INDEL MONEY LTD</p>
        </div>
        <table class="preview-table">
          <tbody>
            <tr><td style="width:40%"><strong>VENDOR'S NAME</strong></td><td>${companyName}</td></tr>
            <tr><td><strong>ADDRESS</strong></td><td>${address}</td></tr>
            <tr><td><strong>Pan card No</strong></td><td>${this.getFormValue("panNo") || "NA"}</td></tr>
            <tr><td><strong>DATE AND TIME OF VISIT</strong></td><td></td></tr>
            <tr><td><strong>STAFF NAME &amp; EMPLOYEE ID</strong></td><td></td></tr>
          </tbody>
        </table>
        <h3 style="margin:20px 0 8px">CHECK POINTS TO CONFIRM</h3>
        <table class="preview-table">
          <tbody>
            <tr><th>1</th><td>Company displayed Signage Board with Company Name</td><td>Yes / No</td></tr>
            <tr><th>2</th><td>Place of Business and Address proof provided are same</td><td>Yes / No</td></tr>
            <tr><th>3</th><td>Is Office premises in rental or Owned</td><td>Rental / Owned / Residential</td></tr>
            <tr><th>4</th><td>Is the vendor having Office Set-up</td><td>Yes / No</td></tr>
            <tr><th>5</th><td>Is GST registered Entity</td><td>${this.getFormValue("gstNo") ? "Yes" : "No"}</td></tr>
            <tr><th>6</th><td>GST Registered Address and Place of Business same</td><td>Yes / No</td></tr>
          </tbody>
        </table>
        <h3 style="margin:20px 0 8px">Additional Details</h3>
        <table class="preview-table">
          <tbody>
            <tr><td><strong>Contact / Authorized Person</strong></td><td>${contactName}</td></tr>
            <tr><td><strong>Office Contact No</strong></td><td>${this.getFormValue("contactMobile") || "NA"}</td></tr>
            <tr><td><strong>E-Mail for Communication</strong></td><td>${this.getFormValue("contactEmail") || "NA"}</td></tr>
            <tr><td><strong>Website</strong></td><td>${this.getFormValue("companyWebsite") || "NA"}</td></tr>
            <tr><td><strong>Primary Business activities</strong></td><td>${this.getFormValue("natureOfBusiness") || "NA"}</td></tr>
            <tr><td><strong>Primary Bank name</strong></td><td>${this.getFormValue("bankName") || "NA"}</td></tr>
          </tbody>
        </table>
      </div>`;
  }

  renderIndelMouPreview() {
    const companyName = this.getFormValue("registeredName") || "[Company Name]";
    const address = this.getFormValue("registeredAddress") || "[Company registered Address]";
    const sigName = this.getFormValue("signatoryName") || this.getFormValue("kmpName") || "";
    const sigDesig = this.getFormValue("signatoryDesignation") || "";
    const today = this.todayFormatted();

    return `
      <div class="preview-container">
        <div class="preview-header">
          <h1>MEMORANDUM OF UNDERSTANDING (MOU)</h1>
          <p style="text-align:center;font-size:0.85rem;color:var(--text-secondary)">INDEL MONEY LIMITED</p>
        </div>

        <p>This MOU is made on this <strong>${today}</strong> ("Effective Date") by and between</p>
        <p><strong>Indel Money Limited</strong> (IML), a company incorporated under the laws of India and having its registered office at Kerala, operating through branch at Mayur Vihar Delhi, hereinafter referred to as <strong>"IML"</strong>,</p>
        <p style="text-align:center"><strong>AND</strong></p>
        <p><strong>${companyName}</strong>, having its registered office at <strong>${address}</strong>, carrying out the business of Travels and Tour Operator, hereinafter referred to as <strong>"Client"</strong>,</p>

        <h3 style="margin:20px 0 8px">WHEREAS</h3>
        <p>IML is an Authorised Dealer Category II Money Changer engaged in the business of purchase, sale &amp; Remittance of foreign exchange.</p>
        <p><strong>${companyName}</strong> is engaged in the business of Overseas Tour Management.</p>

        <h3 style="margin:20px 0 8px">SCOPE OF SERVICES</h3>
        <p>The Client hereby appoints IML for providing foreign exchange services including sale/purchase of foreign currency and telegraphic transfers.</p>

        <h3 style="margin:20px 0 8px">TERM</h3>
        <p>Initial Term: 2 years from Effective Date, auto-renewal for 1 year periods. Either party may terminate with 30 days written notice.</p>

        <p style="margin-top:20px"><strong>IN WITNESS WHEREOF</strong>, the Parties have signed and executed this MOU.</p>

        <table class="preview-table" style="margin-top:24px">
          <tbody>
            <tr>
              <td style="width:50%;vertical-align:top;padding:16px">
                <strong>FOR AND ON BEHALF OF</strong><br>
                <strong>Indel Money Limited</strong><br><br>
                Name:<br>
                Designation:<br>
              </td>
              <td style="width:50%;vertical-align:top;padding:16px">
                <strong>FOR AND ON BEHALF OF</strong><br>
                <strong>${companyName}</strong><br><br>
                Name: <strong>${sigName}</strong><br>
                Designation: ${sigDesig}<br>
              </td>
            </tr>
          </tbody>
        </table>
      </div>`;
  }

  renderA2PreviewTable(title, subtitle, purposeDefault) {
    const v = (id) => this.getFormValue(id) || "";
    const companyName = v("registeredName") || "[Company Name]";
    const contactName = v("contactName") || v("signatoryName") || "";
    const today = this.todayFormatted();
    const curr = v("txnCurrency");
    const amt = v("txnAmount");
    const currQty = (curr || amt) ? (curr + " " + amt).trim() : "";
    return `
      <div class="preview-container">
        <div class="preview-header">
          <h1>${title}</h1>
          <p style="text-align:center;font-size:0.85rem">${subtitle}</p>
        </div>
        <p style="text-align:right">Date: <strong>${today}</strong></p>
        <table class="preview-table">
          <thead><tr><th style="width:40px">Sr.</th><td><strong>Particulars</strong></td><td><strong>Details</strong></td></tr></thead>
          <tbody>
            ${this.pRow("1. Remitter Full Name / Address", companyName + ", " + v("registeredAddress"))}
            ${this.pRow("2. Contact Person, Mobile & Email", contactName + ", " + v("contactMobile") + ", " + v("contactEmail"))}
            ${this.pRow("3. PAN Number", v("panNo"))}
            ${this.pRow("4. Purpose of Remittance", purposeDefault)}
            ${this.pRow("5. Currency & Quantity", currQty)}
            ${this.pRow("6. Beneficiary Name", v("txnBenefName"))}
            ${this.pRow("7. Beneficiary Bank Name", v("txnBenefBank"))}
            ${this.pRow("8. Beneficiary Account Number", v("txnBenefAccount"))}
            ${this.pRow("9. Beneficiary Bank Address", v("txnBenefBankAddr"))}
            ${this.pRow("10. Swift Code / Routing No", v("txnSwiftCode"))}
            ${this.pRow("11. ABA / BLZ / Sort Code / Bank Code", "")}
            ${this.pRow("12. IBAN International", v("txnIban"))}
            ${this.pRow("13. Invoice Number / Group Name", v("txnInvoiceNo"))}
            ${this.pRow("14. Correspondent Bank Charges", "")}
          </tbody>
        </table>
        <div class="preview-signature">
          <div class="signature-block">
            <div style="height:40px"></div>
            <div class="signature-line">Authorized Signatory</div>
            <div>Name: <strong>${v("signatoryName")}</strong></div>
            <div>For: <strong>${companyName}</strong></div>
          </div>
        </div>
      </div>`;
  }

  renderTcsPreviewContent(title, subtitle, variant) {
    const v = (id) => this.getFormValue(id) || "";
    const companyName = v("registeredName") || "[Company Name]";
    const today = this.todayFormatted();
    const isIndel = variant.startsWith("indel");
    const travelers = v("txnTravelers") || "_____";
    const dest = v("txnDestination") || "_______";
    const amt = v("txnAmount") ? (v("txnCurrency") + " " + v("txnAmount")).trim() : "_______";
    return `
      <div class="preview-container">
        <div class="preview-header">
          <h1>${title}</h1>
          <p style="text-align:center;font-size:0.85rem">${subtitle}</p>
        </div>
        <p>Date: <strong>${today}</strong></p>
        <p>To,<br>${isIndel ? "Indel Money Limited" : "Capital India Finance Limited"}<br>${isIndel ? "Delhi Branch" : "Mumbai"}</p>
        <div style="margin:16px 0;padding:12px;border:1px solid var(--border);border-radius:6px">
          <p><strong>Option A:</strong> We hereby declare we have collected TCS from <strong>${travelers}</strong> no. of passengers travelling to <strong>${dest}</strong> as per applicable rate for remittance amount of <strong>${amt}</strong> Currency dated <strong>${today}</strong>. We further declare that we will deposit TCS collected from above passengers to the government within the stipulated timelines.</p>
        </div>
        <div style="margin:16px 0;padding:12px;border:1px solid var(--border);border-radius:6px">
          <p><strong>Option B:</strong> Not collected TCS as the Buyer is liable and has deducted TDS on the entire overseas tour package as per Income Tax Act.</p>
        </div>
        <div class="preview-signature">
          <div class="signature-block">
            <div style="height:40px"></div>
            <div>For <strong>${companyName}</strong></div>
            <div class="signature-line">(Authorized Signatory): <strong>${v("signatoryName")}</strong></div>
          </div>
        </div>
      </div>`;
  }

  renderCiflFitA2Preview() {
    return this.renderA2PreviewTable("APPLICATION CUM DECLARATION FORM - A2", "For Release of Foreign Exchange (FIT / Tour Remittance)", "TOUR");
  }

  renderCiflFitTcsPreview() {
    return this.renderTcsPreviewContent("TCS Declaration", "Tax Collected at Source - FIT", "cifl");
  }

  renderCiflFitFlightPreview() {
    const v = (id) => this.getFormValue(id) || "";
    const companyName = v("registeredName") || "[Company Name]";
    const sigName = v("signatoryName") || "";
    const today = this.todayFormatted();
    return `
      <div class="preview-container">
        <div class="preview-header"><h1>Flight Declaration</h1></div>
        <p style="text-align:right">Date: <strong>${today}</strong></p>
        <p>To,<br>Capital India Finance Limited<br>Mumbai</p>
        <p>Sub: Declaration regarding flight tickets</p>
        <p>Dear Sir/Madam,</p>
        <p>We, <strong>${companyName}</strong>, hereby declare that the flight tickets for the passengers mentioned in the invoice are not yet available at the time of remittance. We undertake to provide the flight details once the tickets are issued.</p>
        <p>Invoice No: <strong>${v("txnInvoiceNo") || "___________"}</strong><br>Remittance Amount: <strong>${v("txnAmount") ? (v("txnCurrency") + " " + v("txnAmount")).trim() : "___________"}</strong><br>Number of Passengers: <strong>${v("txnTravelers") || "___________"}</strong></p>
        <div class="preview-signature">
          <div class="signature-block">
            <div style="height:40px"></div>
            <div class="signature-line">Authorized Signatory</div>
            <div>Name: <strong>${sigName}</strong></div>
            <div>Designation: <strong>${v("signatoryDesignation")}</strong></div>
            <div>For: <strong>${companyName}</strong></div>
          </div>
        </div>
      </div>`;
  }

  renderCiflFitVisaPreview() {
    const v = (id) => this.getFormValue(id) || "";
    const companyName = v("registeredName") || "[Company Name]";
    const sigName = v("signatoryName") || "";
    const today = this.todayFormatted();
    return `
      <div class="preview-container">
        <div class="preview-header"><h1>Visa Declaration</h1></div>
        <p style="text-align:right">Date: <strong>${today}</strong></p>
        <p>To,<br>Capital India Finance Limited<br>Mumbai</p>
        <p>Sub: Declaration regarding visa status</p>
        <p>Dear Sir/Madam,</p>
        <p>We, <strong>${companyName}</strong>, hereby declare that the visas for the passengers mentioned in the invoice are not yet available at the time of remittance. We undertake that the visas will be obtained before the date of travel.</p>
        <p>Invoice No: <strong>${v("txnInvoiceNo") || "___________"}</strong><br>Currency & Amount: <strong>${v("txnAmount") ? (v("txnCurrency") + " " + v("txnAmount")).trim() : "___________"}</strong><br>Number of Passengers: <strong>${v("txnTravelers") || "___________"}</strong></p>
        <div class="preview-signature">
          <div class="signature-block">
            <div style="height:40px"></div>
            <div class="signature-line">Authorized Signatory</div>
            <div>Name: <strong>${sigName}</strong></div>
            <div>Designation: <strong>${v("signatoryDesignation")}</strong></div>
            <div>For: <strong>${companyName}</strong></div>
          </div>
        </div>
      </div>`;
  }

  renderCiflFitCountryPreview() {
    const v = (id) => this.getFormValue(id) || "";
    const companyName = v("registeredName") || "[Company Name]";
    const sigName = v("signatoryName") || "";
    const today = this.todayFormatted();
    return `
      <div class="preview-container">
        <div class="preview-header"><h1>Different Country Declaration</h1></div>
        <p style="text-align:right">Date: <strong>${today}</strong></p>
        <p>To,<br>Capital India Finance Limited<br>Mumbai</p>
        <p>Sub: Declaration regarding beneficiary bank in different country</p>
        <p>Dear Sir/Madam,</p>
        <p>We, <strong>${companyName}</strong>, hereby declare that the beneficiary bank account is in a country different from the country of travel. The details are as follows:</p>
        <table class="preview-table">
          <tbody>
            ${this.pRow("Currency & Amount", v("txnAmount") ? (v("txnCurrency") + " " + v("txnAmount")).trim() : "")}
            ${this.pRow("Beneficiary Name", v("txnBenefName"))}
            ${this.pRow("Beneficiary Address", v("txnBenefBankAddr"))}
            ${this.pRow("Beneficiary Bank", v("txnBenefBank"))}
            ${this.pRow("Swift Code", v("txnSwiftCode"))}
          </tbody>
        </table>
        <div class="preview-signature">
          <div class="signature-block">
            <div style="height:40px"></div>
            <div class="signature-line">Authorized Signatory</div>
            <div>Name: <strong>${sigName}</strong></div>
            <div>For: <strong>${companyName}</strong></div>
          </div>
        </div>
      </div>`;
  }

  renderCiflMiceA2Preview() {
    return this.renderA2PreviewTable("APPLICATION CUM DECLARATION FORM - A2 (MICE)", "For Release of Foreign Exchange (MICE / Non-LRS)", "MICE");
  }

  renderCiflMiceTcsPreview() {
    return this.renderTcsPreviewContent("TCS Declaration (MICE)", "Tax Collected at Source - MICE", "cifl");
  }

  renderCiflMiceCuPreview() {
    const v = (id) => this.getFormValue(id) || "";
    const companyName = v("registeredName") || "[Corporate Name]";
    const corpName = v("txnCorporateName") || companyName;
    const sigName = v("signatoryName") || "";
    const sigDesig = v("signatoryDesignation") || "";
    const today = this.todayFormatted();
    const dest = v("txnDestination") || "[Country]";
    const dateFrom = v("txnDateFrom") || "__________";
    const dateTo = v("txnDateTo") || "__________";
    const travelers = v("txnTravelers") || "_____";
    const amt = v("txnAmount") ? (v("txnCurrency") + " " + v("txnAmount")).trim() : "[Amount]";
    return `
      <div class="preview-container">
        <div class="preview-header"><h1>Corporate Undertaking (MICE)</h1></div>
        <p style="text-align:right">Date: <strong>${today}</strong></p>
        <p>To Whomsoever It May Concern</p>
        <p>This is to certify that <strong>${corpName}</strong> has appointed <strong>${companyName}</strong> to arrange an incentive trip to <strong>${dest}</strong> from <strong>${dateFrom}</strong> to <strong>${dateTo}</strong> for about <strong>${travelers}</strong> employees of <strong>${corpName}</strong>.</p>
        <p>We hereby authorize the remittance of foreign exchange amounting to <strong>${amt}</strong> through the appointed travel agent for the said trip.</p>
        <p>PAN: <strong>${v("panNo")}</strong></p>
        <p>All remittances related to the above said trip shall be initiated by <strong>${corpName}</strong>.</p>
        <div class="preview-signature">
          <div class="signature-block">
            <div style="height:40px"></div>
            <div>For <strong>${corpName}</strong></div>
            <div class="signature-line">Authorized Signatory</div>
            <div>Name: <strong>${sigName}</strong></div>
            <div>Designation: <strong>${sigDesig}</strong></div>
          </div>
        </div>
      </div>`;
  }

  renderCiflMiceTaPreview() {
    const v = (id) => this.getFormValue(id) || "";
    const companyName = v("registeredName") || "[TA Name]";
    const corpName = v("txnCorporateName") || "[Corporate Name]";
    const sigName = v("signatoryName") || "";
    const today = this.todayFormatted();
    const dest = v("txnDestination") || "[Country]";
    const dateFrom = v("txnDateFrom") || "__________";
    const dateTo = v("txnDateTo") || "__________";
    const travelers = v("txnTravelers") || "_____";
    const amt = v("txnAmount") ? (v("txnCurrency") + " " + v("txnAmount")).trim() : "_____";
    return `
      <div class="preview-container">
        <div class="preview-header"><h1>Travel Agent Undertaking (MICE)</h1></div>
        <p style="text-align:right">Date: <strong>${today}</strong></p>
        <p>To Whomsoever It May Concern</p>
        <p>We, <strong>${companyName}</strong>, hereby undertake that:</p>
        <ul style="margin:12px 0;padding-left:24px">
          <li>We have been appointed by <strong>${corpName}</strong> to arrange a MICE trip</li>
          <li>Destination: <strong>${dest}</strong></li>
          <li>Travel Dates: <strong>${dateFrom}</strong> to <strong>${dateTo}</strong></li>
          <li>Number of Travelers: <strong>${travelers}</strong></li>
          <li>Remittance Amount: <strong>${amt}</strong></li>
        </ul>
        <p>PAN: <strong>${v("panNo")}</strong></p>
        <div class="preview-signature">
          <div class="signature-block">
            <div style="height:40px"></div>
            <div>For <strong>${companyName}</strong></div>
            <div class="signature-line">Authorized Signatory</div>
            <div>Name: <strong>${sigName}</strong></div>
          </div>
        </div>
      </div>`;
  }

  renderIndelFitA2Preview() {
    return this.renderA2PreviewTable("FORM A2 - Tour Remittance", "Indel Money Limited, Delhi Branch - Release of Foreign Exchange under LRS", "TOUR");
  }

  renderIndelFitPassengerPreview() {
    const v = (id) => this.getFormValue(id) || "";
    const companyName = v("registeredName") || "[Company Name]";
    const sigName = v("signatoryName") || "";
    const today = this.todayFormatted();
    const boData = this.getBeneficialOwners();
    let paxRows = "";
    for (let i = 0; i < 6; i++) {
      const p = boData[i] || {};
      paxRows += `<tr><td>${p.name || ""}</td><td>${p.pan || ""}</td><td>${p.dob || ""}</td><td></td><td>${v("txnCurrency")}</td><td>${v("txnAmount")}</td></tr>`;
    }
    return `
      <div class="preview-container">
        <div class="preview-header">
          <h1>Passenger Details cum Declaration</h1>
          <p style="text-align:center;font-size:0.85rem">Indel Money Limited, Delhi Branch</p>
        </div>
        <p style="text-align:right">Date: <strong>${today}</strong></p>
        <table class="preview-table">
          <thead><tr><th>Pax Name</th><th>PAN Number</th><th>DOB</th><th>Passport No</th><th>Currency</th><th>Forex Amt</th></tr></thead>
          <tbody>${paxRows}</tbody>
        </table>
        <div style="margin:16px 0">
          <h3>Declaration & Undertaking</h3>
          <ol style="font-size:0.85rem;padding-left:20px">
            <li>INR received from passengers per RBI/Income Tax guidelines</li>
            <li>Documents verified and retained for passengers in Schedule I</li>
            <li>Indel Money's right to refuse suspicious transactions</li>
            <li>No responsibility for rejection by remitting/corresponding banks</li>
            <li>Remitted amount used for bonafide purpose only</li>
            <li>Compliance with FEMA 1999</li>
            <li>Amount deducted from individual LRS quota</li>
          </ol>
        </div>
        <div class="preview-signature">
          <div class="signature-block">
            <div style="height:40px"></div>
            <div class="signature-line">Authorized Signatory</div>
            <div>Name: <strong>${sigName}</strong></div>
            <div>For: <strong>${companyName}</strong></div>
          </div>
        </div>
      </div>`;
  }

  renderIndelFitTcsPreview() {
    return this.renderTcsPreviewContent("TCS Declaration - Tour Remittance", "Indel Money Limited, Delhi Branch", "indel");
  }

  renderIndelMiceA2Preview() {
    return this.renderA2PreviewTable("FORM A2 - MICE", "Indel Money Limited, New Delhi Branch - Release of Foreign Exchange (MICE)", "");
  }

  renderIndelMiceTcsPreview() {
    return this.renderTcsPreviewContent("TCS Declaration (MICE)", "Indel Money Limited, New Delhi", "indel");
  }

  todayFormatted() {
    const d = new Date();
    return `${d.getDate().toString().padStart(2,"0")}/${(d.getMonth()+1).toString().padStart(2,"0")}/${d.getFullYear()}`;
  }

  downloadPdf() {
    const products = this.getCheckedValues("productsGroup");
    const productStr = products.length > 0 ? products.join(", ") : "Not specified";
    const stockListed = this.getRadioValue("stockExchangeGroup");
    const caseReg = this.getRadioValue("caseRegisteredGroup");
    const bankDetails = this.getFormValue("bankName") || "";

    const rows = [
      ["1", "Registered Name", this.getFormValue("registeredName")],
      ["2", "Legal Status", this.getRadioValue("legalStatusGroup")],
      ["3", "Registered Office Address", this.getFormValue("registeredAddress")],
      ["4", "Principal Place of Business", this.getFormValue("principalPlace") || "Same as Registered Address"],
      ["5", "Date of Incorporation", this.getFormValue("dateOfIncorporation")],
      ["6", "PAN No", this.getFormValue("panNo") || "-"],
      ["7", "Nature of Business", this.getFormValue("natureOfBusiness")],
      ["8", "Listed on Stock Exchange", stockListed],
      ["9", "Company Website", this.getFormValue("companyWebsite") || "-"],
      ["", "MSME/Udyam Number", this.getFormValue("udyamNumber") || "-"],
      ["10", "Products to be Availed", productStr],
      ["11", "Annual Estimated FX (INR)", this.getFormValue("annualFx") || "-"],
      ["12", "Contact Person", `${this.getFormValue("contactName")}, ${this.getFormValue("contactDesignation")}, ${this.getFormValue("contactMobile")}, ${this.getFormValue("contactEmail")}`],
      ["13", "Key Managerial Person", this.getKmpNames().join(", ")],
      ["14", "CEO Details", `${this.getFormValue("ceoName")}, ${this.getFormValue("ceoMobile")}, ${this.getFormValue("ceoEmail")}`],
      ["15", "MD / Partner / Trustee", `${this.getFormValue("mdName")}, ${this.getFormValue("mdMobile")}, ${this.getFormValue("mdEmail")}`],
      ["16", "Directors / Partners", this.getDirectorNames().join(", ")],
      ["17", "Authorized Officials", this.getOfficialNames().join(", ")],
      ["18", "Banking Details", bankDetails],
      ["19", "Case/Complaint", caseReg],
    ];

    const pdf = new PdfBuilder();
    const margin = 50;
    const tableW = 495;
    const colWidths = [40, 170, 285];
    const startX = margin;
    const fontSize = 10;
    const lineH = 14;
    const cellPad = 12;
    const pageTop = 780;
    const pageBottom = 80;

    const addHeader = (yPos) => {
      pdf.setFont(10, true);
      pdf.drawRect(startX, yPos - 20, colWidths[0], 26, "#2D3494");
      pdf.drawRect(startX + colWidths[0], yPos - 20, colWidths[1], 26, "#2D3494");
      pdf.drawRect(startX + colWidths[0] + colWidths[1], yPos - 20, colWidths[2], 26, "#2D3494");
      pdf.setTextColor(255, 255, 255);
      pdf.drawText("Sr.", startX + 8, yPos - 4);
      pdf.drawText("Particulars", startX + colWidths[0] + 8, yPos - 4);
      pdf.drawText("Details", startX + colWidths[0] + colWidths[1] + 8, yPos - 4);
      pdf.setTextColor(0, 0, 0);
      return yPos - 26;
    };

    pdf.addPage();

    pdf.setFont(18, true);
    pdf.drawTextCentered("Client Onboarding Form", pageTop);
    pdf.setFont(12, false);
    pdf.drawTextCentered("(Corporates & Tour Operators)", pageTop - 22);
    pdf.drawLine(margin, pageTop - 36, margin + tableW, pageTop - 36, 2);

    let y = pageTop - 52;
    y = addHeader(y);

    for (let r = 0; r < rows.length; r++) {
      const [sr, label, value] = rows[r];
      const safeVal = (value || "").replace(/[\r\n]+/g, ", ");
      const valLines = pdf.wrapText(safeVal, colWidths[2] - 16, fontSize);
      const labelLines = pdf.wrapText(label, colWidths[1] - 16, fontSize);
      const textRows = Math.max(valLines.length, labelLines.length, 1);
      const rowH = textRows * lineH + cellPad;

      if (y - rowH < pageBottom) {
        pdf.addPage();
        y = pageTop;
        y = addHeader(y);
      }

      const isEven = r % 2 === 0;
      if (isEven) {
        pdf.drawRect(startX, y - rowH, colWidths[0] + colWidths[1] + colWidths[2], rowH, "#F2F4F8");
      }

      pdf.drawCellBorder(startX, y - rowH, colWidths[0], rowH);
      pdf.drawCellBorder(startX + colWidths[0], y - rowH, colWidths[1], rowH);
      pdf.drawCellBorder(startX + colWidths[0] + colWidths[1], y - rowH, colWidths[2], rowH);

      const textY = y - lineH + 2;

      pdf.setFont(fontSize, true);
      pdf.drawText(sr, startX + 8, textY);
      labelLines.forEach((ln, i) => pdf.drawText(ln, startX + colWidths[0] + 8, textY - (i * lineH)));
      pdf.setFont(fontSize, false);
      valLines.forEach((ln, i) => pdf.drawText(ln, startX + colWidths[0] + colWidths[1] + 8, textY - (i * lineH)));

      y -= rowH;
    }

    y -= 30;
    if (y < 220) { pdf.addPage(); y = pageTop; }
    pdf.drawLine(margin, y + 10, margin + tableW, y + 10, 1);
    y -= 6;
    pdf.setFont(12, true);
    pdf.drawText("Declaration", margin, y);
    y -= 18;
    pdf.setFont(8.5, false);
    const declText = "We hereby certify and declare that all our transactions are Bonafide transactions and that we will abide by the prevailing RBI rules, regulations, directives and notifications. We hereby indemnify CIFL and agree to keep it always indemnified against any claims, losses, damages, fines, penalties, cost, expenses, that may accrue or arise to CIFL because of our non-compliance to such regulatory requirements. We irrevocably agree and undertake to provide additional details of any transactions if so desired by the CIFL or that may be required by any government/regulatory authority from time to time. We hereby confirm and present that the person signing herein below has full authority to do so and execution hereof by him creates a legal, valid binding and enforceable obligation on us.";
    const declLines = pdf.wrapText(declText, tableW - 10, 8.5);
    declLines.forEach((ln, i) => { pdf.drawText(ln, margin + 4, y - (i * 12)); });
    y -= declLines.length * 12 + 40;

    if (y < 120) { pdf.addPage(); y = pageTop; }
    pdf.setFont(10, true);
    pdf.drawText("Authorized Signatory", 360, y);
    y -= 35;
    pdf.drawLine(360, y + 10, 540, y + 10, 0.5);
    pdf.setFont(10, false);
    pdf.drawText(`Name: ${this.getFormValue("signatoryName")}`, 360, y - 4);
    pdf.drawText(`Designation: ${this.getFormValue("signatoryDesignation")}`, 360, y - 20);
    pdf.drawText(`Date: ${this.todayFormatted()}`, 360, y - 36);
    pdf.setFont(9, false);
    pdf.drawText("(Company Seal)", 360, y - 56);

    // Download
    const blob = pdf.build();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Corporate_Client_Onboarding_${this.getFormValue("registeredName").replace(/\s+/g, "_") || "Form"}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showToast("PDF downloaded successfully!", "success");
  }

  triggerPdfDownload(pdf, filename) {
    const blob = pdf.build();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showToast("PDF downloaded successfully!", "success");
  }

  pdfDrawParagraph(pdf, text, x, y, maxW, fontSize, lineH) {
    const lines = pdf.wrapText(text, maxW, fontSize);
    lines.forEach((ln, i) => { pdf.drawText(ln, x, y - (i * lineH)); });
    return y - lines.length * lineH;
  }

  downloadAuthSignatoryPdf() {
    const companyName = this.getFormValue("registeredName") || "";
    const legalEntity = this.getFormValue("legalEntityName") || companyName;
    const sigName = this.getFormValue("signatoryName") || this.getFormValue("kmpName") || "";
    const sigDesig = this.getFormValue("signatoryDesignation") || this.getFormValue("contactDesignation") || "";
    const contactName = this.getFormValue("contactName") || sigName;
    const contactDesig = this.getFormValue("contactDesignation") || sigDesig;
    const ceoName = this.getFormValue("ceoName") || sigName;
    const today = this.todayStr();

    const pdf = new PdfBuilder();
    const m = 50, w = 495, lineH = 14, pageTop = 780;
    pdf.addPage();

    pdf.setFont(10, false);
    pdf.drawTextCentered("(To be obtained on the Company/Firms Letter Head)", pageTop);

    pdf.setFont(10, false);
    pdf.drawText(`Date: ${today}`, 420, pageTop - 30);

    let y = pageTop - 60;
    pdf.setFont(10, false);
    pdf.drawText("The Manager", m, y);
    pdf.drawText("Capital India Finance Limited", m, y - lineH);
    y -= lineH * 3;

    pdf.setFont(11, true);
    y = this.pdfDrawParagraph(pdf, "Sub: Authority to Place Request / Authorized Signatory for Purchase / Sales of Foreign Exchange", m, y, w, 11, 15);
    y -= 10;

    pdf.setFont(10, false);
    pdf.drawText("Dear Sir,", m, y);
    y -= lineH * 2;

    pdf.setFont(9.5, false);
    const bodyText = `I/We, ${legalEntity} (Legal entity name), (hereinafter referred to as "APPLICANT") have authorized the following person(s) as an authorized representative(s) of the APPLICANT to execute foreign exchange transactions with M/s Capital India Finance Limited (CIFL), from time to time, and to purchase Foreign Exchange for and on behalf of the APPLICANT against Cheque issued by the APPLICANT or against credit. We have specifically authorized the person(s) named herein below to sign request letter for purchase / surrender of foreign exchange for the employees of the APPLICANT travelling abroad for and on behalf of the APPLICANT. We hereby take the complete responsibility for any transaction undertaken by the said authorized representative(s) with CIFL.`;
    y = this.pdfDrawParagraph(pdf, bodyText, m, y, w, 9.5, 13);
    y -= 16;

    pdf.setFont(10, true);
    pdf.drawText("The Signature of the authorized person(s)/representative(s) is attested below:", m, y);
    y -= 20;

    const colW = [50, 190, 140, 115];
    const headers = ["Sr. No", "Name", "Designation", "Signature"];
    pdf.drawRect(m, y - 22, w, 22, "#2D3494");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont(9, true);
    let cx = m;
    headers.forEach((h, i) => { pdf.drawText(h, cx + 6, y - 6); pdf.drawCellBorder(cx, y - 22, colW[i], 22); cx += colW[i]; });
    pdf.setTextColor(0, 0, 0);
    y -= 22;

    const tRows = [["1", contactName, contactDesig, ""], ["2", ceoName, sigDesig, ""]];
    tRows.forEach((row, ri) => {
      const rh = 24;
      if (ri % 2 === 0) pdf.drawRect(m, y - rh, w, rh, "#F2F4F8");
      cx = m;
      pdf.setFont(9, false);
      row.forEach((cell, ci) => { pdf.drawText(cell, cx + 6, y - 8); pdf.drawCellBorder(cx, y - rh, colW[ci], rh); cx += colW[ci]; });
      y -= rh;
    });

    y -= 16;
    pdf.setFont(9, false);
    const closingText = "This authority is irrevocable and binding on the APPLICANT as long as the APPLICANT continues to deal with CIFL for its Foreign Exchange requirements. Further the APPLICANT is responsible to make payment for the foreign exchange released to the APPLICANT and its employees by CIFL from time to time under the instructions of our aforesaid authorized representative(s).";
    y = this.pdfDrawParagraph(pdf, closingText, m, y, w, 9, 12);
    y -= 10;
    const closingText2 = "In the event, we wish to change our authorized representative(s) for any reason whatsoever, it shall be mandatory on our part to inform the same in writing to CIFL and such writing must be acknowledged by the authorized representative(s) of CIFL.";
    y = this.pdfDrawParagraph(pdf, closingText2, m, y, w, 9, 12);

    if (y < 160) { pdf.addPage(); y = pageTop; }
    y -= 30;
    pdf.setFont(10, true);
    pdf.drawText(`For ${companyName}`, 350, y);
    y -= 40;
    pdf.drawLine(350, y + 10, 540, y + 10, 0.5);
    pdf.setFont(10, false);
    pdf.drawText(`Name: ${sigName}`, 350, y - 4);
    pdf.drawText(`Designation: ${sigDesig}`, 350, y - 18);

    this.triggerPdfDownload(pdf, `Authorised_Signatory_Letter_${companyName.replace(/\s+/g, "_")}.pdf`);
  }

  downloadBeneficialOwnershipPdf() {
    const companyName = this.getFormValue("registeredName") || "";
    const legalEntity = this.getFormValue("legalEntityName") || companyName;
    const address = this.getFormValue("registeredAddress") || "";
    const sigName = this.getFormValue("signatoryName") || this.getFormValue("kmpName") || "";
    const ownerName = this.getFormValue("kmpName") || this.getFormValue("contactName") || sigName;
    const sigDesig = this.getFormValue("signatoryDesignation") || "Director / Company Secretary";
    const today = this.todayStr();

    const pdf = new PdfBuilder();
    const m = 50, w = 495, lineH = 14, pageTop = 780;
    pdf.addPage();

    pdf.setFont(16, true);
    pdf.drawTextCentered("Annexure 3 - Beneficial Ownership Details", pageTop);
    pdf.setFont(11, false);
    pdf.drawTextCentered("(Limited & Private Limited)", pageTop - 22);
    pdf.drawLine(m, pageTop - 34, m + w, pageTop - 34, 2);

    let y = pageTop - 52;
    pdf.setFont(10, false);
    pdf.drawText(`Date: ${today}`, 420, y);
    y -= 30;
    pdf.drawText("To,", m, y);
    pdf.drawText("The Manager", m, y - lineH);
    pdf.drawText("Capital India Finance Limited", m, y - lineH * 2);
    y -= lineH * 4;

    pdf.setFont(10, true);
    pdf.drawText("Sub: Beneficial Ownership Details", m, y);
    y -= lineH * 2;

    pdf.setFont(9.5, false);
    const bodyText = `I, ${sigName}, authorized signatory of M/s ${companyName}, a company incorporated under the Companies Act, 1956 and having its registered office at ${address}, hereby declare and state that the following natural person of our company holds more than 10% of the shares or capital or profits of the company which falls within the definition of Beneficial ownership as defined under PMLA, 2002.`;
    y = this.pdfDrawParagraph(pdf, bodyText, m, y, w, 9.5, 13);
    y -= 16;

    const colW = [40, 175, 90, 75, 115];
    const headers = ["Sr.", "Name & Address", "Designation", "% Shares", "ID (PAN/Aadhaar)"];
    pdf.drawRect(m, y - 22, w, 22, "#2D3494");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont(8, true);
    let cx = m;
    headers.forEach((h, i) => { pdf.drawText(h, cx + 4, y - 6); pdf.drawCellBorder(cx, y - 22, colW[i], 22); cx += colW[i]; });
    pdf.setTextColor(0, 0, 0);
    y -= 22;

    const pdfBoOwners = this.getBeneficialOwners();
    const pdfBoFallback = [ownerName];
    const pdfBoData = pdfBoOwners.length > 0 ? pdfBoOwners : pdfBoFallback.map(name => ({ name, pan: this.getFormValue("panNo") || "", sharePercent: this.getFormValue("sharesPercent") || "100%" }));
    const desig = this.getFormValue("contactDesignation") || "Proprietor";

    for (let i = 0; i < Math.max(3, pdfBoData.length); i++) {
      const p = pdfBoData[i];
      const cellAddr = p ? `${p.name}, ${address}` : "";
      const cellLines = p ? pdf.wrapText(cellAddr, colW[1] - 8, 8) : [""];
      const rH = Math.max(cellLines.length * 11 + 8, 24);
      if (i % 2 === 0) pdf.drawRect(m, y - rH, w, rH, "#F2F4F8");
      pdf.setFont(8, false);
      cx = m;
      pdf.drawText(String(i + 1), cx + 4, y - 10); pdf.drawCellBorder(cx, y - rH, colW[0], rH); cx += colW[0];
      if (p) cellLines.forEach((ln, li) => pdf.drawText(ln, cx + 4, y - 10 - li * 11));
      pdf.drawCellBorder(cx, y - rH, colW[1], rH); cx += colW[1];
      pdf.drawText(p ? desig : "", cx + 4, y - 10); pdf.drawCellBorder(cx, y - rH, colW[2], rH); cx += colW[2];
      pdf.drawText(p ? p.sharePercent : "", cx + 4, y - 10); pdf.drawCellBorder(cx, y - rH, colW[3], rH); cx += colW[3];
      pdf.drawText(p ? p.pan : "", cx + 4, y - 10); pdf.drawCellBorder(cx, y - rH, colW[4], rH);
      y -= rH;
    }

    y -= 16;
    pdf.setFont(9.5, false);
    y = this.pdfDrawParagraph(pdf, "I further declare, in case of changes in the beneficial ownership structure of the company, I hereby undertake to furnish the details to you.", m, y, w, 9.5, 13);

    if (y < 140) { pdf.addPage(); y = pageTop; }
    y -= 40;
    pdf.setFont(10, true);
    pdf.drawText(`For M/s ${companyName}`, 330, y);
    y -= 40;
    pdf.drawLine(330, y + 10, 540, y + 10, 0.5);
    pdf.setFont(10, false);
    pdf.drawText(`Name: ${sigName}`, 330, y - 4);
    pdf.drawText(`Designation: ${sigDesig}`, 330, y - 18);

    this.triggerPdfDownload(pdf, `Beneficial_Ownership_${companyName.replace(/\s+/g, "_")}.pdf`);
  }

  downloadCorporateProfilePdf() {
    const companyName = this.getFormValue("registeredName") || "";
    const legalStatus = this.getRadioValue("legalStatusGroup") || "";
    const products = this.getCheckedValues("productsGroup");
    const productStr = products.length > 0 ? products.join(", ") : "";
    const stockExchange = this.getRadioValue("stockExchangeGroup") || "No";
    const sigName = this.getFormValue("signatoryName") || this.getFormValue("kmpName") || "";
    const sigDesig = this.getFormValue("signatoryDesignation") || legalStatus;
    const today = this.todayStr();

    const pdf = new PdfBuilder();
    const m = 50, w = 495, lineH = 14, pageTop = 780, pageBottom = 80;
    pdf.addPage();

    pdf.setFont(15, true);
    pdf.drawTextCentered("Annexure 2 - Corporate Profile", pageTop);
    pdf.setFont(10, false);
    pdf.drawTextCentered("Customer Profile - Money Changing Activities", pageTop - 20);
    pdf.drawTextCentered("(For Corporate, Goods & Services & Franchisees)", pageTop - 34);
    pdf.drawLine(m, pageTop - 44, m + w, pageTop - 44, 2);

    let y = pageTop - 60;
    pdf.setFont(8, false);
    y = this.pdfDrawParagraph(pdf, 'Note: Each supporting document has to be certified as "True Copy" by an authorized person indicating his name and designation.', m, y, w, 8, 11);
    y -= 12;

    const kycRows = [
      ["1", "Name of corporate entity", companyName],
      ["2", "Registered Office address", this.getFormValue("registeredAddress")],
      ["3", "Principal Place of Business", this.getFormValue("principalPlace") || this.getFormValue("registeredAddress")],
      ["4", "Date of Incorporation", this.getFormValue("dateOfIncorporation")],
      ["5", "PAN of the entity", this.getFormValue("panNo") || "-"],
      ["6", "Nature of business / type of activity", this.getFormValue("natureOfBusiness")],
      ["7", "Products offered / nature of services", productStr],
      ["8", "Location of branches", this.getFormValue("registeredAddress")],
      ["9", "Information about clients' business", (this.getFormValue("natureOfBusiness") || "NA") + ", " + (this.getFormValue("registeredAddress") || "NA")],
      ["10", "Listed on stock exchange(s)", stockExchange],
    ];

    const colW = [35, 185, 275];
    const drawTableHeader = (yy, headers) => {
      pdf.drawRect(m, yy - 20, w, 20, "#2D3494");
      pdf.setTextColor(255, 255, 255);
      pdf.setFont(9, true);
      let cx = m;
      headers.forEach((h, i) => { pdf.drawText(h, cx + 6, yy - 6); pdf.drawCellBorder(cx, yy - 20, colW[i], 20); cx += colW[i]; });
      pdf.setTextColor(0, 0, 0);
      return yy - 20;
    };

    y = drawTableHeader(y, ["Sr.", "KYC Particulars", "Details"]);

    const fontSize = 8.5;
    for (let r = 0; r < kycRows.length; r++) {
      const [sr, label, value] = kycRows[r];
      const valLines = pdf.wrapText(value || "", colW[2] - 12, fontSize);
      const labelLines = pdf.wrapText(label, colW[1] - 12, fontSize);
      const textRows = Math.max(valLines.length, labelLines.length, 1);
      const rowH = textRows * 12 + 10;

      if (y - rowH < pageBottom) { pdf.addPage(); y = pageTop; y = drawTableHeader(y, ["Sr.", "KYC Particulars", "Details"]); }
      if (r % 2 === 0) pdf.drawRect(m, y - rowH, w, rowH, "#F2F4F8");
      let cx = m;
      pdf.drawCellBorder(cx, y - rowH, colW[0], rowH); pdf.drawCellBorder(cx + colW[0], y - rowH, colW[1], rowH); pdf.drawCellBorder(cx + colW[0] + colW[1], y - rowH, colW[2], rowH);
      pdf.setFont(fontSize, true);
      pdf.drawText(sr, cx + 6, y - 10);
      labelLines.forEach((ln, i) => pdf.drawText(ln, cx + colW[0] + 6, y - 10 - i * 12));
      pdf.setFont(fontSize, false);
      valLines.forEach((ln, i) => pdf.drawText(ln, cx + colW[0] + colW[1] + 6, y - 10 - i * 12));
      y -= rowH;
    }

    y -= 20;
    if (y < 300) { pdf.addPage(); y = pageTop; }
    pdf.setFont(12, true);
    pdf.drawText("Management & Control Details", m, y);
    y -= 18;

    const mgmtColW = [35, 225, 235];
    const mgmtRows = [
      ["Ownership and control structure", `${legalStatus} - ${this.getFormValue("legalEntityName") || this.getFormValue("kmpName") || this.getFormValue("contactName")}`],
      ["Natural persons controlling entity", this.getFormValue("kmpName") || this.getFormValue("contactName")],
      ["Purpose of business relationship", "Foreign Exchange Purchase / TT for Tour Operations"],
      ["Name of Chairman", this.getFormValue("kmpName") || this.getFormValue("ceoName")],
      ["Name of MD / Partner / Trustee", this.getFormValue("mdName") || this.getFormValue("kmpName")],
      ["Name of CEO", this.getFormValue("ceoName") || this.getFormValue("kmpName")],
      ["Other directors / partners", this.getDirectorNames().join(", ")],
      ["Officials authorized for FX", this.getOfficialNames().join(", ") || this.getFormValue("contactName")],
      ["Names of bankers", this.getFormValue("bankName")],
      ["Sources of funds", "Business Revenue"],
      ["Annual estimated FX (INR)", this.getFormValue("annualFx")],
    ];

    pdf.drawRect(m, y - 20, w, 20, "#2D3494");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont(9, true);
    pdf.drawText("Particular", m + 41, y - 6);
    pdf.drawText("Details", m + 260 + 6, y - 6);
    pdf.drawCellBorder(m, y - 20, 260, 20);
    pdf.drawCellBorder(m + 260, y - 20, 235, 20);
    pdf.setTextColor(0, 0, 0);
    y -= 20;

    for (let r = 0; r < mgmtRows.length; r++) {
      const [label, value] = mgmtRows[r];
      const valLines = pdf.wrapText(value || "", 223, 8.5);
      const labelLines = pdf.wrapText(label, 248, 8.5);
      const textRows = Math.max(valLines.length, labelLines.length, 1);
      const rowH = textRows * 12 + 10;
      if (y - rowH < pageBottom) { pdf.addPage(); y = pageTop; }
      if (r % 2 === 0) pdf.drawRect(m, y - rowH, w, rowH, "#F2F4F8");
      pdf.drawCellBorder(m, y - rowH, 260, rowH);
      pdf.drawCellBorder(m + 260, y - rowH, 235, rowH);
      pdf.setFont(8.5, true);
      labelLines.forEach((ln, i) => pdf.drawText(ln, m + 6, y - 10 - i * 12));
      pdf.setFont(8.5, false);
      valLines.forEach((ln, i) => pdf.drawText(ln, m + 266, y - 10 - i * 12));
      y -= rowH;
    }

    y -= 24;
    if (y < 160) { pdf.addPage(); y = pageTop; }
    pdf.setFont(11, true);
    pdf.drawText("Declaration", m, y);
    y -= 16;
    pdf.setFont(8.5, false);
    y = this.pdfDrawParagraph(pdf, "We hereby certify and declare that all our transactions are bonafide transactions and that we will abide by the prevailing RBI rules, regulations, directives and notifications.", m, y, w, 8.5, 12);

    y -= 40;
    if (y < 120) { pdf.addPage(); y = pageTop; }
    pdf.setFont(10, true);
    pdf.drawText("Authorized Signatory", 360, y);
    y -= 35;
    pdf.drawLine(360, y + 10, 540, y + 10, 0.5);
    pdf.setFont(10, false);
    pdf.drawText(`Name: ${sigName}`, 360, y - 4);
    pdf.drawText(`Designation: ${sigDesig}`, 360, y - 18);
    pdf.drawText(`Date: ${today}`, 360, y - 32);
    pdf.setFont(9, false);
    pdf.drawText("(Round Seal)", 360, y - 50);

    this.triggerPdfDownload(pdf, `Corporate_Profile_KYC_${companyName.replace(/\s+/g, "_")}.pdf`);
  }

  downloadMouPdf() {
    const companyName = this.getFormValue("registeredName") || "[Company Name]";
    const address = this.getFormValue("registeredAddress") || "[Company Address]";
    const sigName = this.getFormValue("signatoryName") || this.getFormValue("kmpName") || "";
    const sigDesig = this.getFormValue("signatoryDesignation") || "";
    const today = this.todayStr();

    const pdf = new PdfBuilder();
    const m = 50, w = 495, pageTop = 780, pageBottom = 80;
    pdf.addPage();

    let y = pageTop;
    pdf.setFont(16, true);
    pdf.drawTextCentered("MEMORANDUM OF UNDERSTANDING (MOU)", y);
    pdf.drawLine(m, y - 12, m + w, y - 12, 2);
    y -= 32;

    pdf.setFont(9.5, false);
    y = this.pdfDrawParagraph(pdf, `This MOU is made on this ${today} ("Effective Date") by and between`, m, y, w, 9.5, 13);
    y -= 8;

    y = this.pdfDrawParagraph(pdf, `Capital India Finance Limited, a company incorporated under the laws of India and having its registered office at 701, 7th floor, Aggarwal Corporate Tower, Plot No. 23, District Centre, Rajendra Place, New Delhi - 110008, hereinafter referred to as "CIFL"`, m, y, w, 9.5, 13);
    y -= 8;

    pdf.setFont(11, true);
    pdf.drawTextCentered("AND", y);
    y -= 18;

    pdf.setFont(9.5, false);
    y = this.pdfDrawParagraph(pdf, `${companyName}, a company/legal entity incorporated under the applicable laws of India and having its registered office at ${address}, carrying out the business of Travels and Tour Operator, hereinafter referred to as "Client"`, m, y, w, 9.5, 13);
    y -= 12;

    pdf.setFont(11, true);
    pdf.drawText("WHEREAS:", m, y);
    y -= 16;
    pdf.setFont(9.5, false);
    y = this.pdfDrawParagraph(pdf, `A. CIFL is holding an Authorized Dealer Category II Money Changer License issued by the Reserve Bank of India ("RBI") and is inter-alia engaged in the business of dealing in Foreign Exchange.`, m, y, w, 9.5, 13);
    y -= 4;
    y = this.pdfDrawParagraph(pdf, `B. ${companyName} is in the business of Overseas Tour Management.`, m, y, w, 9.5, 13);
    y -= 4;
    y = this.pdfDrawParagraph(pdf, `C. ${companyName} desires to avail the services of CIFL for sale/purchase of foreign exchange and telegraphic transfer for its customers.`, m, y, w, 9.5, 13);
    y -= 12;

    const sections = [
      { title: "1. SCOPE OF SERVICES", items: [
        "1.1 The Client hereby appoints CIFL for providing foreign exchange services including sale/purchase of foreign currency and telegraphic transfers.",
        "1.2 The Client shall provide an Authorization Letter authorizing specific persons to transact on behalf of the Client.",
        "1.3 Service Requests shall be made via email or in person at CIFL branches.",
        "1.4 The Client shall provide all KYC documents as per AML/PMLA requirements.",
        "1.5 Foreign exchange shall be handed only to identified Customer representatives.",
        "1.6 For telegraphic transfers, TCS/tax collection responsibility shall be on the Client.",
        "1.7 The Client shall comply with all RBI/KYC/FEMA regulations.",
        "1.8 Payment shall be against clear funds only.",
        `1.9 The Client shall verify "Source of Funds" for all transactions.`,
      ]},
      { title: "2. KYC AND AML REQUIREMENTS", items: [
        "2.1 The Client shall provide all KYC documents as required under PMLA and RBI regulations.",
        "2.2 CIFL may request fresh KYC documents periodically.",
        "2.3 The Client shall notify CIFL immediately of any IATA/license revocations or regulatory actions.",
      ]},
      { title: "3. TERM AND TERMINATION", items: [
        "3.1 This MOU shall be effective for an initial term of 1 (one) year from the Effective Date and shall auto-renew for successive periods of 1 (one) year each.",
        "3.2 Either party may terminate this MOU by providing 30 days written notice.",
        "3.3 CIFL may immediately terminate this MOU in the event of any legal or compliance violation by the Client.",
      ]},
      { title: "4. LIMITATION OF LIABILITY", items: [
        "4.1 CIFL shall not be liable for: fraudulent transactions after delivery, third-party service failures, rejected service requests, delays in overseas disbursement, intermediary bank charges, incorrect client information, or remitting bank refusals.",
      ]},
    ];

    for (const sec of sections) {
      if (y < 100) { pdf.addPage(); y = pageTop; }
      pdf.setFont(11, true);
      pdf.drawText(sec.title, m, y);
      y -= 16;
      pdf.setFont(9, false);
      for (const item of sec.items) {
        if (y < pageBottom) { pdf.addPage(); y = pageTop; }
        y = this.pdfDrawParagraph(pdf, item, m, y, w, 9, 12);
        y -= 4;
      }
      y -= 8;
    }

    if (y < 180) { pdf.addPage(); y = pageTop; }
    y -= 10;
    const halfW = 240;
    pdf.setFont(9, true);
    pdf.drawText("FOR AND ON BEHALF OF", m, y);
    pdf.drawText("FOR AND ON BEHALF OF", m + halfW + 15, y);
    y -= 14;
    pdf.drawText("Capital India Finance Limited", m, y);
    pdf.drawText(companyName, m + halfW + 15, y);
    y -= 30;
    pdf.setFont(9, false);
    pdf.drawText("Signature: _______________", m, y);
    pdf.drawText("Signature: _______________", m + halfW + 15, y);
    y -= 16;
    pdf.drawText("Name:", m, y);
    pdf.drawText(`Name: ${sigName}`, m + halfW + 15, y);
    y -= 14;
    pdf.drawText("Designation:", m, y);
    pdf.drawText(`Designation: ${sigDesig}`, m + halfW + 15, y);
    y -= 14;
    pdf.drawText("Witness: _______________", m, y);
    pdf.drawText("Witness: _______________", m + halfW + 15, y);

    y -= 30;
    if (y < 160) { pdf.addPage(); y = pageTop; }
    pdf.setFont(10, true);
    pdf.drawText("ANNEXURE A - Tour Remittance Transaction Documents:", m, y);
    y -= 18;
    pdf.setFont(9, false);
    const annexItems = [
      "1. FORM A2 and Application cum declaration signed by the Authorised signatory",
      "2. Attested copy of Invoice from overseas beneficiary",
      "3. List of Passengers in excel sheet for whom the remittance is being made",
      "4. Self-attested Passport copies & PAN copies of passengers travelling abroad",
      "5. Air Ticket Copies and Visa Copies of passengers travelling abroad",
      "6. TCS Declaration",
      "7. Any other documentation as may be required by the remitting bank",
    ];
    for (const item of annexItems) {
      if (y < pageBottom) { pdf.addPage(); y = pageTop; }
      pdf.drawText(item, m, y);
      y -= 14;
    }

    this.triggerPdfDownload(pdf, `Tour_Operator_MOU_${companyName.replace(/\s+/g, "_")}.pdf`);
  }

  downloadDocx() {
    const products = this.getCheckedValues("productsGroup");
    const productStr = products.length > 0 ? products.join(", ") : "Not specified";
    const stockListed = this.getRadioValue("stockExchangeGroup");
    const caseReg = this.getRadioValue("caseRegisteredGroup");

    const bankDetails = this.getFormValue("bankName") || "";

    const rows = [
      ["1", "Registered Name", this.getFormValue("registeredName")],
      ["2", "Legal Status", this.getRadioValue("legalStatusGroup")],
      ["2", "Registered Office Address", this.getFormValue("registeredAddress")],
      ["3", "Principal Place of Business", this.getFormValue("principalPlace") || "Same as Registered Address"],
      ["4", "Date of Incorporation", this.getFormValue("dateOfIncorporation")],
      ["5", "PAN No", this.getFormValue("panNo") || "—"],
      ["6", "Nature of Business", this.getFormValue("natureOfBusiness")],
      ["7", "Listed on Stock Exchange", stockListed],
      ["8", "Company Website", this.getFormValue("companyWebsite") || "—"],
      ["", "MSME/Udyam Number", this.getFormValue("udyamNumber") || "—"],
      ["9", "Products to be Availed", productStr],
      ["10", "Annual Estimated FX (INR)", this.getFormValue("annualFx") || "—"],
      ["11", "Contact Person", `Name: ${this.getFormValue("contactName")}, Designation: ${this.getFormValue("contactDesignation")}, Mobile: ${this.getFormValue("contactMobile")}, Email: ${this.getFormValue("contactEmail")}`],
      ["12", "Key Managerial Person", this.getKmpNames().join(", ")],
      ["13", "CEO Details", `Name: ${this.getFormValue("ceoName")}, Mobile: ${this.getFormValue("ceoMobile")}, Email: ${this.getFormValue("ceoEmail")}`],
      ["14", "MD / Partner / Trustee", `Name: ${this.getFormValue("mdName")}, Mobile: ${this.getFormValue("mdMobile")}, Email: ${this.getFormValue("mdEmail")}`],
      ["15", "Directors / Partners", this.getDirectorNames().join(", ")],
      ["16", "Authorized Officials for FX", this.getOfficialNames().join(", ")],
      ["17", "Banking Details", bankDetails],
      ["18", "Case/Complaint Registered", caseReg],
    ];

    const tableRows = rows.map(([sr, particular, value]) => `
      <w:tr>
        <w:tc><w:tcPr><w:tcW w:w="700" w:type="dxa"/></w:tcPr><w:p><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>${this.escXml(sr)}</w:t></w:r></w:p></w:tc>
        <w:tc><w:tcPr><w:tcW w:w="3600" w:type="dxa"/></w:tcPr><w:p><w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>${this.escXml(particular)}</w:t></w:r></w:p></w:tc>
        <w:tc><w:tcPr><w:tcW w:w="5200" w:type="dxa"/></w:tcPr><w:p><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>${this.escXml(value)}</w:t></w:r></w:p></w:tc>
      </w:tr>
    `).join("");

    const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
  xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
  xmlns:w10="urn:schemas-microsoft-com:office:word"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"
  mc:Ignorable="w14 wp14">
  <w:body>
    <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>Client Onboarding Form (Corporates &amp; Tour Operators)</w:t></w:r></w:p>
    <w:p/>
    <w:tbl>
      <w:tblPr>
        <w:tblStyle w:val="TableGrid"/>
        <w:tblW w:w="9500" w:type="dxa"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>
          <w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>
          <w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>
          <w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>
          <w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/>
          <w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tblGrid><w:gridCol w:w="700"/><w:gridCol w:w="3600"/><w:gridCol w:w="5200"/></w:tblGrid>
      <w:tr>
        <w:tc><w:tcPr><w:tcW w:w="700" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="D9E2F3"/></w:tcPr><w:p><w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>Sr.</w:t></w:r></w:p></w:tc>
        <w:tc><w:tcPr><w:tcW w:w="3600" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="D9E2F3"/></w:tcPr><w:p><w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>Particulars</w:t></w:r></w:p></w:tc>
        <w:tc><w:tcPr><w:tcW w:w="5200" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="D9E2F3"/></w:tcPr><w:p><w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>Details</w:t></w:r></w:p></w:tc>
      </w:tr>
      ${tableRows}
    </w:tbl>
    <w:p/>
    <w:p><w:pPr><w:pBdr><w:top w:val="single" w:sz="4" w:space="1" w:color="auto"/><w:left w:val="single" w:sz="4" w:space="4" w:color="auto"/><w:bottom w:val="single" w:sz="4" w:space="1" w:color="auto"/><w:right w:val="single" w:sz="4" w:space="4" w:color="auto"/></w:pBdr></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>Declaration</w:t></w:r></w:p>
    <w:p><w:pPr><w:pBdr><w:left w:val="single" w:sz="4" w:space="4" w:color="auto"/><w:bottom w:val="single" w:sz="4" w:space="1" w:color="auto"/><w:right w:val="single" w:sz="4" w:space="4" w:color="auto"/></w:pBdr></w:pPr><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>We hereby certify and declare that all our transactions are Bonafide transactions and that we will abide by the prevailing RBI rules, regulations, directives and notifications. We hereby indemnify CIFL and agree to keep it always indemnified against any claims, losses, damages, fines, penalties, cost, expenses, that may accrue or arise to CIFL because of our non-compliance to such regulatory requirements. We irrevocably agree and undertake to provide additional details of any transactions if so desired by the CIFL or that may be required by any government/regulatory authority from time to time. We hereby confirm and present that the person signing herein below has full authority to do so and execution hereof by him creates a legal, valid binding and enforceable obligation on us.</w:t></w:r></w:p>
    <w:p/><w:p/><w:p/>
    <w:p><w:pPr><w:jc w:val="right"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>Authorized Signatory</w:t></w:r></w:p>
    <w:p><w:pPr><w:jc w:val="right"/></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>Name: ${this.escXml(this.getFormValue("signatoryName"))}</w:t></w:r></w:p>
    <w:p><w:pPr><w:jc w:val="right"/></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>Designation: ${this.escXml(this.getFormValue("signatoryDesignation"))}</w:t></w:r></w:p>
    <w:p><w:pPr><w:jc w:val="right"/></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>Date: ${this.escXml(this.todayFormatted())}</w:t></w:r></w:p>
    <w:p><w:pPr><w:jc w:val="right"/></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>(Round Seal)</w:t></w:r></w:p>
  </w:body>
</w:document>`;

    const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
</Types>`;

    const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

    const wordRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
</Relationships>`;

    const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr></w:rPrDefault>
    <w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="table" w:styleId="TableGrid">
    <w:name w:val="Table Grid"/>
    <w:tblPr>
      <w:tblBorders>
        <w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>
        <w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>
        <w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>
        <w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>
        <w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/>
        <w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/>
      </w:tblBorders>
    </w:tblPr>
  </w:style>
</w:styles>`;

    const settingsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat>
</w:settings>`;

    this.createDocxZip({
      "[Content_Types].xml": contentTypes,
      "_rels/.rels": rels,
      "word/_rels/document.xml.rels": wordRels,
      "word/document.xml": docXml,
      "word/styles.xml": stylesXml,
      "word/settings.xml": settingsXml
    });
  }

  docxContentTypes() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
</Types>`;
  }

  docxRels() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
  }

  docxWordRels() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
</Relationships>`;
  }

  docxStyles() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="table" w:styleId="TableGrid">
    <w:name w:val="Table Grid"/>
    <w:tblPr>
      <w:tblBorders>
        <w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>
        <w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>
        <w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>
        <w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>
        <w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/>
        <w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/>
      </w:tblBorders>
    </w:tblPr>
  </w:style>
</w:styles>`;
  }

  docxSettings() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat>
</w:settings>`;
  }

  buildAndDownloadDocx(bodyXml, filename) {
    const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>${bodyXml}</w:body></w:document>`;
    this.createDocxZip({
      "[Content_Types].xml": this.docxContentTypes(),
      "_rels/.rels": this.docxRels(),
      "word/_rels/document.xml.rels": this.docxWordRels(),
      "word/document.xml": docXml,
      "word/styles.xml": this.docxStyles(),
      "word/settings.xml": this.docxSettings(),
    }, filename);
  }

  wp(text, opts = {}) {
    const rpr = [];
    if (opts.bold) rpr.push("<w:b/>");
    if (opts.size) rpr.push(`<w:sz w:val="${opts.size}"/>`);
    if (opts.underline) rpr.push(`<w:u w:val="single"/>`);
    const rprStr = rpr.length ? `<w:rPr>${rpr.join("")}</w:rPr>` : "";
    const ppr = [];
    if (opts.align) ppr.push(`<w:jc w:val="${opts.align}"/>`);
    if (opts.spacing) ppr.push(`<w:spacing w:after="${opts.spacing}"/>`);
    const pprStr = ppr.length ? `<w:pPr>${ppr.join("")}</w:pPr>` : "";
    return `<w:p>${pprStr}<w:r>${rprStr}<w:t xml:space="preserve">${this.escXml(text)}</w:t></w:r></w:p>`;
  }

  wtc(text, width, opts = {}) {
    const rpr = [];
    if (opts.bold) rpr.push("<w:b/>");
    if (opts.size) rpr.push(`<w:sz w:val="${opts.size}"/>`);
    const rprStr = rpr.length ? `<w:rPr>${rpr.join("")}</w:rPr>` : "";
    return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/></w:tcPr><w:p><w:r>${rprStr}<w:t xml:space="preserve">${this.escXml(text)}</w:t></w:r></w:p></w:tc>`;
  }

  wtr(cells) { return `<w:tr>${cells.join("")}</w:tr>`; }

  wtbl(rows) {
    return `<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="9500" w:type="dxa"/></w:tblPr>${rows.join("")}</w:tbl>`;
  }

  todayStr() {
    const d = new Date();
    return `${d.getDate().toString().padStart(2,"0")}/${(d.getMonth()+1).toString().padStart(2,"0")}/${d.getFullYear()}`;
  }

  downloadAuthSignatoryDocx() {
    const e = (k) => this.escXml(this.getFormValue(k));
    const companyName = this.getFormValue("registeredName") || "";
    const sigName = this.getFormValue("signatoryName") || this.getFormValue("kmpName") || "";
    const sigDesig = this.getFormValue("signatoryDesignation") || this.getFormValue("contactDesignation") || "";
    const contactName = this.getFormValue("contactName") || sigName;
    const contactDesig = this.getFormValue("contactDesignation") || sigDesig;
    const ceoName = this.getFormValue("ceoName") || sigName;

    const body = [
      this.wp("(To be obtained on the Company/Firms Letter Head)", {align: "center", size: 18}),
      this.wp(""),
      this.wp(`Date: ${this.todayStr()}`, {align: "right"}),
      this.wp(""),
      this.wp("The Manager"),
      this.wp("Capital India Finance Limited"),
      this.wp(""),
      this.wp("Sub: Authority to Place Request / Authorized Signatory for Purchase / Sales of Foreign Exchange", {bold: true, size: 22}),
      this.wp(""),
      this.wp("Dear Sir,"),
      this.wp(""),
      this.wp(`I/We, ${companyName} (hereinafter referred to as "APPLICANT") have authorized the following person(s) as an authorized representative(s) of the APPLICANT to execute foreign exchange transactions with M/s Capital India Finance Limited (CIFL), from time to time, and to purchase Foreign Exchange for and on behalf of the APPLICANT against Cheque issued by the APPLICANT or against credit. We have specifically authorized the person(s) named herein below to sign request letter for purchase / surrender of foreign exchange for the employees of the APPLICANT travelling abroad for and on behalf of the APPLICANT. We hereby take the complete responsibility for any transaction undertaken by the said authorized representative(s) with CIFL.`, {size: 20}),
      this.wp(""),
      this.wp("The Signature of the authorized person(s)/representative(s) is attested below:", {bold: true}),
      this.wp(""),
      this.wtbl([
        this.wtr([
          this.wtc("Sr. No", 800, {bold: true, size: 20}),
          this.wtc("Name", 3400, {bold: true, size: 20}),
          this.wtc("Designation", 2800, {bold: true, size: 20}),
          this.wtc("Signature", 2500, {bold: true, size: 20}),
        ]),
        this.wtr([
          this.wtc("1", 800, {size: 20}),
          this.wtc(contactName, 3400, {size: 20}),
          this.wtc(contactDesig, 2800, {size: 20}),
          this.wtc("", 2500, {size: 20}),
        ]),
        this.wtr([
          this.wtc("2", 800, {size: 20}),
          this.wtc(ceoName, 3400, {size: 20}),
          this.wtc(sigDesig, 2800, {size: 20}),
          this.wtc("", 2500, {size: 20}),
        ]),
      ]),
      this.wp(""),
      this.wp("This authority is irrevocable and binding on the APPLICANT as long as the APPLICANT continues to deal with CIFL for its Foreign Exchange requirements. Further the APPLICANT is responsible to make payment for the foreign exchange released to the APPLICANT and its employees by CIFL from time to time under the instructions of our aforesaid authorized representative(s).", {size: 20}),
      this.wp(""),
      this.wp("In the event, we wish to change our authorized representative(s) for any reason whatsoever, it shall be mandatory on our part to inform the same in writing to CIFL and such writing must be acknowledged by the authorized representative(s) of CIFL. However, we specifically admit that any transaction undertaken by our aforesaid authorized representative(s) with CIFL, prior to the receipt of our written communication intimating the aforesaid modification for change of the APPLICANT's 'authorized representative(s)' shall be binding on us. We further declare that the undersigned has the approval from Board to give this letter of authority on behalf of the APPLICANT.", {size: 20}),
      this.wp(""),
      this.wp("The identity proofs of the aforesaid authorized person(s) and for the undersigned are enclosed herewith.", {size: 20}),
      this.wp(""),
      this.wp(`For ${companyName}`, {bold: true}),
      this.wp(""),
      this.wp(""),
      this.wp("Signature: ___________________________"),
      this.wp(`Name: ${sigName}`),
      this.wp(`Designation: ${sigDesig}`),
      this.wp(""),
      this.wp("Encl.: Officially valid documents of"),
      this.wp("1. PAN Card"),
      this.wp("2. Aadhaar Card"),
    ];

    this.buildAndDownloadDocx(body.join(""), `Authorised_Signatory_Letter_${companyName.replace(/\s+/g,"_")}.docx`);
  }

  downloadBeneficialOwnershipDocx() {
    const companyName = this.getFormValue("registeredName") || "";
    const address = this.getFormValue("registeredAddress") || "";
    const sigName = this.getFormValue("signatoryName") || this.getFormValue("kmpName") || "";
    const ownerName = this.getFormValue("kmpName") || this.getFormValue("contactName") || sigName;

    const body = [
      this.wp("Annexure 3 - Beneficial Ownership Details", {bold: true, align: "center", size: 24}),
      this.wp("(Limited & Private Limited)", {align: "center", size: 20}),
      this.wp(""),
      this.wp(`Date: ${this.todayStr()}`, {align: "right"}),
      this.wp(""),
      this.wp("To,"),
      this.wp("The Manager"),
      this.wp("Capital India Finance Limited"),
      this.wp(""),
      this.wp("Dear Sir,"),
      this.wp(""),
      this.wp("Sub: Beneficial Ownership Details", {bold: true, underline: true}),
      this.wp(""),
      this.wp(`I, ${sigName}, authorized signatory of M/s ${companyName}, a company incorporated under the Companies Act, 1956 and having its registered office at ${address}, hereby declare and state that the following natural person of our company holds more than 10% of the shares or capital or profits of the company which falls within the definition of Beneficial ownership as defined under PMLA, 2002.`, {size: 20}),
      this.wp(""),
      this.wtbl([
        this.wtr([
          this.wtc("Sr.No.", 600, {bold: true, size: 20}),
          this.wtc("Name and address of the natural person/s", 3200, {bold: true, size: 20}),
          this.wtc("Designation", 1600, {bold: true, size: 20}),
          this.wtc("% of shares held", 1400, {bold: true, size: 20}),
          this.wtc("ID No (PAN/Aadhaar)", 2700, {bold: true, size: 20}),
        ]),
        this.wtr([
          this.wtc("1", 600, {size: 20}),
          this.wtc(`${ownerName}, ${address}`, 3200, {size: 20}),
          this.wtc(this.getFormValue("contactDesignation") || "Proprietor", 1600, {size: 20}),
          this.wtc("100%", 1400, {size: 20}),
          this.wtc(this.getFormValue("panNo") || "", 2700, {size: 20}),
        ]),
        this.wtr([
          this.wtc("2", 600, {size: 20}),
          this.wtc("", 3200, {size: 20}),
          this.wtc("", 1600, {size: 20}),
          this.wtc("", 1400, {size: 20}),
          this.wtc("", 2700, {size: 20}),
        ]),
        this.wtr([
          this.wtc("3", 600, {size: 20}),
          this.wtc("", 3200, {size: 20}),
          this.wtc("", 1600, {size: 20}),
          this.wtc("", 1400, {size: 20}),
          this.wtc("", 2700, {size: 20}),
        ]),
      ]),
      this.wp(""),
      this.wp("I further declare, in case of changes in the beneficial ownership structure of the company, I hereby undertake to furnish the details to you.", {size: 20}),
      this.wp(""),
      this.wp(""),
      this.wp(`For M/s ${companyName}`, {bold: true}),
      this.wp(""),
      this.wp(""),
      this.wp(`Name: ${sigName}`),
      this.wp(`Designation: ${this.getFormValue("signatoryDesignation") || "Director / Company Secretary"}`),
    ];

    this.buildAndDownloadDocx(body.join(""), `Beneficial_Ownership_${companyName.replace(/\s+/g,"_")}.docx`);
  }

  downloadCorporateProfileDocx() {
    const e = (k) => this.getFormValue(k) || "";
    const companyName = e("registeredName");
    const legalStatus = this.getRadioValue("legalStatusGroup") || "";
    const stockExchange = this.getRadioValue("stockExchangeGroup") || "No";
    const products = this.getCheckedValues("productsGroup");
    const productStr = products.length > 0 ? products.join(", ") : "";

    const kycRows = [
      ["1", "Name of corporate entity", companyName],
      ["2", "Registered Office address", e("registeredAddress")],
      ["3", "Principal Place of Business", e("principalPlace") || e("registeredAddress")],
      ["4", "Date of Incorporation", e("dateOfIncorporation")],
      ["5", "PAN of the entity", e("panNo")],
      ["6", "Nature of business / type of activity", e("natureOfBusiness")],
      ["7", "Products offered / nature of services", productStr],
      ["8", "Location of branches", e("registeredAddress")],
      ["9", "Information about clients' business", (e("natureOfBusiness") || "NA") + ", " + (e("registeredAddress") || "NA")],
      ["10", "Listed on stock exchange(s)", stockExchange],
    ];

    const mgmtRows = [
      ["Ownership and control structure", `${legalStatus} - ${e("legalEntityName") || e("kmpName") || e("contactName")}`],
      ["Names of natural persons controlling entity", e("kmpName") || e("contactName")],
      ["Purpose of business relationship", "Foreign Exchange Purchase / Telegraphic Transfer for Tour Operations"],
      ["Name of Chairman", e("kmpName") || e("ceoName")],
      ["Name of Managing Director / Partner / Trustee", e("mdName") || e("kmpName")],
      ["Name of Chief Executive Officer", e("ceoName") || e("kmpName")],
      ["Names of other directors / partners", e("directors")],
      ["Names of officials authorized for FX", e("authorizedOfficials") || e("contactName")],
      ["Names of bankers", e("bankName")],
      ["Sources of funds", "Business Revenue"],
      ["Annual estimated FX required (INR)", e("annualFx")],
    ];

    const body = [
      this.wp("Annexure 2 - Corporate Profile", {bold: true, align: "center", size: 26}),
      this.wp("Customer Profile - Money Changing Activities", {align: "center", size: 22}),
      this.wp("(For Corporate, Goods & Services & Franchisees)", {align: "center", size: 18}),
      this.wp(""),
      this.wp("Note: Each supporting document has to be certified as \"True Copy\" by an authorized person indicating his name and designation.", {size: 18}),
      this.wp(""),
      this.wtbl([
        this.wtr([
          this.wtc("Sr. No.", 700, {bold: true, size: 20}),
          this.wtc("KYC Particulars", 4000, {bold: true, size: 20}),
          this.wtc("Details", 4800, {bold: true, size: 20}),
        ]),
        ...kycRows.map(([sr, label, val]) =>
          this.wtr([
            this.wtc(sr, 700, {size: 20}),
            this.wtc(label, 4000, {size: 20}),
            this.wtc(val, 4800, {size: 20}),
          ])
        ),
      ]),
      this.wp(""),
      this.wp("Management & Control Details", {bold: true, size: 22}),
      this.wp(""),
      this.wtbl([
        this.wtr([
          this.wtc("Particular", 4500, {bold: true, size: 20}),
          this.wtc("Details", 5000, {bold: true, size: 20}),
        ]),
        ...mgmtRows.map(([label, val]) =>
          this.wtr([
            this.wtc(label, 4500, {size: 20}),
            this.wtc(val, 5000, {size: 20}),
          ])
        ),
      ]),
      this.wp(""),
      this.wp("Declaration", {bold: true, size: 22}),
      this.wp("We hereby certify and declare that all our transactions are bonafide transactions and that we will abide by the prevailing RBI rules, regulations, directives and notifications.", {size: 20}),
      this.wp(""),
      this.wp(""),
      this.wp("Authorized Signatory", {bold: true, align: "right"}),
      this.wp(`Name: ${e("signatoryName") || e("kmpName")}`, {align: "right"}),
      this.wp(`Designation: ${e("signatoryDesignation") || legalStatus}`, {align: "right"}),
      this.wp(`Date: ${this.todayStr()}`, {align: "right"}),
      this.wp("(Round Seal)", {align: "right"}),
    ];

    this.buildAndDownloadDocx(body.join(""), `Corporate_Profile_KYC_${companyName.replace(/\s+/g,"_")}.docx`);
  }

  downloadMouDocx() {
    const companyName = this.getFormValue("registeredName") || "[Company Name]";
    const address = this.getFormValue("registeredAddress") || "[Company Address]";
    const sigName = this.getFormValue("signatoryName") || this.getFormValue("kmpName") || "";
    const sigDesig = this.getFormValue("signatoryDesignation") || "";
    const today = this.todayStr();

    const body = [
      this.wp("MEMORANDUM OF UNDERSTANDING (MOU)", {bold: true, align: "center", size: 28}),
      this.wp(""),
      this.wp(`This MOU is made on this ${today} ("Effective Date") by and between`, {size: 20}),
      this.wp(""),
      this.wp("Capital India Finance Limited, a company incorporated under the laws of India and having its registered office at 701, 7th floor, Aggarwal Corporate Tower, Plot No. 23, District Centre, Rajendra Place, New Delhi - 110008, hereinafter referred to as \"CIFL\"", {size: 20, bold: false}),
      this.wp(""),
      this.wp("AND", {bold: true, align: "center", size: 22}),
      this.wp(""),
      this.wp(`${companyName}, a company/legal entity incorporated under the applicable laws of India and having its registered office at ${address}, carrying out the business of Travels and Tour Operator, hereinafter referred to as "Client"`, {size: 20}),
      this.wp(""),
      this.wp("WHEREAS:", {bold: true, size: 22}),
      this.wp(`A. CIFL is holding an Authorized Dealer Category II Money Changer License issued by the Reserve Bank of India ("RBI") and is inter-alia engaged in the business of dealing in Foreign Exchange.`, {size: 20}),
      this.wp(`B. ${companyName} is in the business of Overseas Tour Management.`, {size: 20}),
      this.wp(`C. ${companyName} desires to avail the services of CIFL for sale/purchase of foreign exchange and telegraphic transfer for its customers.`, {size: 20}),
      this.wp(""),
      this.wp("1. SCOPE OF SERVICES", {bold: true, size: 22}),
      this.wp(`1.1 The Client hereby appoints CIFL for providing foreign exchange services including sale/purchase of foreign currency and telegraphic transfers.`, {size: 20}),
      this.wp(`1.2 The Client shall provide an Authorization Letter authorizing specific persons to transact on behalf of the Client.`, {size: 20}),
      this.wp(`1.3 Service Requests shall be made via email or in person at CIFL branches.`, {size: 20}),
      this.wp(`1.4 The Client shall provide all KYC documents as per AML/PMLA requirements.`, {size: 20}),
      this.wp(`1.5 Foreign exchange shall be handed only to identified Customer representatives.`, {size: 20}),
      this.wp(`1.6 For telegraphic transfers, TCS/tax collection responsibility shall be on the Client.`, {size: 20}),
      this.wp(`1.7 The Client shall comply with all RBI/KYC/FEMA regulations.`, {size: 20}),
      this.wp(`1.8 Payment shall be against clear funds only.`, {size: 20}),
      this.wp(`1.9 The Client shall verify "Source of Funds" for all transactions.`, {size: 20}),
      this.wp(""),
      this.wp("2. KYC AND AML REQUIREMENTS", {bold: true, size: 22}),
      this.wp(`2.1 The Client shall provide all KYC documents as required under PMLA and RBI regulations.`, {size: 20}),
      this.wp(`2.2 CIFL may request fresh KYC documents periodically.`, {size: 20}),
      this.wp(`2.3 The Client shall notify CIFL immediately of any IATA/license revocations or regulatory actions.`, {size: 20}),
      this.wp(""),
      this.wp("3. TERM AND TERMINATION", {bold: true, size: 22}),
      this.wp(`3.1 This MOU shall be effective for an initial term of 1 (one) year from the Effective Date and shall auto-renew for successive periods of 1 (one) year each.`, {size: 20}),
      this.wp(`3.2 Either party may terminate this MOU by providing 30 days written notice.`, {size: 20}),
      this.wp(`3.3 CIFL may immediately terminate this MOU in the event of any legal or compliance violation by the Client.`, {size: 20}),
      this.wp(""),
      this.wp("4. LIMITATION OF LIABILITY", {bold: true, size: 22}),
      this.wp(`4.1 CIFL shall not be liable for: fraudulent transactions after delivery, third-party service failures, rejected service requests, delays in overseas disbursement, intermediary bank charges, incorrect client information, or remitting bank refusals.`, {size: 20}),
      this.wp(""),
      this.wp(""),
      this.wtbl([
        this.wtr([
          this.wtc("FOR AND ON BEHALF OF", 4750, {bold: true, size: 20}),
          this.wtc("FOR AND ON BEHALF OF", 4750, {bold: true, size: 20}),
        ]),
        this.wtr([
          this.wtc("Capital India Finance Limited", 4750, {bold: true, size: 20}),
          this.wtc(companyName, 4750, {bold: true, size: 20}),
        ]),
        this.wtr([
          this.wtc("Signature: _______________", 4750, {size: 20}),
          this.wtc("Signature: _______________", 4750, {size: 20}),
        ]),
        this.wtr([
          this.wtc("Name:", 4750, {size: 20}),
          this.wtc(`Name: ${sigName}`, 4750, {size: 20}),
        ]),
        this.wtr([
          this.wtc("Designation:", 4750, {size: 20}),
          this.wtc(`Designation: ${sigDesig}`, 4750, {size: 20}),
        ]),
        this.wtr([
          this.wtc("Witness: _______________", 4750, {size: 20}),
          this.wtc("Witness: _______________", 4750, {size: 20}),
        ]),
      ]),
      this.wp(""),
      this.wp("ANNEXURE A - Tour Remittance Transaction Documents:", {bold: true, size: 22}),
      this.wp("1. FORM A2 and Application cum declaration signed by the Authorised signatory", {size: 20}),
      this.wp("2. Attested copy of Invoice from overseas beneficiary", {size: 20}),
      this.wp("3. List of Passengers in excel sheet for whom the remittance is being made", {size: 20}),
      this.wp("4. Self-attested Passport copies & PAN copies of passengers travelling abroad", {size: 20}),
      this.wp("5. Air Ticket Copies and Visa Copies of passengers travelling abroad", {size: 20}),
      this.wp("6. TCS Declaration", {size: 20}),
      this.wp("7. Any other documentation as may be required by the remitting bank", {size: 20}),
    ];

    this.buildAndDownloadDocx(body.join(""), `Tour_Operator_MOU_${companyName.replace(/\s+/g,"_")}.docx`);
  }

  escXml(str) {
    return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  createDocxZip(files, filename) {
    const encoder = new TextEncoder();
    const parts = [];
    const centralDir = [];
    let offset = 0;
    const fileCount = Object.keys(files).length;

    for (const [name, content] of Object.entries(files)) {
      const nameBytes = encoder.encode(name);
      const contentBytes = encoder.encode(content);
      const crc = this.crc32(contentBytes);

      // Local file header (30 bytes + filename)
      const localHeader = new Uint8Array(30 + nameBytes.length);
      const lv = new DataView(localHeader.buffer);
      lv.setUint32(0, 0x04034b50, true);   // signature
      lv.setUint16(4, 20, true);            // version needed
      lv.setUint16(6, 0, true);             // flags
      lv.setUint16(8, 0, true);             // compression = STORED (0)
      lv.setUint16(10, 0, true);            // mod time
      lv.setUint16(12, 0, true);            // mod date
      lv.setUint32(14, crc, true);          // crc32
      lv.setUint32(18, contentBytes.length, true); // compressed size
      lv.setUint32(22, contentBytes.length, true); // uncompressed size
      lv.setUint16(26, nameBytes.length, true);    // filename length
      lv.setUint16(28, 0, true);            // extra field length
      localHeader.set(nameBytes, 30);

      // Central directory entry (46 bytes + filename)
      const cdEntry = new Uint8Array(46 + nameBytes.length);
      const cv = new DataView(cdEntry.buffer);
      cv.setUint32(0, 0x02014b50, true);    // signature
      cv.setUint16(4, 20, true);             // version made by
      cv.setUint16(6, 20, true);             // version needed
      cv.setUint16(8, 0, true);              // flags
      cv.setUint16(10, 0, true);             // compression = STORED (0)
      cv.setUint16(12, 0, true);             // mod time
      cv.setUint16(14, 0, true);             // mod date
      cv.setUint32(16, crc, true);           // crc32
      cv.setUint32(20, contentBytes.length, true); // compressed size
      cv.setUint32(24, contentBytes.length, true); // uncompressed size
      cv.setUint16(28, nameBytes.length, true);    // filename length
      cv.setUint16(30, 0, true);             // extra field length
      cv.setUint16(32, 0, true);             // comment length
      cv.setUint16(34, 0, true);             // disk number
      cv.setUint16(36, 0, true);             // internal attrs
      cv.setUint32(38, 0, true);             // external attrs
      cv.setUint32(42, offset, true);        // local header offset
      cdEntry.set(nameBytes, 46);

      parts.push(localHeader, contentBytes);
      centralDir.push(cdEntry);
      offset += localHeader.length + contentBytes.length;
    }

    const cdOffset = offset;
    let cdSize = 0;
    for (const cd of centralDir) cdSize += cd.length;

    // End of central directory (22 bytes)
    const eocd = new Uint8Array(22);
    const ev = new DataView(eocd.buffer);
    ev.setUint32(0, 0x06054b50, true);       // signature
    ev.setUint16(4, 0, true);                // disk number
    ev.setUint16(6, 0, true);                // disk with CD start
    ev.setUint16(8, fileCount, true);         // entries on this disk
    ev.setUint16(10, fileCount, true);        // total entries
    ev.setUint32(12, cdSize, true);           // CD size
    ev.setUint32(16, cdOffset, true);         // CD offset

    const blob = new Blob([...parts, ...centralDir, eocd], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || `Corporate_Client_Onboarding_${this.getFormValue("registeredName").replace(/\s+/g, "_") || "Form"}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showToast(`${a.download} downloaded!`, "success");
  }

  crc32(data) {
    let crc = -1;
    const table = new Int32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      table[i] = c;
    }
    for (let i = 0; i < data.length; i++) crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ -1) >>> 0;
  }

  openSettings() {
    const modal = document.getElementById("settingsModal");
    modal.style.display = "flex";
    document.getElementById("geminiKeyInput").value = this.geminiKey;
    document.getElementById("geminiStatus").style.display = "none";
  }

  closeSettings() {
    document.getElementById("settingsModal").style.display = "none";
  }

  saveSettings() {
    const key = document.getElementById("geminiKeyInput").value.trim();
    this.geminiKey = key;
    if (key) localStorage.setItem("geminiApiKey", key);
    else localStorage.removeItem("geminiApiKey");
    this.closeSettings();
    this.showToast(key ? "AI extraction enabled!" : "AI extraction disabled", key ? "success" : "info");
  }

  async testGeminiKey() {
    const key = document.getElementById("geminiKeyInput").value.trim();
    const status = document.getElementById("geminiStatus");
    if (!key) {
      status.style.display = "block";
      status.style.background = "#fff3cd";
      status.style.color = "#856404";
      status.textContent = "Please enter an API key first.";
      return;
    }
    status.style.display = "block";
    status.style.background = "#e3f2fd";
    status.style.color = "#1565c0";
    status.textContent = "Testing connection...";
    try {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Reply with just: OK" }] }] })
      });
      if (resp.ok) {
        status.style.background = "#e8f5e9";
        status.style.color = "#2e7d32";
        status.textContent = "Connection successful! Gemini AI is ready.";
      } else {
        const err = await resp.json().catch(() => ({}));
        status.style.background = "#ffebee";
        status.style.color = "#c62828";
        status.textContent = `Failed: ${err.error?.message || resp.statusText}`;
      }
    } catch (e) {
      status.style.background = "#ffebee";
      status.style.color = "#c62828";
      status.textContent = `Network error: ${e.message}`;
    }
  }

  buildGeminiPrompt(text, filename, docType) {
    const cat = this.activeFormCategory || "cifl";
    const isTxn = cat.includes("Fit") || cat.includes("Mice") || cat.includes("fit") || cat.includes("mice");
    const catLabel = { cifl: "CIFL Onboarding", indel: "Indel Onboarding", ciflFit: "CIFL FIT Transactions", ciflMice: "CIFL MICE Transactions", indelFit: "Indel FIT Transactions", indelMice: "Indel MICE Transactions" }[cat] || "Corporate Onboarding";

    const companyFields = `
  "companyName": "registered company/firm/entity name as on official documents",
  "legalName": "legal name if different from trade/brand name",
  "tradeName": "trade name / brand name / DBA name",
  "registeredAddress": "complete registered office address with building, street, area",
  "principalPlace": "principal place of business if different from registered address",
  "city": "city name",
  "state": "state name",
  "pinCode": "6-digit PIN code",
  "panNumber": "10-character PAN (e.g. AABCU9603R) — entity PAN, not personal",
  "gstNumber": "15-character GSTIN (e.g. 27AABCU9603R1ZM)",
  "cinNumber": "Corporate Identity Number (CIN) for companies",
  "udyamNumber": "Udyam/MSME registration number (e.g. UDYAM-XX-00-0000000)",
  "msmeCategory": "Micro/Small/Medium enterprise classification",
  "dateOfIncorporation": "date of incorporation/registration in DD/MM/YYYY",
  "constitution": "Private Limited Company/LLP/Partnership Firm/Proprietorship/Trust/Society/Public Limited/HUF",
  "natureOfBusiness": "detailed description of business activity/industry",
  "nicCode": "NIC code or industry classification code",
  "website": "company website URL",
  "annualTurnover": "annual turnover or revenue figure",
  "annualFxEstimate": "estimated annual foreign exchange volume/requirement"`;

    const personFields = `
  "contactPerson": "primary contact person's full name",
  "contactDesignation": "designation (Director/Partner/Proprietor/CEO/CFO/Manager/Authorized Signatory)",
  "contactMobile": "10-digit Indian mobile number",
  "contactEmail": "email address",
  "directors": [{"name": "full name", "designation": "Director/Partner/Trustee/etc", "din": "DIN number if available", "pan": "PAN if shown", "dob": "DD/MM/YYYY", "mobile": "phone", "email": "email"}],
  "authorizedSignatory": "name of authorized signatory for banking/forex",
  "signatoryDesignation": "designation of authorized signatory"`;

    const bankFields = `
  "bankName": "bank name (e.g. State Bank of India, HDFC Bank)",
  "bankBranch": "branch name and/or address",
  "bankAccountNumber": "bank account number",
  "bankAccountType": "Savings/Current/CC/OD",
  "bankIfsc": "11-character IFSC code (e.g. SBIN0001234)",
  "bankMicr": "MICR code if available"`;

    const txnFields = isTxn ? `
  "invoiceNumber": "invoice/proforma/quotation number",
  "invoiceDate": "invoice date in DD/MM/YYYY",
  "invoiceAmount": "total amount as number only (e.g. 50000.00 not USD 50,000.00)",
  "invoiceCurrency": "3-letter currency code (USD/EUR/GBP/AED/THB/SGD/etc)",
  "destination": "destination country for travel/service",
  "travelDateFrom": "travel start date DD/MM/YYYY",
  "travelDateTo": "travel end date DD/MM/YYYY",
  "numberOfTravelers": "number of passengers/travelers",
  "purposeOfRemittance": "purpose (leisure travel/business travel/medical/education/conference/exhibition)",
  "beneficiaryName": "overseas beneficiary/payee/hotel/DMC name",
  "beneficiaryBank": "beneficiary's bank name",
  "beneficiaryAccount": "beneficiary account/IBAN number",
  "beneficiaryBankAddress": "beneficiary bank full address with country",
  "swiftCode": "SWIFT/BIC code (8 or 11 characters)",
  "iban": "IBAN number",
  "correspondentBank": "correspondent/intermediary bank if mentioned",
  "correspondentSwift": "correspondent bank SWIFT code"` : "";

    const docHints = {
      "GST Certificate": "Focus on: GSTIN, legal name, trade name, address, constitution type, date of registration, PAN (embedded in GSTIN positions 3-12).",
      "PAN Card": "Focus on: PAN number (10-char alphanumeric), name on PAN, date of birth/incorporation, father's name if individual PAN.",
      "Udyam Certificate": "Focus on: Udyam number, enterprise name, type (Micro/Small/Medium), NIC code, address, date of incorporation, owner name, mobile, email, Aadhaar-linked PAN, plant/office addresses.",
      "Certificate of Incorporation": "Focus on: CIN, company name, date of incorporation, registered office address, authorized capital, paid-up capital, directors listed.",
      "Bank Statement": "Focus on: account holder name, account number, bank name, branch, IFSC, MICR, account type, address, opening date.",
      "Invoice": "Focus on: invoice number, date, seller/buyer names, amounts, currency, GSTIN of parties, HSN/SAC codes, destination, beneficiary bank details, SWIFT, IBAN, travel dates, passenger count.",
      "Board Resolution": "Focus on: authorized signatories, their designations, date of resolution, purpose.",
      "MOA/AOA": "Focus on: company objects/nature of business, authorized capital, subscriber details (name, address, shares), registered office.",
    };
    const hint = docHints[docType] || "Extract every data point you can find — names, numbers, dates, addresses, amounts, codes.";

    return `You are an expert at extracting structured data from Indian corporate/business documents for a ${catLabel} form.

DOCUMENT: "${filename}" (detected type: ${docType})
EXTRACTION FOCUS: ${hint}

Extract ALL possible data into this JSON structure. Return "" for fields not found in the document. Be thorough — look for data in headers, footers, tables, stamps, watermarks, fine print.

{
${companyFields},
${personFields},
${bankFields}${txnFields ? "," + txnFields : ""}
}

CRITICAL RULES:
- Return ONLY valid JSON object, no markdown backticks, no explanation text
- PAN format: exactly 5 uppercase letters + 4 digits + 1 uppercase letter (e.g. AABCU9603R)
- GSTIN format: 2 digits + 5 letters + 4 digits + 1 letter + 1 digit + 1 alphanumeric + 1 check (15 chars total)
- IFSC format: 4 letters + 0 + 6 digits/letters (e.g. SBIN0001234)
- Dates MUST be DD/MM/YYYY format — convert any other format
- Amounts: return pure number (e.g. "50000.00" not "Rs. 50,000/-" or "USD 50,000.00")
- Mobile: 10 digits only, no country code prefix
- Extract PAN from GSTIN: characters 3-12 of a 15-char GSTIN
- For directors/partners: extract ALL names found, include their DIN, PAN, DOB if shown
- Look for addresses in both English and regional languages
- Indian enterprise types: map to "Private Limited Company"/"LLP"/"Partnership Firm"/"Proprietorship"/"Trust"/"Society"/"Public Limited Company"/"HUF"
- If the document has tables, extract data from each row

DOCUMENT TEXT:
${text.substring(0, 20000)}`;
  }

  async extractWithGemini(text, filename, docType) {
    if (!this.geminiKey) return null;
    const prompt = this.buildGeminiPrompt(text, filename, docType || "Unknown");

    try {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.05, maxOutputTokens: 4096 }
        })
      });
      if (!resp.ok) return null;
      const data = await resp.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const jsonStr = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      return JSON.parse(jsonStr);
    } catch (e) {
      console.warn("Gemini extraction failed:", e);
      return null;
    }
  }

  mergeAiExtraction(fields, ai) {
    if (!ai) return fields;
    const set = (field, value) => { if (value && typeof value === "string" && value.trim() && value.trim() !== "N/A" && value.trim() !== "NA") fields[field] = value.trim(); };
    const str = (v) => v && typeof v === "string" ? v.trim() : (v != null ? String(v).trim() : "");

    set("genericName", ai.companyName || ai.tradeName);
    set("gstLegalName", ai.legalName || ai.companyName);
    set("gstTradeName", ai.tradeName || ai.companyName);
    if (ai.registeredAddress && !fields.genericAddress) set("genericAddress", ai.registeredAddress);
    if (ai.principalPlace) set("principalPlace", ai.principalPlace);
    set("city", ai.city);
    set("state", ai.state);
    if (ai.pinCode && /^\d{6}$/.test(str(ai.pinCode))) fields.pin = str(ai.pinCode);

    const pan = str(ai.panNumber);
    if (pan && /^[A-Z]{5}\d{4}[A-Z]$/.test(pan)) fields.panNumber = pan;
    const gst = str(ai.gstNumber);
    if (gst && /^\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z\d]{2}$/.test(gst)) {
      fields.gstNumber = gst;
      if (!fields.panNumber) { const gstPan = gst.substring(2, 12); if (/^[A-Z]{5}\d{4}[A-Z]$/.test(gstPan)) fields.panNumber = gstPan; }
    }
    if (ai.cinNumber) set("cinNumber", ai.cinNumber);
    set("udyamNumber", ai.udyamNumber);
    if (ai.msmeCategory) set("msmeCategory", ai.msmeCategory);
    set("dateOfIncorporation", ai.dateOfIncorporation);
    set("gstConstitution", ai.constitution);
    set("nicDescription", ai.natureOfBusiness || ai.nicCode);
    set("companyWebsite", ai.website);
    if (ai.annualFxEstimate) set("annualFxEstimate", ai.annualFxEstimate);
    if (ai.annualTurnover) set("annualTurnover", ai.annualTurnover);

    if (ai.contactPerson && !fields.ownerName) fields.ownerName = str(ai.contactPerson);
    if (ai.contactMobile) { const mob = str(ai.contactMobile).replace(/[^0-9]/g, "").slice(-10); if (/^\d{10}$/.test(mob)) fields.extractedMobile = mob; }
    if (ai.contactEmail && ai.contactEmail.includes("@")) fields.extractedEmail = str(ai.contactEmail);
    if (ai.contactDesignation) fields.aiDesignation = str(ai.contactDesignation);
    if (ai.authorizedSignatory) set("authorizedSignatory", ai.authorizedSignatory);
    if (ai.signatoryDesignation) set("signatoryDesignation", ai.signatoryDesignation);

    const aiDirs = Array.isArray(ai.directors) ? ai.directors : [];
    if (aiDirs.length > 0) {
      const names = [];
      const desigs = [];
      const pans = [];
      const dobs = [];
      const mobiles = [];
      const emails = [];
      aiDirs.forEach(d => {
        const n = typeof d === "string" ? d : str(d?.name);
        if (n && n.length > 2) {
          names.push(n);
          desigs.push(typeof d === "object" ? str(d.designation) : "");
          pans.push(typeof d === "object" ? str(d.pan) : "");
          dobs.push(typeof d === "object" ? str(d.dob) : "");
          mobiles.push(typeof d === "object" ? str(d.mobile) : "");
          emails.push(typeof d === "object" ? str(d.email) : "");
        }
      });
      if (names.length > 0 && !fields.gstDirectors && !fields.gstPartners) {
        const isDir = /director|company|private|limited|llp/i.test(ai.constitution || "");
        if (isDir) fields.gstDirectors = names;
        else fields.gstPartners = names;
        if (desigs.some(Boolean)) fields.gstPersonDesignations = desigs;
        if (pans.some(Boolean)) fields.gstPersonPans = pans.map(p => /^[A-Z]{5}\d{4}[A-Z]$/.test(p) ? p : "");
        if (dobs.some(Boolean)) fields.personDobs = dobs;
      }
      if (!fields.ownerName && names[0]) fields.ownerName = names[0];
      if (!fields.extractedMobile && mobiles[0]) { const m = mobiles[0].replace(/[^0-9]/g, "").slice(-10); if (/^\d{10}$/.test(m)) fields.extractedMobile = m; }
      if (!fields.extractedEmail && emails[0] && emails[0].includes("@")) fields.extractedEmail = emails[0];
    }

    set("bankName", ai.bankName);
    if (ai.bankAccountNumber) fields.bankAccountNumber = str(ai.bankAccountNumber);
    if (ai.bankIfsc) { const ifsc = str(ai.bankIfsc); if (/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) fields.bankIfsc = ifsc; else set("bankIfsc", ai.bankIfsc); }
    set("bankBranch", ai.bankBranch);
    if (ai.bankAccountType) set("bankAccountType", ai.bankAccountType);

    set("invoiceNumber", ai.invoiceNumber);
    if (ai.invoiceAmount) { const amt = str(ai.invoiceAmount).replace(/[^0-9.]/g, ""); if (amt) fields.invoiceAmount = amt; }
    set("invoiceCurrency", ai.invoiceCurrency);
    set("invoiceDestination", ai.destination);
    set("invoiceDateFrom", ai.travelDateFrom);
    set("invoiceDateTo", ai.travelDateTo);
    if (ai.numberOfTravelers) fields.invoicePax = String(ai.numberOfTravelers).replace(/[^0-9]/g, "");
    set("invoiceBeneficiary", ai.beneficiaryName);
    set("invoiceBankName", ai.beneficiaryBank);
    if (ai.beneficiaryAccount) fields.invoiceAccountNo = str(ai.beneficiaryAccount);
    set("invoiceBenefBankAddr", ai.beneficiaryBankAddress);
    if (ai.swiftCode) { const sw = str(ai.swiftCode).toUpperCase(); if (/^[A-Z]{6}[A-Z0-9]{2,5}$/.test(sw)) fields.invoiceSwift = sw; }
    set("invoiceIban", ai.iban);
    if (ai.correspondentBank) set("correspondentBank", ai.correspondentBank);
    if (ai.correspondentSwift) set("correspondentSwift", ai.correspondentSwift);
    if (ai.purposeOfRemittance) set("purposeOfRemittance", ai.purposeOfRemittance);

    return fields;
  }

  async smartReExtract() {
    if (!this.geminiKey || this.allExtractedTexts.length < 2) return;
    const emptyFieldIds = [];
    const isHidden = (el) => { let n = el; while (n && n !== document.body) { if (n.style && n.style.display === "none" && !n.classList.contains("form-section")) return true; n = n.parentElement; } return false; };
    const naValues = new Set(["na", "n/a", "nil", "none", "-", "—", "null", "not available", "not applicable"]);
    document.querySelectorAll(".form-input, .form-textarea").forEach(el => {
      if (!el.id || isHidden(el)) return;
      const v = el.value.trim();
      if (!v || naValues.has(v.toLowerCase())) {
        const label = el.closest(".form-group")?.querySelector(".form-label")?.textContent?.trim() || el.id;
        emptyFieldIds.push({ id: el.id, label });
      }
    });
    if (emptyFieldIds.length === 0) return;

    const combinedText = this.allExtractedTexts.map(t => `--- ${t.filename} (${t.docType}) ---\n${t.text}`).join("\n\n");
    const fieldList = emptyFieldIds.slice(0, 40).map(f => `"${f.id}": "${f.label}"`).join(",\n  ");

    const prompt = `You have ALL the documents uploaded by a user for corporate onboarding. Cross-reference ALL documents together to find data for these EMPTY form fields.

UPLOADED DOCUMENTS TEXT:
${combinedText.substring(0, 25000)}

EMPTY FIELDS TO FILL (field ID → label):
{
  ${fieldList}
}

For EACH empty field, search across ALL documents. Data might be in a different document than expected:
- Company name might be in an invoice, not just GST certificate
- PAN can be derived from GSTIN (characters 3-12)
- Address pieces might be split across documents
- Contact details might appear in invoice headers or bank statements
- Bank details might be in invoice payment terms

Return a JSON object with field IDs as keys and extracted values as values. ONLY include fields where you found actual data. Return {} if nothing found.

RULES:
- Return ONLY valid JSON, no markdown
- Only include fields where you found real data (not guesses)
- PAN: 5 letters + 4 digits + 1 letter
- Dates: DD/MM/YYYY
- Mobile: 10 digits only`;

    try {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.05, maxOutputTokens: 2048 }
        })
      });
      if (!resp.ok) return;
      const data = await resp.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const jsonStr = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const result = JSON.parse(jsonStr);
      let filled = 0;
      for (const [id, value] of Object.entries(result)) {
        if (!value || typeof value !== "string" || !value.trim()) continue;
        const el = document.getElementById(id);
        if (el && !el.value.trim()) {
          el.value = value.trim();
          el.classList.add("auto-filled");
          filled++;
        }
      }
      if (filled > 0) {
        this.updateAccuracy();
        this.showToast(`AI cross-reference filled ${filled} more fields`, "success");
      }
    } catch (e) {
      console.warn("Smart re-extract failed:", e);
    }
  }

  snapshotFormValues() {
    const snap = {};
    document.querySelectorAll(".form-input, .form-textarea").forEach(el => {
      if (el.id) snap[el.id] = el.value.trim();
    });
    return snap;
  }

  trackFieldSources(beforeSnap, filename, docType) {
    const naValues = new Set(["na", "n/a", "nil", "none", "-", "—", "null", "not available", "not applicable"]);
    const isReal = (v) => v && v.trim().length > 0 && !naValues.has(v.trim().toLowerCase());
    const shortName = filename.length > 25 ? filename.substring(0, 22) + "..." : filename;
    const docKey = shortName + " (" + docType.replace(" + AI", "").replace(" + AI Vision", "").replace(" (OCR)", "") + ")";
    if (!this.docFieldCounts[docKey]) this.docFieldCounts[docKey] = { filename, docType, fields: [], accuracy: 0 };
    document.querySelectorAll(".form-input, .form-textarea").forEach(el => {
      if (!el.id) return;
      const before = beforeSnap[el.id] || "";
      const after = el.value.trim();
      if ((!isReal(before)) && isReal(after)) {
        this.fieldSourceMap[el.id] = { filename: shortName, docType, docKey };
        const label = el.closest(".form-group")?.querySelector(".form-label")?.textContent?.trim() || el.id;
        if (!this.docFieldCounts[docKey].fields.find(f => f.id === el.id)) {
          this.docFieldCounts[docKey].fields.push({ id: el.id, label, value: after.substring(0, 40) });
        }
      }
    });
    this.docFieldCounts[docKey].accuracy = this.getAccuracyPercent();
  }

  renderDocIntelligence() {
    const card = document.getElementById("docIntelCard");
    const body = document.getElementById("docIntelBody");
    if (!card || !body) return;

    const docs = Object.entries(this.docFieldCounts);
    if (docs.length === 0) { card.style.display = "none"; return; }
    card.style.display = "block";

    const cat = this.activeFormCategory || "cifl";
    const isTxn = cat.includes("Fit") || cat.includes("Mice") || cat.includes("fit") || cat.includes("mice");

    const requiredDocs = isTxn ? [
      { name: "GST Certificate", icon: "📄", fields: "Company name, GSTIN, PAN, Address, Constitution" },
      { name: "PAN Card", icon: "🆔", fields: "PAN number, Name, Date of birth" },
      { name: "Invoice / Proforma", icon: "🧾", fields: "Invoice no, Amount, Currency, Beneficiary, SWIFT, IBAN" },
      { name: "Bank Statement / Cheque", icon: "🏦", fields: "Bank name, Account no, IFSC, Branch" },
      { name: "Travel Itinerary", icon: "✈️", fields: "Destination, Travel dates, Travelers count" }
    ] : [
      { name: "GST Certificate", icon: "📄", fields: "Company name, GSTIN, PAN, Address, Directors, Constitution" },
      { name: "PAN Card", icon: "🆔", fields: "PAN number, Entity name, Date of incorporation" },
      { name: "Udyam / MSME Certificate", icon: "🏢", fields: "Udyam no, Enterprise name, Type, NIC code, Owner, Mobile, Email" },
      { name: "Bank Statement / Cheque", icon: "🏦", fields: "Bank name, Account no, IFSC, Branch, Account type" },
      { name: "Certificate of Incorporation", icon: "📜", fields: "CIN, Company name, Date of incorporation, Directors" },
      { name: "Board Resolution", icon: "📝", fields: "Authorized signatory, Designation" }
    ];

    const uploadedTypes = this.uploadedFiles.filter(f => f.status === "success").map(f => f.docType.replace(" + AI", "").replace(" + AI Vision", "").replace(" (OCR)", "").trim().toLowerCase());

    let html = "";

    html += `<div style="font-size:0.78rem;font-weight:700;color:var(--text-primary);margin-bottom:8px;display:flex;align-items:center;gap:5px">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      Uploaded Documents (${docs.length})
    </div>`;

    docs.forEach(([docKey, info]) => {
      const fieldCount = info.fields.length;
      html += `<div style="border:1px solid var(--border);border-radius:8px;padding:8px;margin-bottom:6px;background:var(--bg)">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
          <strong style="font-size:0.75rem;color:var(--text-primary)">📂 ${docKey}</strong>
          <span style="font-size:0.68rem;background:#dcfce7;color:#166534;padding:1px 6px;border-radius:10px;font-weight:600">${fieldCount} fields</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:3px">
          ${info.fields.slice(0, 8).map(f => `<span style="font-size:0.65rem;background:var(--primary-light);color:var(--primary-dark);padding:1px 5px;border-radius:4px" title="${f.value}">${f.label}</span>`).join("")}
          ${fieldCount > 8 ? `<span style="font-size:0.65rem;color:var(--text-muted)">+${fieldCount - 8} more</span>` : ""}
        </div>
      </div>`;
    });

    const totalFilled = Object.values(this.docFieldCounts).reduce((s, d) => s + d.fields.length, 0);

    html += `<div style="margin-top:10px;font-size:0.78rem;font-weight:700;color:var(--text-primary);margin-bottom:6px;display:flex;align-items:center;gap:5px">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
      Required Documents for ${cat.toUpperCase()}
    </div>`;

    requiredDocs.forEach(rd => {
      const isUploaded = uploadedTypes.some(ut => ut.includes(rd.name.split("/")[0].trim().toLowerCase().substring(0, 6)));
      html += `<div style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:0.73rem;border-bottom:1px solid var(--border)">
        <span style="font-size:1rem">${rd.icon}</span>
        <div style="flex:1">
          <div style="font-weight:600;color:var(--text-primary)">${rd.name}</div>
          <div style="font-size:0.65rem;color:var(--text-muted)">${rd.fields}</div>
        </div>
        <span style="font-size:0.68rem;padding:1px 6px;border-radius:10px;font-weight:600;${isUploaded ? "background:#dcfce7;color:#166534" : "background:#fef3c7;color:#92400e"}">${isUploaded ? "✓ Done" : "Needed"}</span>
      </div>`;
    });

    const missingDocs = requiredDocs.filter(rd => !uploadedTypes.some(ut => ut.includes(rd.name.split("/")[0].trim().toLowerCase().substring(0, 6))));
    if (missingDocs.length > 0) {
      html += `<div style="margin-top:8px;padding:8px;background:linear-gradient(135deg,#eff6ff,#ede9fe);border-radius:8px;border:1px solid #c4b5fd">
        <div style="font-size:0.72rem;font-weight:700;color:#5b21b6;margin-bottom:4px">💡 Upload these to boost accuracy:</div>
        ${missingDocs.map(d => `<div style="font-size:0.7rem;color:#6d28d9;padding:1px 0">${d.icon} <strong>${d.name}</strong> → ${d.fields.split(",").length} fields</div>`).join("")}
      </div>`;
    } else {
      html += `<div style="margin-top:8px;padding:8px;background:#d1fae5;border-radius:8px;text-align:center;border:1px solid #6ee7b7">
        <div style="font-size:0.82rem;font-weight:600;color:#065f46">✓ All recommended documents uploaded!</div>
      </div>`;
    }

    html += `<div style="margin-top:8px;padding:6px;background:var(--bg);border-radius:6px;text-align:center;font-size:0.7rem;color:var(--text-muted)">
      ${totalFilled} fields auto-filled from ${docs.length} document${docs.length > 1 ? "s" : ""}
    </div>`;

    body.innerHTML = html;
  }

  cleanExtractedData() {
    const naValues = new Set(["na", "n/a", "nil", "none", "-", "—", "null", "not available", "not applicable", "undefined"]);
    document.querySelectorAll(".form-input, .form-textarea").forEach(el => {
      if (!el.id || !el.value.trim()) return;
      let v = el.value.trim();
      if (naValues.has(v.toLowerCase())) { el.value = ""; el.classList.remove("auto-filled"); return; }
      v = v.replace(/\s{2,}/g, " ").trim();
      if (el.id.toLowerCase().includes("mobile") || el.id.toLowerCase().includes("phone")) {
        v = v.replace(/[^\d]/g, "");
        if (v.length > 10 && v.startsWith("91")) v = v.substring(v.length - 10);
        if (v.length > 10) v = v.substring(v.length - 10);
      }
      if (el.id.toLowerCase().includes("pan") && el.id !== "companyPanNo") {
        v = v.toUpperCase().replace(/[^A-Z0-9]/g, "");
      }
      if (el.id.toLowerCase().includes("gst")) {
        v = v.toUpperCase().replace(/[^A-Z0-9]/g, "");
      }
      if (el.id.toLowerCase().includes("ifsc")) {
        v = v.toUpperCase().replace(/[^A-Z0-9]/g, "");
      }
      if (el.id.toLowerCase().includes("email")) {
        v = v.toLowerCase().trim();
      }
      if (el.id.toLowerCase().includes("pin") && /^\d{6}$/.test(v.replace(/\s/g, ""))) {
        v = v.replace(/\s/g, "");
      }
      if (el.id.toLowerCase().includes("name") && !el.id.toLowerCase().includes("bank")) {
        v = v.replace(/\b(mr|mrs|ms|shri|smt|m\/s)\.?\s+/gi, "").trim();
        if (v === v.toUpperCase() && v.length > 3) {
          v = v.split(/\s+/).map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(" ");
        }
      }
      if (v !== el.value) el.value = v;
    });
  }

  suggestFormCategory(docType, extracted) {
    const hasInvoice = docType === "Invoice" || extracted.invoiceNumber || extracted.invoiceAmount;
    const hasTravel = extracted.invoiceDestination || extracted.invoiceDateFrom || extracted.invoicePax;
    const hasMice = /\b(conference|exhibition|expo|summit|seminar|congress|convention|trade\s*fair|mice)\b/i.test(JSON.stringify(extracted));
    const isIndel = /\b(indel|money\s*transfer|remittance)\b/i.test(JSON.stringify(extracted));
    let suggested = null;
    if (hasInvoice && hasTravel) {
      if (hasMice) suggested = isIndel ? "indelMice" : "ciflMice";
      else suggested = isIndel ? "indelFit" : "ciflFit";
    } else if (hasInvoice) {
      suggested = isIndel ? "indelFit" : "ciflFit";
    }
    if (suggested && suggested !== this.activeFormCategory) {
      const catNames = { cifl: "CIFL Onboarding", indel: "Indel Onboarding", ciflFit: "CIFL FIT", ciflMice: "CIFL MICE", indelFit: "Indel FIT", indelMice: "Indel MICE" };
      this.showToast(`AI suggests: Switch to "${catNames[suggested]}" for this document type`, "info", 6000);
    }
  }

  getAccuracyPercent() {
    const naValues = new Set(["na", "n/a", "nil", "none", "-", "—", "null", "not available", "not applicable"]);
    const isReal = (v) => { const t = v.trim().toLowerCase(); return t.length > 0 && !naValues.has(t); };
    const isHidden = (el) => { let n = el; while (n && n !== document.body) { if (n.style && n.style.display === "none" && !n.classList.contains("form-section")) return true; n = n.parentElement; } return false; };
    let filled = 0, total = 0;
    document.querySelectorAll(".form-input, .form-textarea").forEach(el => {
      if (el.id && el.id !== "stockExchangeName" && el.id !== "caseDetails" && !isHidden(el)) { total++; if (isReal(el.value)) filled++; }
    });
    document.querySelectorAll(".radio-group").forEach(g => { if (!isHidden(g)) { total++; if (g.querySelector(".radio-item.selected")) filled++; } });
    document.querySelectorAll(".checkbox-group").forEach(g => { if (!isHidden(g)) { total++; if (g.querySelector(".checkbox-item.checked")) filled++; } });
    return total > 0 ? Math.round((filled / total) * 100) : 0;
  }

  validateExtractedFields() {
    const warnings = [];
    const getVal = (id) => document.getElementById(id)?.value?.trim() || "";
    const addWarn = (id, msg) => {
      warnings.push({ id, msg });
      const el = document.getElementById(id);
      if (el) { el.style.borderColor = "#f59e0b"; el.title = msg; }
    };

    const pan = getVal("panNo");
    if (pan && !/^[A-Z]{5}\d{4}[A-Z]$/.test(pan)) addWarn("panNo", "Invalid PAN format (expected: ABCDE1234F)");

    const gst = getVal("gstNo");
    if (gst && !/^\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z\d]{2}$/.test(gst)) addWarn("gstNo", "Invalid GSTIN format (expected: 22AAAAA0000A1Z5)");
    if (gst && pan && gst.length === 15 && gst.substring(2, 12) !== pan) addWarn("gstNo", "PAN in GSTIN doesn't match PAN field");

    const ifsc = getVal("ifscCode");
    if (ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) addWarn("ifscCode", "Invalid IFSC format (expected: SBIN0001234)");

    const mobile = getVal("contactMobile");
    if (mobile && !/^[6-9]\d{9}$/.test(mobile)) addWarn("contactMobile", "Invalid Indian mobile (should start with 6-9, 10 digits)");

    const email = getVal("contactEmail");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) addWarn("contactEmail", "Invalid email format");

    const udyam = getVal("udyamNumber");
    if (udyam && !/^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/i.test(udyam)) addWarn("udyamNumber", "Invalid Udyam format (expected: UDYAM-XX-00-0000000)");

    const doi = getVal("dateOfIncorporation");
    if (doi) {
      const parts = doi.split("/");
      if (parts.length === 3) {
        const year = parseInt(parts[2]);
        if (year > new Date().getFullYear()) addWarn("dateOfIncorporation", "Date of incorporation is in the future");
        if (year < 1900) addWarn("dateOfIncorporation", "Date of incorporation seems too old");
      }
    }

    const accNo = getVal("accountNumber") || getVal("bankAccountNo");
    if (accNo && (accNo.length < 8 || accNo.length > 20)) {
      const id = document.getElementById("accountNumber") ? "accountNumber" : "bankAccountNo";
      addWarn(id, "Account number length unusual (expected 8-20 digits)");
    }

    if (warnings.length > 0) {
      const warnCount = warnings.length;
      this.showToast(`${warnCount} field${warnCount > 1 ? "s" : ""} may need review (highlighted in orange)`, "warning");
    }
    return warnings;
  }

  async analyzeGapsWithGemini() {
    if (!this.geminiKey) return;
    const isHiddenByToggle = (el) => {
      let node = el;
      while (node && node !== document.body) {
        if (node.style && node.style.display === "none" && !node.classList.contains("form-section")) return true;
        node = node.parentElement;
      }
      return false;
    };

    const emptyFields = [];
    const filledFields = [];
    document.querySelectorAll(".form-input, .form-textarea").forEach(el => {
      if (!el.id || el.id === "stockExchangeName" || el.id === "caseDetails" || isHiddenByToggle(el)) return;
      const label = el.closest(".form-group")?.querySelector(".form-label")?.textContent?.trim() || el.id;
      if (el.value.trim()) filledFields.push(label);
      else emptyFields.push(label);
    });

    if (emptyFields.length === 0) {
      this.renderAiInsights({ allFilled: true });
      return;
    }

    const uploadedDocs = this.uploadedFiles.filter(f => f.status === "success").map(f => f.docType.replace(" + AI", "")).join(", ");
    const cat = this.activeFormCategory || "cifl";
    const catLabel = { cifl: "CIFL Onboarding", indel: "Indel Onboarding", ciflFit: "CIFL FIT Transactions", ciflMice: "CIFL MICE Transactions", indelFit: "Indel FIT Transactions", indelMice: "Indel MICE Transactions" }[cat] || "Corporate Onboarding";
    const isTxn = cat.includes("Fit") || cat.includes("Mice") || cat.includes("fit") || cat.includes("mice");

    const prompt = `You are an expert corporate onboarding document advisor for Indian forex/payment companies. A user is filling a "${catLabel}" form and has uploaded: ${uploadedDocs || "no documents yet"}.
${isTxn ? "\nThis is a TRANSACTION form — bank details and invoice/travel information are CRITICAL." : "\nThis is an ONBOARDING form — company registration, KYC, and compliance documents are CRITICAL."}

EMPTY FIELDS (${emptyFields.length} fields not yet filled):
${emptyFields.join("\n")}

FILLED FIELDS (${filledFields.length} already extracted):
${filledFields.slice(0, 40).join(", ")}

Analyze and return a JSON object with this EXACT structure:
{
  "summary": "1-2 sentence overview of what's missing and why, specific to ${catLabel}",
  "missingGroups": [
    {
      "category": "group name like Company Details / Bank Info / Transaction Info / KYC Documents / Director Details",
      "fields": ["field1", "field2"],
      "reason": "why these are empty — be specific about what document data is missing",
      "suggestedDocument": "exact document name to upload (e.g. Bank Statement, Invoice/Proforma, GST Certificate, PAN Card, Udyam/MSME Certificate, Certificate of Incorporation, Board Resolution, MOA/AOA, Company Letterhead, Cancelled Cheque, RBI AD License)",
      "priority": "high/medium/low"
    }
  ],
  "actionItems": [
    "Upload X document to fill Y fields",
    "Upload Z document to fill W fields"
  ]
}

RULES:
- Return ONLY valid JSON, no markdown
- Group related empty fields together logically
- Be specific about which Indian document provides which data
- Priority: "high" = mandatory for ${catLabel} (PAN, GSTIN, company name, address${isTxn ? ", invoice details, beneficiary bank" : ""}); "medium" = important (bank, KMP, directors); "low" = optional
- Suggest Indian document names (GST Certificate, Udyam Registration, Certificate of Incorporation, etc.)
- Maximum 6 groups and 5 action items
- If bank details are missing, suggest "Cancelled Cheque" or "Bank Statement" specifically`;

    try {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 2048 }
        })
      });
      if (!resp.ok) return;
      const data = await resp.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const jsonStr = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const insights = JSON.parse(jsonStr);
      this.renderAiInsights(insights);
    } catch (e) {
      console.warn("Gemini gap analysis failed:", e);
    }
  }

  renderAiInsights(insights) {
    const card = document.getElementById("aiInsightsCard");
    const body = document.getElementById("aiInsightsBody");
    if (!card || !body) return;

    if (insights.allFilled) {
      card.style.display = "block";
      body.innerHTML = `
        <div style="text-align:center;padding:12px">
          <div style="font-size:2rem;margin-bottom:8px">&#10003;</div>
          <div style="font-weight:600;color:var(--success)">All fields filled!</div>
          <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:4px">Your documents provided all the required data.</div>
        </div>`;
      return;
    }

    const priorityIcon = { high: "&#9888;", medium: "&#9679;", low: "&#9675;" };
    const priorityColor = { high: "var(--danger)", medium: "var(--warning)", low: "var(--gray-400)" };

    const groupsHtml = (insights.missingGroups || []).map(g => `
      <div style="border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:8px;background:var(--bg)">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
          <span style="color:${priorityColor[g.priority] || priorityColor.medium};font-size:0.85rem">${priorityIcon[g.priority] || priorityIcon.medium}</span>
          <strong style="font-size:0.82rem">${g.category}</strong>
          <span style="margin-left:auto;font-size:0.7rem;background:${priorityColor[g.priority]}22;color:${priorityColor[g.priority] || priorityColor.medium};padding:1px 6px;border-radius:10px">${g.priority}</span>
        </div>
        <div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:6px">${g.reason}</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px">
          ${g.fields.map(f => `<span style="font-size:0.7rem;background:var(--danger-light);color:var(--danger);padding:2px 6px;border-radius:4px">${f}</span>`).join("")}
        </div>
        <div style="font-size:0.75rem;background:var(--primary-light);color:var(--primary-dark);padding:6px 8px;border-radius:6px;display:flex;align-items:center;gap:4px">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 12 15 15"/></svg>
          Upload: <strong>${g.suggestedDocument}</strong>
        </div>
      </div>
    `).join("");

    const actionsHtml = (insights.actionItems || []).map(a =>
      `<div style="font-size:0.78rem;padding:6px 0;border-bottom:1px solid var(--border);display:flex;align-items:start;gap:6px">
        <span style="color:var(--primary);font-weight:700;flex-shrink:0">&#10148;</span>
        <span>${a}</span>
      </div>`
    ).join("");

    card.style.display = "block";
    body.innerHTML = `
      <div style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:10px;padding:8px;background:var(--accent)11;border-radius:6px;border-left:3px solid var(--accent)">
        ${insights.summary || "Some fields could not be filled from the uploaded documents."}
      </div>
      ${groupsHtml}
      ${actionsHtml ? `<div style="margin-top:8px"><div style="font-size:0.75rem;font-weight:600;color:var(--gray-600);margin-bottom:4px">Recommended Actions</div>${actionsHtml}</div>` : ""}
    `;
  }

  toggleTheme() {
    this.theme = this.theme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", this.theme);
    localStorage.setItem("theme", this.theme);
  }

  resetForm() {
    if (!confirm("Reset all form data? This cannot be undone.")) return;
    this.uploadedFiles = [];
    this.extractedData = {};
    this.autoFilledCount = 0;
    document.querySelectorAll(".form-input, .form-textarea").forEach(el => {
      el.value = "";
      el.classList.remove("auto-filled");
    });
    document.querySelectorAll(".radio-item").forEach(r => { r.classList.remove("selected"); r.querySelector("input").checked = false; });
    document.querySelectorAll(".checkbox-item").forEach(c => { c.classList.remove("checked"); c.querySelector("input").checked = false; });
    this.renderUploadedFiles();
    document.getElementById("accuracyCard").style.display = "none";
    this.showStep(0);
    this.showToast("Form has been reset", "info");
  }

  showLoading(text, subtext) {
    document.getElementById("loadingText").textContent = text || "Processing...";
    document.getElementById("loadingSubtext").textContent = subtext || "";
    document.getElementById("loadingOverlay").classList.add("active");
  }

  hideLoading() {
    document.getElementById("loadingOverlay").classList.remove("active");
  }

  showToast(message, type = "info", duration = 4000) {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    const icons = {
      success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      error: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
      warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
    };
    toast.innerHTML = `${icons[type] || icons.info} ${message}`;
    container.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, duration);
  }
}

let app;
document.addEventListener("DOMContentLoaded", () => {
  app = new OnboardingApp();
});
