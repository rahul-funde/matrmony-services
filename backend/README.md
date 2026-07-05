# Node.js Backend with Couchbase Authentication

## 📌 Project Overview
This Node.js backend provides user authentication using **Couchbase**, **JWT**, **Email Verification**, and **OTP-based Login**.

## 🚀 Features
- **User Registration** (with password hashing)
- **Login with JWT Authentication**
- **Email Verification** (via Nodemailer)
- **Two-Factor Authentication (OTP-based Login)**
- **Forgot Password & Reset Password**

---

## 📁 Folder Structure
```
project-root/
│── src/
│   ├── controllers/      # API Controllers
│   ├── routes/           # Express Routes
│   ├── middleware/       # Authentication Middleware
│   ├── config/           # Database Configuration
│   ├── utils/            # Helper Functions
│   ├── index.js          # Entry Point
│── .env                  # Environment Variables
│── package.json          # Dependencies & Scripts
│── README.md             # Documentation
```

---

## 📦 Installed Packages
Run the following command to install dependencies:
```bash
npm install express dotenv cors bcryptjs jsonwebtoken couchbase nodemailer crypto
```
For development (auto-restart on file changes):
```bash
npm install --save-dev nodemon
```

### **Package Explanation**
| Package        | Description |
|---------------|-------------|
| express       | Web framework for creating APIs |
| dotenv        | Loads environment variables from `.env` file |
| cors          | Enables Cross-Origin Resource Sharing (CORS) |
| bcryptjs      | Hashes and verifies passwords securely |
| jsonwebtoken  | Generates and verifies JWT tokens |
| couchbase     | Couchbase SDK for database interactions |
| nodemailer    | Sends emails (for verification & OTP) |
| crypto        | Generates random OTP codes securely |
| nodemon       | (Dev) Auto-restarts server on changes |
bcrypt
winston
express-rate-limit
validator
morgan
---

## 🔧 Configuration (`.env` file)
Create a `.env` file in the root directory with the following content:
```ini
PORT=5000
COUCHBASE_HOST=localhost
COUCHBASE_BUCKET=your_bucket_name
COUCHBASE_USER=your_username
COUCHBASE_PASSWORD=your_password
JWT_SECRET=your_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
```

---

## 🏃 Running the Project

### **1️⃣ Start the Server**
For normal execution:
```bash
node src/index.js
```
For development mode (auto-restart on changes):
```bash
npx nodemon src/index.js
```

---

## 🛠️ API Endpoints

### **1️⃣ User Registration**
**Endpoint:** `POST /api/auth/register`
**Request Body:**
```json
{
  "firstname": "John",
  "middlename": "A.",
  "surname": "Doe",
  "dob": "1995-08-20",
  "gender": "Male",
  "mobileno": "1234567890",
  "email": "john.doe@example.com",
  "password": "securePassword"
}
```

### **2️⃣ Email Verification**
**Endpoint:** `GET /api/auth/verify-email?token=XYZ`

### **3️⃣ Login with JWT**
**Endpoint:** `POST /api/auth/login`
**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "securePassword"
}
```

### **4️⃣ Login with OTP**
**Step 1: Request OTP**  
**Endpoint:** `POST /api/auth/login-otp`
```json
{
  "email": "john.doe@example.com",
  "password": "securePassword"
}
```

**Step 2: Verify OTP**  
**Endpoint:** `POST /api/auth/verify-otp`
```json
{
  "otpToken": "someGeneratedToken",
  "otp": "123456"
}
```

---

## 📌 Next Steps
✅ **Email Verification Implemented**
✅ **OTP-based Secure Login Added**
🔜 **Role-Based Access Control (RBAC)**
🔜 **Google & Facebook OAuth Login**

🚀 Happy Coding! 🎉

Hello