# EPIC-Vital Care

**EPIC-Vital Care** is a secure and user-friendly web application for remote healthcare monitoring. It provides tailored dashboards and features for doctors, patients, and admins.

## 🔑 Features

- **Role-Based Access Control**: Login determines access to Doctor, Patient, or Admin dashboards.
- **Secure Login**: Credentials are stored securely.
- **Doctor Dashboard**: View and access assigned patient data from connected health sensors.
- **Patient Dashboard**: View personal health metrics.
- **Admin Dashboard**: Manage all users and view data (doctors have no health metrics).
- **Patient Registration**: Requires selecting an assigned doctor.
- **Search**: Admins and doctors can filter users via table search.
- **Chat**: Users can send messages and view chat history.
- **Feedback**: Users can submit comments and ratings.

## ⚙️ Installation

Requires Node.js (v14 or later).

```
npm install
npm run dev
```

App will run at: [http://localhost:3000](http://localhost:3000)

## 🚀 Production Build

```
npm run build
```

This creates a production-ready static website. You can deploy it to services like Amazon S3 with website hosting enabled.

## 🌐 Live Demo

Visit the live site at: [https://www.pardisno.com/](https://www.pardisno.com/)

## 🧪 Sample Credentials

- **Admin**: `pardis` / `12345`
- **Doctor**: `shahram` / `56789`
- **Patient**: `emma` / `12345` (assigned to Dr. Shahram)

