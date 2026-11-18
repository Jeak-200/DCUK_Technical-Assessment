# NFT E-Commerce Platform - Developer Assessment

## 📖 Overview

This is a full-stack NFT marketplace platform built with Node.js, React, and Web3 integration. The project serves as an assessment for full-stack developers with NFT/blockchain experience.

## 🎯 Assessment Information

**👉 Start here: [ASSESSMENT.md](./ASSESSMENT.md)**

The assessment document contains all tasks, requirements, and submission guidelines.

## 🏗️ Project Structure

```
Dcuk/
├── backend/          # Node.js + Express API
├── frontend/         # React + Vite application
├── ASSESSMENT.md     # Assessment tasks and guidelines
└── README.md         # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- MetaMask browser extension
- Privy account (free tier available)
- Git

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Dcuk
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```
   
   Create `.env` file (see `backend/ENV_SETUP.md`):
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/dcuk-assessment
   JWT_SECRET=your_secret_key_here
   FRONTEND_URL=http://localhost:3012
   PRIVY_APP_ID=your_privy_app_id
   PRIVY_APP_SECRET=your_privy_app_secret
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

4. **Initialize Database**
   ```bash
   cd backend
   npm run migrate
   npm run seed
   ```

5. **Run Development Servers**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

6. **Access the Application**
   - Frontend: http://localhost:3012
   - Backend API: http://localhost:5000

## 📚 Documentation

- **[ASSESSMENT.md](./ASSESSMENT.md)** - Complete assessment tasks and requirements
- **[backend/README.md](./backend/README.md)** - Backend setup and API documentation
- **[frontend/README.md](./frontend/README.md)** - Frontend setup and tech stack
- **[backend/ENV_SETUP.md](./backend/ENV_SETUP.md)** - Environment variables configuration

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT
- **Web3**: Ethers.js
- **Validation**: Express Validator

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router
- **Styling**: Tailwind CSS
- **Web3**: Ethers.js
- **HTTP Client**: Axios

## 📋 Features

- ✅ User authentication (JWT)
- ✅ NFT marketplace with search
- ✅ Shopping cart functionality
- ✅ Order management
- ✅ Web3 wallet integration (MetaMask)
- ✅ Wallet ownership verification


## 🔐 Security Notes

- Never commit `.env` files
- Use strong JWT secrets in production
- Validate all user inputs
- Follow Web3 security best practices

## 📞 Support

For questions about the assessment:
- Review the ASSESSMENT.md document
- Implement the most reasonable interpretation
- Add code comments to explain your approach

## 📄 License

This project is for assessment purposes only.

---

**Good luck with your assessment! 🚀**

