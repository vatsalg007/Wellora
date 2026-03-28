# Wellora 🏥
### AI-Powered Post-Surgical Recovery Platform

Built for **ET AI Hackathon 2026** | Problem Statement 5 — Domain-Specialized AI Agents with Compliance Guardrails

---

## What is Wellora?

Wellora is a multi-agent AI system that takes complete ownership of the post-surgical recovery pipeline. It monitors patients autonomously, detects complications, self-corrects failed check-ins, and escalates critical cases to physicians — with every decision fully auditable.

---

## Agent Architecture

| Agent | Role |
|-------|------|
| 🤖 MonitorAgent | Analyzes daily patient check-ins via multilingual voice input |
| 🔍 DiagnosticAgent | Detects wound infection using Claude Vision AI |
| 💊 PrescriptionAgent | Reads handwritten prescriptions via OCR |
| ⚖️ TriageAgent | Calculates real-time risk scores (0-100) |
| 🔄 RetryAgent | Detects missed check-ins and triggers SMS fallback |
| 🚨 EscalationAgent | Auto-alerts doctors with SLA timer enforcement |
| ✅ VerificationAgent | Logs doctor acknowledgment with response time |

---

## Key Features

- **Multilingual Support** — 6 Indian languages (Hindi, Tamil, Bengali, Telugu, Marathi, English)
- **Vision AI** — Clinical wound assessment with explainable reasoning
- **Prescription OCR** — Handwritten prescription digitization
- **Autonomous Escalation** — Missed check-ins trigger automatic doctor alerts
- **SLA Enforcement** — 2-minute response window with on-call escalation
- **Full Audit Trail** — Every agent decision logged with timestamp
- **Dual Interface** — Separate patient and doctor dashboards

---

## Tech Stack
```
Frontend    → React Native + Expo (TypeScript)
AI Engine   → Claude Sonnet (Anthropic API)
Storage     → AsyncStorage (prototype)
Auth        → Expo Local Authentication (biometric + PIN)
Speech      → Expo Speech (text-to-speech)
Vision      → Claude Vision API
```

---

## Setup Instructions

### Prerequisites
- Node.js v18+
- Expo Go app on your phone (iOS or Android)
- Anthropic API key

### Installation
```bash
# Clone the repository
git clone https://github.com/vatsalg007/Wellora.git

# Navigate to project
cd Wellora

# Install dependencies
npm install

# Create environment file
echo "EXPO_PUBLIC_ANTHROPIC_KEY=your_api_key_here" > .env

# Start the app
npx expo start
```

### Running the App
1. Install **Expo Go** on your phone
2. Run `npx expo start` in terminal
3. Scan the QR code with Expo Go (Android) or Camera (iOS)

---

## Demo Credentials
```
Patient Login  → Fill name, age, surgery, recovery day
Doctor PIN     → 1234
Demo Reset     → Tap Wellora logo 3 times on any screen
```

---

## Demo Flow
```
1. Login as Patient → complete daily check-in (MonitorAgent)
2. Upload wound photo → get AI analysis (DiagnosticAgent)
3. Scan prescription → get medication schedule (PrescriptionAgent)
4. Logout → Login as Doctor (PIN: 1234)
5. View Command Center → real-time patient data
6. Watch SLA timer → auto-escalation if no acknowledgment
7. Check Audit Log → full agent decision trail
```

---

## Compliance & Safety

- AI reasoning path shown for every clinical decision (XAI)
- Guardrails prevent hallucination in medical assessments
- Audit trail for regulatory compliance (DPDP Act 2023)
- Production architecture uses AWS HealthLake (FHIR-compliant)

---

## Impact Model

- **15M** post-surgical patients annually in India
- **41%** of readmissions are preventable
- **₹3,500 crore** in avoidable readmission costs
- Wellora targets **30% reduction** in missed complication detection

---

## Team

Built with ❤️ for ET AI Hackathon 2026