# AI Invoice Tracker

AI Invoice Tracker is a full-stack invoice management application designed to simplify creating, managing, and exporting invoices.

The application combines traditional invoice management features with AI-powered assistance for generating item descriptions.

## Features

* 🧾 Create, view, update, and manage invoices
* 🤖 AI-powered item description generation
* 📄 One-click PDF invoice export
* 🔐 User authentication with Clerk
* 💾 Persistent invoice data with PostgreSQL
* 📱 Responsive interface
* ⚡ Fast and simple invoice management workflow

## Tech Stack

### Frontend

* React
* Tailwind CSS

### Backend

* Node.js
* PostgreSQL

### AI

* Groq API

### Authentication

* Clerk

## How It Works

```text
Create Invoice
      ↓
Add Invoice Items
      ↓
Generate Item Descriptions with AI
      ↓
Review & Edit Invoice
      ↓
Export Invoice as PDF
```

## Getting Started

### Prerequisites

* Node.js
* npm
* PostgreSQL database
* Clerk account
* Groq API key

### Installation

Clone the repository:

```bash
git clone https://github.com/sanidhya091/invoice-ai-generator.git
cd invoice-ai-generator
```

Install dependencies:

```bash
npm install
```

Create a `.env` file and configure the required environment variables for:

* PostgreSQL
* Clerk
* Groq API

Start the development server:

```bash
npm run dev
```

Open the application in your browser at the local URL shown by the development server.

## Why I Built This

I built this project to explore how AI can be integrated into practical business workflows.

Instead of using an LLM as a standalone chatbot, the project integrates AI directly into an invoice-management workflow to assist with generating item descriptions while keeping the user in control of the final invoice.

## Author

**Sanidhya Singh**

* GitHub: https://github.com/sanidhya091
* LinkedIn: https://www.linkedin.com/in/sanidhya-singh-2aa6b7273/
