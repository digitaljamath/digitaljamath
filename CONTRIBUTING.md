# Contributing to Project Mizan

**Bismillah.** Thank you for your interest in contributing to Project Mizan. We are building the digital infrastructure for a transparent and effective Ummah.

## The Mission
"Good intentions deserve great systems."
We are an open-source initiative to modernize Masjid operations using AI and transparent data silos.

## "Vibe Coding" with AI
This project is heavily assisted by AI tools (Cursor, Copilot, etc.). We encourage you to use them too!
- **AI is the co-pilot**: Use it to generate boilerplate, write tests, and brainstorm.
- **You are the Pilot**: You are responsible for the architecture, security, and correctness of the code.

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL
- Redis

### Installation

1. **Clone the Repo**
   ```bash
   git clone https://github.com/azzaxp/Project-Mizan.git
   cd Project-Mizan
   ```

2. **Backend Setup** (Django)
   ```bash
   # Create Virtual Env
   python3 -m venv venv
   source venv/bin/activate
   
   # Install Dependencies
   pip install -r requirements.txt
   
   # Setup Database
   ./setup_dev.sh
   # (Or run migrations manually if the script fails)
   ```

3. **Frontend Setup** (Next.js)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Visit**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:8000/api/`

## How can I help?

We need help in 3 main areas:

1.  **Compliance Engine (Django)**: Help us encode complex financial rules (Zakat vs Sadaqah, FCRA limits) into the `FinanceService`.
2.  **Accessible UI (React/Next.js)**: Our users are often elders. Interfaces must be high-contrast, large text, and extremely intuitive.
3.  **AI Audit (Basira)**: Help us improve the logic that detects anomalies in transactions.

## Making Changes
1.  Fork the repo.
2.  Create a feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes.
4.  Open a Pull Request.

## Community
Join our [Discord](#) to discuss ideas or just say Salam!
