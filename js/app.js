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
                <h3>Drop PDFs here</h3>
                <p>Bank Statement, Udyam Certificate, or any KYC document</p>
                <input type="file" id="fileInput" accept=".pdf" multiple>
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
            </div>
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
              <p>Upload any company PDF documents - Bank Statements, Udyam Certificates, PAN Cards, GST Certificates, CoI, Aadhaar, Trade Licenses - and the system will automatically extract data and fill all onboarding forms.</p>
              <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin-top:20px">
                <button class="btn btn-primary btn-lg" onclick="document.getElementById('fileInput').click()">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  Select PDF Files
                </button>
                <button class="btn btn-success btn-lg" onclick="app.loadPreAnalyzedData()">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  Load Demo Data
                </button>
              </div>
              <p style="margin-top:12px;font-size:0.8rem;color:var(--text-secondary)">Supported: Bank Statements, Udyam/MSME, PAN, GST, Certificate of Incorporation, Aadhaar, Trade License</p>
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
              <div class="form-grid single">
                <div class="form-group"><label class="form-label">Names (as per MCA)</label><textarea class="form-textarea" id="directors" rows="2" placeholder="List all directors/partners"></textarea></div>
              </div>
            </div>
            <div class="sub-card">
              <div class="sub-card-title">16. Authorized Officials for FX Transactions</div>
              <div class="form-grid single">
                <div class="form-group"><label class="form-label">Names of authorized officials</label><textarea class="form-textarea" id="authorizedOfficials" rows="2" placeholder="Officials authorized to transact FX on behalf of company"></textarea></div>
              </div>
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
              <div class="form-grid">
                <div class="form-group"><label class="form-label">Bank Name</label><input class="form-input" type="text" id="bankName" placeholder="Bank name"></div>
                <div class="form-group"><label class="form-label">Account Name (Company)</label><input class="form-input" type="text" id="accountName" placeholder="Company name on bank account"></div>
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
            <div id="docTabs" class="doc-tabs">
              <button class="doc-tab active" data-doc="onboarding" onclick="app.switchDocPreview('onboarding')">Client Onboarding</button>
              <button class="doc-tab" data-doc="authSignatory" onclick="app.switchDocPreview('authSignatory')">Auth Signatory Letter</button>
              <button class="doc-tab" data-doc="beneficialOwnership" onclick="app.switchDocPreview('beneficialOwnership')">Beneficial Ownership</button>
              <button class="doc-tab" data-doc="corporateProfile" onclick="app.switchDocPreview('corporateProfile')">Corporate Profile / KYC</button>
              <button class="doc-tab" data-doc="mou" onclick="app.switchDocPreview('mou')">Tour Operator MOU</button>
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
      setVal("directors", fm.directors, "UDYAM");
      setVal("authorizedOfficials", fm.authorizedOfficials, "UDYAM");

      setVal("bankName", bs.bankName, "BANK");
      setVal("bankBranch", bs.branchAddress, "BANK");
      setVal("accountName", bs.accountName, "BANK");
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

      this.uploadedFiles = [
        { id: "pre-1", name: "Bank Statement (Union Bank of India)", status: "success", docType: "Bank Statement", fieldsExtracted: 8 },
        { id: "pre-2", name: "Udyam Registration Certificate", status: "success", docType: "Udyam Certificate", fieldsExtracted: 14 }
      ];
      this.renderUploadedFiles();
      this.updateAccuracy();
      this.hideLoading();
      this.showToast("Demo data loaded - 30+ fields auto-filled!", "success");
      setTimeout(() => this.goToStep(1), 400);
    }, 800);
  }

  async handleFiles(files) {
    for (const file of files) {
      if (file.type !== "application/pdf") {
        this.showToast("Only PDF files are supported", "error");
        continue;
      }
      if (this.uploadedFiles.find(f => f.name === file.name)) {
        this.showToast(`${file.name} already uploaded`, "warning");
        continue;
      }
      await this.processFile(file);
    }
  }

  async processFile(file) {
    const fileId = Date.now() + Math.random().toString(36).substring(2);
    this.uploadedFiles.push({ id: fileId, name: file.name, status: "processing", file });
    this.renderUploadedFiles();
    this.showLoading("Extracting data...", `Processing ${file.name}`);

    try {
      const text = await this.extractPdfText(file);
      const docType = this.detectDocumentType(text);
      const extracted = this.extractFields(text, docType);

      const idx = this.uploadedFiles.findIndex(f => f.id === fileId);
      if (idx >= 0) {
        this.uploadedFiles[idx].status = "success";
        this.uploadedFiles[idx].docType = docType;
        this.uploadedFiles[idx].fieldsExtracted = Object.keys(extracted).length;
      }

      Object.assign(this.extractedData, extracted);
      this.autoFillForm();
      this.renderUploadedFiles();
      this.updateAccuracy();
      this.hideLoading();
      this.showToast(`${docType} processed - ${Object.keys(extracted).length} fields extracted`, "success");

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
    const extractor = new PdfTextExtractor();
    const text = await extractor.extract(arrayBuffer);
    return text;
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

      const ownerNameMatch = t.match(/(?:NAME\s*(?:OF\s*)?(?:OWNER|PROPRIETOR|PARTNER|DIRECTOR)S?)\s*[:\-]?\s*([A-Z][A-Z\s]+?)(?=\s*(?:MOBILE|EMAIL|ADDRESS|DATE|$))/i);
      if (ownerNameMatch) fields.ownerName = ownerNameMatch[1].trim();
    }

    if (docType === "PAN Card") {
      const panMatch = t.match(/([A-Z]{5}\d{4}[A-Z])/);
      if (panMatch) fields.panNumber = panMatch[1];
      const nameMatch = t.match(/(?:Name)\s*[:\-]?\s*([A-Z][A-Z\s]+?)(?=\s*(?:Father|Date|DOB|\d|$))/i);
      if (nameMatch) fields.panHolderName = nameMatch[1].trim();
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

      const validityMatch = t.match(/(?:Date\s*of\s*Validity)\s*(?:From)?\s*[:\-]?\s*(\d{2}\/\d{2}\/\d{4})/i);
      if (validityMatch) fields.gstValidityFrom = validityMatch[1];

      const compName = (fields.gstLegalName || fields.gstTradeName || "").toUpperCase();
      const extractPersonNames = (block, isDir) => {
        const names = [];
        const patterns = [
          /(?:\bName\b)\s*[:\-]?\s*([A-Z][A-Za-z\s.]+?)(?=\s*(?:Designation|Resident|Status|DIN|PAN|Father|Date|Mobile|Photo|Name\b|\d{1,3}\s|$))/gi,
          /(?:\bName\b)\s+([A-Z][a-z]+(?:\s+[A-Za-z][a-z]+)+)/g,
          /\b(\d+)\s+Name\s+([A-Z][A-Za-z\s.]+?)(?=\s*(?:Designation|DIN|Resident|$))/gi,
        ];
        for (const re of patterns) {
          const matches = block.matchAll(re);
          for (const nm of matches) {
            const n = (nm[2] || nm[1]).trim();
            const skip = /^(Legal|Trade|Additional|Total|Number|Goods|Services|Tax|Identification|Annexure|Signature|Registration|Certificate|Place|Business|Address|Floor|Building|Superintendent|Commissioner|Officer|Principal|Centre|Jurisdictional)\b/i.test(n);
            const nUp = n.toUpperCase();
            const corpWords = /\b(LIMITED|PRIVATE|LLP|PARTNERSHIP|COMPANY|CORPORATION|ENTERPRISES|INDUSTRIES|REPRESENTATIONS|SOLUTIONS|SERVICES|TECHNOLOGIES|PVT|LTD|INC)\b/i.test(n);
            const isComp = corpWords || nUp === compName || (compName && compName.length > 5 && (compName.includes(nUp) || nUp.includes(compName.substring(0, Math.min(10, compName.length))))) || n.split(/\s+/).length > 5;
            if (n.length > 2 && n.length < 60 && !skip && !isComp && /[a-z]/i.test(n)) names.push(n);
          }
          if (names.length > 0) break;
        }
        const unique = [...new Set(names)];
        if (unique.length > 0) {
          if (isDir) fields.gstDirectors = unique;
          else fields.gstPartners = unique;
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

    const companyName = d.enterpriseName || d.gstLegalName || d.gstTradeName || d.companyName || d.genericName || d.bankAccountName || "";
    const companySource = d.enterpriseName ? "UDYAM" : d.gstLegalName || d.gstTradeName ? "GST" : d.companyName ? "CoI" : d.genericName ? "DOC" : d.bankAccountName ? "BANK" : "";

    const address = this.buildAddress(d) || d.gstAddress || d.bankAddress || d.genericAddress || "";
    const addrSource = this.buildAddress(d) ? (d.gstNumber ? "GST" : d.udyamNumber ? "UDYAM" : "DOC") : d.gstAddress ? "GST" : d.bankAddress ? "BANK" : d.genericAddress ? "DOC" : "";

    const personNames = d.gstPartners || d.gstDirectors || [];
    const personName = d.ownerName || d.panHolderName || (personNames.length > 0 ? personNames[0] : "") || d.bankAccountHolderName || "";
    const cleanName = personName.replace(/^(MR|MS|MRS|SHRI|SMT|M\/S)\s+/i, "").trim();
    const nameSource = d.ownerName ? "UDYAM" : d.panHolderName ? "PAN" : personNames.length > 0 ? "GST" : d.bankAccountHolderName ? "BANK" : "";

    const mobile = d.udyamMobile || d.extractedMobile || "";
    const mobileSource = d.udyamMobile ? "UDYAM" : d.extractedMobile ? "DOC" : "";
    const email = d.udyamEmail || d.extractedEmail || "";
    const emailSource = d.udyamEmail ? "UDYAM" : d.extractedEmail ? "DOC" : "";

    setVal("registeredName", companyName, companySource);
    setVal("registeredAddress", address, addrSource);
    setVal("principalPlace", address, addrSource);
    setVal("dateOfIncorporation", d.dateOfIncorporation || d.gstValidityFrom, d.dateOfIncorporation ? "UDYAM" : d.gstValidityFrom ? "GST" : "");
    setVal("panNo", d.panNumber, d.panNumber ? "PAN" : "");
    setVal("udyamNumber", d.udyamNumber, d.udyamNumber ? "UDYAM" : "");
    setVal("gstNo", d.gstNumber, d.gstNumber ? "GST" : "");

    const nature = d.nicDescription || d.nic5Code || d.gstConstitution || "";
    if (nature) {
      let full = nature;
      if (d.nic5Code && !full.includes(d.nic5Code)) full += ` (NIC: ${d.nic5Code})`;
      setVal("natureOfBusiness", full, d.nicDescription || d.nic5Code ? "UDYAM" : "GST");
    }

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
      setVal("directors", personNames.map(n => `${n} (${desig})`).join("\n"), pSource);
      setVal("authorizedOfficials", personNames.join(", "), pSource);
      if (!cleanName) {
        setVal("signatoryName", personNames[0], pSource);
        setVal("signatoryDesignation", desig, pSource);
      }
    } else if (cleanName) {
      setVal("directors", `${cleanName} (${desig})`, nameSource);
      setVal("authorizedOfficials", cleanName, nameSource);
    }

    setVal("bankName", d.bankName, "BANK");
    setVal("accountName", d.bankAccountName || companyName, d.bankAccountName ? "BANK" : companySource);

    const legalStatus = this.detectLegalStatus(d, companyName);
    if (legalStatus) {
      this.selectRadio("legalStatusGroup", legalStatus);
      const lsSource = d.gstConstitution ? "GST" : d.enterpriseType ? "UDYAM" : d.companyName ? "CoI" : "AUTO";
      this.setBadge("legalStatus", lsSource);
    }
    this.selectRadio("stockExchangeGroup", "No");
    this.selectRadio("caseRegisteredGroup", "No");
  }

  setBadge(fieldId, source) {
    const badgeId = "badge_" + fieldId;
    const el = document.getElementById(badgeId);
    if (!el || !source) return;
    const labels = { UDYAM: "UDYAM", GST: "GST", BANK: "BANK", PAN: "PAN", CoI: "CoI", DOC: "DOC", AUTO: "AUTO" };
    const classes = { UDYAM: "udyam", GST: "gst", BANK: "bank", PAN: "pan", CoI: "coi", DOC: "doc", AUTO: "auto" };
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
    row.innerHTML = '<div class="form-group kmp-row-group"><label class="form-label">KMP ' + count + '</label><div class="kmp-input-wrap"><input class="form-input kmp-input" type="text" placeholder="KMP name"><button class="btn-remove-kmp" type="button" onclick="app.removeKmpRow(this)" title="Remove">&times;</button></div></div>';
    container.appendChild(row);
  }

  removeKmpRow(btn) {
    const row = btn.closest(".kmp-row");
    if (row) row.remove();
  }

  detectDesignation(d, companyName) {
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

  updateAccuracy() {
    const allInputs = document.querySelectorAll(".form-input, .form-textarea");
    let filled = 0, total = 0;
    allInputs.forEach(el => {
      if (el.id && el.id !== "stockExchangeName" && el.id !== "caseDetails") {
        total++;
        if (el.value.trim()) filled++;
      }
    });

    const radioGroups = document.querySelectorAll(".radio-group");
    radioGroups.forEach(g => {
      total++;
      if (g.querySelector(".radio-item.selected")) filled++;
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

    summary.innerHTML = `
      <div class="extraction-item"><span class="extraction-label">Total Fields</span><span class="extraction-count">${total}</span></div>
      <div class="extraction-item"><span class="extraction-label">Auto-filled</span><span class="extraction-count" style="color:var(--success)">${filled}</span></div>
      <div class="extraction-item"><span class="extraction-label">Remaining</span><span class="extraction-count" style="color:var(--warning)">${total - filled}</span></div>
      ${Object.entries(sources).map(([k, v]) => `<div class="extraction-item"><span class="extraction-label">${k}</span><span class="extraction-count">${v} fields</span></div>`).join("")}
    `;

    const badge = document.getElementById("companyFieldCount");
    if (badge) badge.textContent = filled;
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
    this.activeDocPreview = "onboarding";
    this.switchDocPreview("onboarding");
  }

  switchDocPreview(docId) {
    this.activeDocPreview = docId;
    document.querySelectorAll(".doc-tab").forEach(t => t.classList.toggle("active", t.dataset.doc === docId));
    const pdfBtn = document.getElementById("btnDownloadPdf");
    if (pdfBtn) pdfBtn.style.display = "";
    const previewEl = document.getElementById("previewContent");
    const renderers = {
      onboarding: () => this.renderOnboardingPreview(),
      authSignatory: () => this.renderAuthSignatoryPreview(),
      beneficialOwnership: () => this.renderBeneficialOwnershipPreview(),
      corporateProfile: () => this.renderCorporateProfilePreview(),
      mou: () => this.renderMouPreview(),
    };
    previewEl.innerHTML = renderers[docId]();
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
    const map = {
      onboarding: () => this.downloadDocx(),
      authSignatory: () => this.downloadAuthSignatoryDocx(),
      beneficialOwnership: () => this.downloadBeneficialOwnershipDocx(),
      corporateProfile: () => this.downloadCorporateProfileDocx(),
      mou: () => this.downloadMouDocx(),
    };
    if (map[this.activeDocPreview]) map[this.activeDocPreview]();
  }

  pRow(label, value) {
    return `<tr><td style="width:260px;font-weight:500;background:#f9f9f9">${label}</td><td>${value || "—"}</td></tr>`;
  }

  renderOnboardingPreview() {
    const products = this.getCheckedValues("productsGroup");
    const productStr = products.length > 0 ? products.join(", ") : "Not specified";
    const stockListed = this.getRadioValue("stockExchangeGroup");
    const stockDetail = stockListed === "Yes" ? ` (${this.getFormValue("stockExchangeName")})` : "";
    const caseReg = this.getRadioValue("caseRegisteredGroup");
    const caseDetail = caseReg === "Yes" ? `\n${this.getFormValue("caseDetails")}` : "";
    const bankDetails = [
      this.getFormValue("bankName"),
      `Account: ${this.getFormValue("accountName")}`
    ].filter(Boolean).join("\n");

    return `
      <div class="preview-container">
        <div class="preview-header">
          <h1>Client Onboarding Form</h1>
          <p>(Corporates & Tour Operators)</p>
        </div>
        <table class="preview-table">
          <tbody>
            <tr><th>1</th><td>Registered Name</td><td><strong>${this.getFormValue("registeredName")}</strong></td></tr>
            <tr><th>2</th><td>Legal Status</td><td>${this.getRadioValue("legalStatusGroup")}</td></tr>
            <tr><th>2</th><td>Registered Office Address</td><td>${this.getFormValue("registeredAddress")}</td></tr>
            <tr><th>3</th><td>Principal Place of Business</td><td>${this.getFormValue("principalPlace") || "Same as Registered Address"}</td></tr>
            <tr><th>4</th><td>Date of Incorporation</td><td>${this.getFormValue("dateOfIncorporation")}</td></tr>
            <tr><th>5</th><td>PAN No</td><td>${this.getFormValue("panNo") || "—"}</td></tr>
            <tr><th>6</th><td>Nature of Business</td><td>${this.getFormValue("natureOfBusiness")}</td></tr>
            <tr><th>7</th><td>Listed on Stock Exchange</td><td>${stockListed}${stockDetail}</td></tr>
            <tr><th>8</th><td>Company Website</td><td>${this.getFormValue("companyWebsite") || "—"}</td></tr>
            <tr><th></th><td>MSME/Udyam Number</td><td>${this.getFormValue("udyamNumber") || "—"}</td></tr>
            <tr><th>9</th><td>Products to be Availed</td><td>${productStr}</td></tr>
            <tr><th>10</th><td>Annual Estimated FX (INR)</td><td>${this.getFormValue("annualFx") || "—"}</td></tr>
            <tr><th>11</th><td>Contact Person</td><td>Name: ${this.getFormValue("contactName")}<br>Designation: ${this.getFormValue("contactDesignation")}<br>Mobile: ${this.getFormValue("contactMobile")}<br>Email: ${this.getFormValue("contactEmail")}</td></tr>
            <tr><th>12</th><td>Key Managerial Person (KMP)</td><td>${this.getKmpNames().join(", ") || "—"}</td></tr>
            <tr><th>13</th><td>CEO Details</td><td>Name: ${this.getFormValue("ceoName")}<br>Mobile: ${this.getFormValue("ceoMobile")}<br>Email: ${this.getFormValue("ceoEmail")}</td></tr>
            <tr><th>14</th><td>MD / Partner / Trustee</td><td>Name: ${this.getFormValue("mdName")}<br>Mobile: ${this.getFormValue("mdMobile")}<br>Email: ${this.getFormValue("mdEmail")}</td></tr>
            <tr><th>15</th><td>Directors / Partners</td><td style="white-space:pre-line">${this.getFormValue("directors")}</td></tr>
            <tr><th>16</th><td>Authorized Officials for FX</td><td style="white-space:pre-line">${this.getFormValue("authorizedOfficials")}</td></tr>
            <tr><th>17</th><td>Banking Details</td><td style="white-space:pre-line">${bankDetails}</td></tr>
            <tr><th>18</th><td>Case/Complaint by Regulatory Authority</td><td>${caseReg}${caseDetail}</td></tr>
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
            <div>Name: <strong>${this.getFormValue("signatoryName")}</strong></div>
            <div>Designation: ${this.getFormValue("signatoryDesignation")}</div>
            <div style="margin-top:12px;font-size:0.85rem;color:#666">(Round Seal)</div>
          </div>
        </div>
      </div>`;
  }

  renderAuthSignatoryPreview() {
    const companyName = this.getFormValue("registeredName") || "";
    const sigName = this.getFormValue("signatoryName") || this.getFormValue("kmpName") || "";
    const sigDesig = this.getFormValue("signatoryDesignation") || this.getFormValue("contactDesignation") || "";
    const contactName = this.getFormValue("contactName") || sigName;
    const contactDesig = this.getFormValue("contactDesignation") || sigDesig;
    const ceoName = this.getFormValue("ceoName") || sigName;
    const today = this.todayFormatted();

    return `
      <div class="preview-container">
        <div class="preview-header">
          <h1>Authorised Signatory Letter</h1>
          <p>(On Company/Firm's Letter Head)</p>
        </div>
        <p style="text-align:right"><strong>Date:</strong> ${today}</p>
        <p>The Manager<br>Capital India Finance Limited</p>
        <p><strong>Sub: Authority to Place Request / Authorized Signatory for Purchase / Sales of Foreign Exchange</strong></p>
        <p>Dear Sir,</p>
        <p>I/We, <strong>${companyName}</strong> (hereinafter referred to as "APPLICANT") have authorized the following person(s) as an authorized representative(s) of the APPLICANT to execute foreign exchange transactions with M/s Capital India Finance Limited (CIFL), from time to time, and to purchase Foreign Exchange for and on behalf of the APPLICANT against Cheque issued by the APPLICANT or against credit.</p>
        <p><strong>The Signature of the authorized person(s)/representative(s) is attested below:</strong></p>
        <table class="preview-table">
          <thead><tr><th>Sr.</th><td><strong>Name</strong></td><td><strong>Designation</strong></td><td><strong>Signature</strong></td></tr></thead>
          <tbody>
            <tr><th>1</th><td>${contactName}</td><td>${contactDesig}</td><td style="height:40px"></td></tr>
            <tr><th>2</th><td>${ceoName}</td><td>${sigDesig}</td><td style="height:40px"></td></tr>
          </tbody>
        </table>
        <p style="margin-top:16px">This authority is irrevocable and binding on the APPLICANT as long as the APPLICANT continues to deal with CIFL for its Foreign Exchange requirements.</p>
        <div class="preview-signature">
          <div class="signature-block">
            <div style="height:50px"></div>
            <div class="signature-line">For <strong>${companyName}</strong></div>
            <div>Name: <strong>${sigName}</strong></div>
            <div>Designation: ${sigDesig}</div>
          </div>
        </div>
      </div>`;
  }

  renderBeneficialOwnershipPreview() {
    const companyName = this.getFormValue("registeredName") || "";
    const address = this.getFormValue("registeredAddress") || "";
    const sigName = this.getFormValue("signatoryName") || this.getFormValue("kmpName") || "";
    const ownerName = this.getFormValue("kmpName") || this.getFormValue("contactName") || sigName;
    const sigDesig = this.getFormValue("signatoryDesignation") || "";
    const today = this.todayFormatted();

    return `
      <div class="preview-container">
        <div class="preview-header">
          <h1>Annexure 3 - Beneficial Ownership Details</h1>
          <p>(Limited & Private Limited)</p>
        </div>
        <p style="text-align:right"><strong>Date:</strong> ${today}</p>
        <p>To,<br>The Manager<br>Capital India Finance Limited</p>
        <p><strong style="text-decoration:underline">Sub: Beneficial Ownership Details</strong></p>
        <p>I, <strong>${sigName}</strong>, authorized signatory of M/s <strong>${companyName}</strong>, a company incorporated under the Companies Act, 1956 and having its registered office at <strong>${address}</strong>, hereby declare and state that the following natural person of our company holds more than 10% of the shares or capital or profits of the company which falls within the definition of Beneficial ownership as defined under PMLA, 2002.</p>
        <table class="preview-table">
          <thead><tr><th>Sr.</th><td><strong>Name & Address</strong></td><td><strong>Designation</strong></td><td><strong>% Shares</strong></td><td><strong>ID (PAN/Aadhaar)</strong></td></tr></thead>
          <tbody>
            <tr><th>1</th><td>${ownerName}, ${address}</td><td>${this.getFormValue("contactDesignation") || "Proprietor"}</td><td>100%</td><td>${this.getFormValue("panNo") || ""}</td></tr>
            <tr><th>2</th><td></td><td></td><td></td><td></td></tr>
            <tr><th>3</th><td></td><td></td><td></td><td></td></tr>
          </tbody>
        </table>
        <p style="margin-top:16px">I further declare, in case of changes in the beneficial ownership structure of the company, I hereby undertake to furnish the details to you.</p>
        <div class="preview-signature">
          <div class="signature-block">
            <div style="height:50px"></div>
            <div class="signature-line">For M/s <strong>${companyName}</strong></div>
            <div>Name: <strong>${sigName}</strong></div>
            <div>Designation: ${sigDesig || "Director / Company Secretary"}</div>
          </div>
        </div>
      </div>`;
  }

  renderCorporateProfilePreview() {
    const companyName = this.getFormValue("registeredName") || "";
    const legalStatus = this.getRadioValue("legalStatusGroup") || "";
    const products = this.getCheckedValues("productsGroup");
    const productStr = products.length > 0 ? products.join(", ") : "";
    const stockExchange = this.getRadioValue("stockExchangeGroup") || "No";
    const sigName = this.getFormValue("signatoryName") || this.getFormValue("kmpName") || "";
    const sigDesig = this.getFormValue("signatoryDesignation") || legalStatus;
    const today = this.todayFormatted();

    return `
      <div class="preview-container">
        <div class="preview-header">
          <h1>Annexure 2 - Corporate Profile</h1>
          <p>Customer Profile - Money Changing Activities<br>(For Corporate, Goods & Services & Franchisees)</p>
        </div>
        <p style="font-size:0.8rem;color:#666;margin-bottom:16px"><em>Note: Each supporting document has to be certified as "True Copy" by an authorized person indicating his name and designation.</em></p>
        <table class="preview-table">
          <thead><tr><th>Sr.</th><td><strong>KYC Particulars</strong></td><td><strong>Details</strong></td></tr></thead>
          <tbody>
            <tr><th>1</th><td>Name of corporate entity</td><td><strong>${companyName}</strong></td></tr>
            <tr><th>2</th><td>Registered Office address</td><td>${this.getFormValue("registeredAddress")}</td></tr>
            <tr><th>3</th><td>Principal Place of Business</td><td>${this.getFormValue("principalPlace") || this.getFormValue("registeredAddress")}</td></tr>
            <tr><th>4</th><td>Date of Incorporation</td><td>${this.getFormValue("dateOfIncorporation")}</td></tr>
            <tr><th>5</th><td>PAN of the entity</td><td>${this.getFormValue("panNo") || "—"}</td></tr>
            <tr><th>6</th><td>Nature of business / type of activity</td><td>${this.getFormValue("natureOfBusiness")}</td></tr>
            <tr><th>7</th><td>Products offered / nature of services</td><td>${productStr}</td></tr>
            <tr><th>8</th><td>Location of branches</td><td>${this.getFormValue("registeredAddress")}</td></tr>
            <tr><th>9</th><td>Information about clients' business</td><td>Travel and Tour Operations</td></tr>
            <tr><th>10</th><td>Listed on stock exchange(s)</td><td>${stockExchange}</td></tr>
          </tbody>
        </table>
        <h3 style="margin:20px 0 12px;font-size:1rem">Management & Control Details</h3>
        <table class="preview-table">
          <tbody>
            ${this.pRow("Ownership and control structure", `${legalStatus} - ${this.getFormValue("kmpName") || this.getFormValue("contactName")}`)}
            ${this.pRow("Names of natural persons controlling entity", this.getFormValue("kmpName") || this.getFormValue("contactName"))}
            ${this.pRow("Purpose of business relationship", "Foreign Exchange Purchase / TT for Tour Operations")}
            ${this.pRow("Name of Chairman", this.getFormValue("kmpName") || this.getFormValue("ceoName"))}
            ${this.pRow("Name of Managing Director / Partner / Trustee", this.getFormValue("mdName") || this.getFormValue("kmpName"))}
            ${this.pRow("Name of Chief Executive Officer", this.getFormValue("ceoName") || this.getFormValue("kmpName"))}
            ${this.pRow("Names of other directors / partners", this.getFormValue("directors"))}
            ${this.pRow("Names of officials authorized for FX", this.getFormValue("authorizedOfficials") || this.getFormValue("contactName"))}
            ${this.pRow("Names of bankers", this.getFormValue("bankName"))}
            ${this.pRow("Sources of funds", "Business Revenue")}
            ${this.pRow("Annual estimated FX required (INR)", this.getFormValue("annualFx"))}
          </tbody>
        </table>
        <div class="preview-declaration">
          <strong>Declaration</strong><br><br>
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
      </div>`;
  }

  renderMouPreview() {
    const companyName = this.getFormValue("registeredName") || "[Company Name]";
    const address = this.getFormValue("registeredAddress") || "[Company Address]";
    const sigName = this.getFormValue("signatoryName") || this.getFormValue("kmpName") || "";
    const sigDesig = this.getFormValue("signatoryDesignation") || "";
    const today = this.todayFormatted();

    return `
      <div class="preview-container">
        <div class="preview-header">
          <h1>MEMORANDUM OF UNDERSTANDING (MOU)</h1>
          <p>Overseas Tour Operator - CIFL - RemitX</p>
        </div>
        <p>This MOU is made on this <strong>${today}</strong> ("Effective Date") by and between</p>
        <p><strong>Capital India Finance Limited</strong>, a company incorporated under the laws of India and having its registered office at 701, 7th floor, Aggarwal Corporate Tower, Plot No. 23, District Centre, Rajendra Place, New Delhi - 110008, hereinafter referred to as <strong>"CIFL"</strong></p>
        <p style="text-align:center"><strong>AND</strong></p>
        <p><strong>${companyName}</strong>, a company/legal entity incorporated under the applicable laws of India and having its registered office at <strong>${address}</strong>, carrying out the business of Travels and Tour Operator, hereinafter referred to as <strong>"Client"</strong></p>

        <h3 style="margin:20px 0 8px">WHEREAS:</h3>
        <p>A. CIFL is holding an Authorized Dealer Category II Money Changer License issued by RBI and is engaged in dealing in Foreign Exchange.</p>
        <p>B. <strong>${companyName}</strong> is in the business of Overseas Tour Management.</p>
        <p>C. <strong>${companyName}</strong> desires to avail the services of CIFL for sale/purchase of foreign exchange and telegraphic transfer for its customers.</p>

        <h3 style="margin:20px 0 8px">1. SCOPE OF SERVICES</h3>
        <p>1.1 The Client hereby appoints CIFL for providing foreign exchange services including sale/purchase of foreign currency and telegraphic transfers.</p>
        <p>1.2 The Client shall provide an Authorization Letter authorizing specific persons to transact on behalf of the Client.</p>
        <p>1.3 Service Requests shall be made via email or in person at CIFL branches.</p>
        <p>1.4 The Client shall provide all KYC documents as per AML/PMLA requirements.</p>

        <h3 style="margin:20px 0 8px">2. KYC AND AML REQUIREMENTS</h3>
        <p>2.1 The Client shall provide all KYC documents as required under PMLA and RBI regulations.</p>
        <p>2.2 CIFL may request fresh KYC documents periodically.</p>
        <p>2.3 The Client shall notify CIFL immediately of any IATA/license revocations or regulatory actions.</p>

        <h3 style="margin:20px 0 8px">3. TERM AND TERMINATION</h3>
        <p>3.1 This MOU shall be effective for an initial term of 1 year from the Effective Date and shall auto-renew for successive periods of 1 year each.</p>
        <p>3.2 Either party may terminate this MOU by providing 30 days written notice.</p>

        <h3 style="margin:20px 0 8px">4. LIMITATION OF LIABILITY</h3>
        <p>4.1 CIFL shall not be liable for: fraudulent transactions after delivery, third-party service failures, rejected service requests, delays in overseas disbursement, intermediary bank charges, incorrect client information, or remitting bank refusals.</p>

        <table class="preview-table" style="margin-top:24px">
          <tbody>
            <tr>
              <td style="width:50%;vertical-align:top;padding:16px">
                <strong>FOR AND ON BEHALF OF</strong><br>
                <strong>Capital India Finance Limited</strong><br><br>
                Signature: _______________<br>
                Name:<br>
                Designation:
              </td>
              <td style="width:50%;vertical-align:top;padding:16px">
                <strong>FOR AND ON BEHALF OF</strong><br>
                <strong>${companyName}</strong><br><br>
                Signature: _______________<br>
                Name: <strong>${sigName}</strong><br>
                Designation: ${sigDesig}
              </td>
            </tr>
          </tbody>
        </table>
      </div>`;
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
    const bankDetails = [this.getFormValue("bankName"), this.getFormValue("accountName")].filter(Boolean).join(" - ");

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
      ["16", "Directors / Partners", this.getFormValue("directors")],
      ["17", "Authorized Officials", this.getFormValue("authorizedOfficials")],
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
    const bodyText = `I/We, ${companyName} (hereinafter referred to as "APPLICANT") have authorized the following person(s) as an authorized representative(s) of the APPLICANT to execute foreign exchange transactions with M/s Capital India Finance Limited (CIFL), from time to time, and to purchase Foreign Exchange for and on behalf of the APPLICANT against Cheque issued by the APPLICANT or against credit. We have specifically authorized the person(s) named herein below to sign request letter for purchase / surrender of foreign exchange for the employees of the APPLICANT travelling abroad for and on behalf of the APPLICANT. We hereby take the complete responsibility for any transaction undertaken by the said authorized representative(s) with CIFL.`;
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

    const ownerAddr = `${ownerName}, ${address}`;
    const ownerLines = pdf.wrapText(ownerAddr, colW[1] - 8, 8);
    const row1H = Math.max(ownerLines.length * 11 + 8, 24);

    pdf.drawRect(m, y - row1H, w, row1H, "#F2F4F8");
    pdf.setFont(8, false);
    cx = m;
    pdf.drawText("1", cx + 4, y - 10); pdf.drawCellBorder(cx, y - row1H, colW[0], row1H); cx += colW[0];
    ownerLines.forEach((ln, i) => pdf.drawText(ln, cx + 4, y - 10 - i * 11)); pdf.drawCellBorder(cx, y - row1H, colW[1], row1H); cx += colW[1];
    pdf.drawText(this.getFormValue("contactDesignation") || "Proprietor", cx + 4, y - 10); pdf.drawCellBorder(cx, y - row1H, colW[2], row1H); cx += colW[2];
    pdf.drawText("100%", cx + 4, y - 10); pdf.drawCellBorder(cx, y - row1H, colW[3], row1H); cx += colW[3];
    pdf.drawText(this.getFormValue("panNo") || "", cx + 4, y - 10); pdf.drawCellBorder(cx, y - row1H, colW[4], row1H);
    y -= row1H;

    for (let i = 2; i <= 3; i++) {
      cx = m;
      pdf.setFont(8, false);
      pdf.drawText(String(i), cx + 4, y - 10); pdf.drawCellBorder(cx, y - 24, colW[0], 24); cx += colW[0];
      colW.slice(1).forEach(cw => { pdf.drawCellBorder(cx, y - 24, cw, 24); cx += cw; });
      y -= 24;
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
      ["9", "Information about clients' business", "Travel and Tour Operations"],
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
      ["Ownership and control structure", `${legalStatus} - ${this.getFormValue("kmpName") || this.getFormValue("contactName")}`],
      ["Natural persons controlling entity", this.getFormValue("kmpName") || this.getFormValue("contactName")],
      ["Purpose of business relationship", "Foreign Exchange Purchase / TT for Tour Operations"],
      ["Name of Chairman", this.getFormValue("kmpName") || this.getFormValue("ceoName")],
      ["Name of MD / Partner / Trustee", this.getFormValue("mdName") || this.getFormValue("kmpName")],
      ["Name of CEO", this.getFormValue("ceoName") || this.getFormValue("kmpName")],
      ["Other directors / partners", this.getFormValue("directors")],
      ["Officials authorized for FX", this.getFormValue("authorizedOfficials") || this.getFormValue("contactName")],
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

    const bankDetails = [this.getFormValue("bankName"), this.getFormValue("accountName")].filter(Boolean).join(" - ");

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
      ["15", "Directors / Partners", this.getFormValue("directors")],
      ["16", "Authorized Officials for FX", this.getFormValue("authorizedOfficials")],
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
      ["9", "Information about clients' business", "Travel and Tour Operations"],
      ["10", "Listed on stock exchange(s)", stockExchange],
    ];

    const mgmtRows = [
      ["Ownership and control structure", `${legalStatus} - ${e("kmpName") || e("contactName")}`],
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

  showToast(message, type = "info") {
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
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 4000);
  }
}

let app;
document.addEventListener("DOMContentLoaded", () => {
  app = new OnboardingApp();
});
