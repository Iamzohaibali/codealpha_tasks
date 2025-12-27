# Social Media Application

This is a full-stack **Social Media Application** developed as part of the **CodeAlpha Internship Program**.  
The project allows users to register, authenticate, create posts, and interact with other users in a secure environment.

---

## 📌 Project Overview

The Social Media App is designed to demonstrate real-world full-stack development concepts, including authentication, REST APIs, database integration, and frontend–backend separation.

---

## 🛠️ Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- bcrypt.js
- dotenv

### Frontend
- React.js
- HTML5
- CSS3
- JavaScript
- Axios

---

## ✨ Features

- User registration & login
- JWT-based authentication
- Secure password hashing
- Create, update & delete posts
- User profile management
- Protected routes
- Environment-based configuration
- Clean project structure (frontend & backend separated)

---

## 📂 Project Structure

social-media-app/
├── backend/
│ ├── src/
│ │ ├── config/
│ │ ├── controllers/
│ │ ├── middleware/
│ │ ├── models/
│ │ ├── routes/
│ │ └── app.js
│ ├── .env.example
│ ├── .gitignore
│ ├── package.json
│ └── package-lock.json
│
├── frontend/
│ ├── src/
│ ├── public/
│ └── package.json
│
└── README.md


---

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/Iamzohaibali/codealpha_tasks.git
cd social-media-app

cd backend
npm install
npm start

cd frontend
npm install
npm start
