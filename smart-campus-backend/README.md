# 🏫 Smart Campus - Backend API

The central nervous system of the Smart Campus project. This Node.js service acts as the bridge between the **AI Vision System (Python)**, **Google Calendar**, and the **Dashboard (React)**.

## 🚀 Key Features

* **Real-Time Occupancy:** Receives live people counts from YOLOv11 cameras via REST API.
* **👻 Ghost Booking Detection:** Intelligently compares "Scheduled Classes" (Google Calendar) vs. "Actual Reality" (AI Camera). If a room is booked but empty, it flags it as a *Ghost Booking*.
* **Google Calendar Integration:** Uses Service Accounts to fetch schedules and manage room bookings without manual input.
* **Live WebSockets:** Pushes updates instantly to the frontend (no polling required).
* **Analytics Engine:** Logs usage data to MongoDB for future resource optimization insights (via Gemini AI).

## 🛠️ Tech Stack

* **Runtime:** Node.js (ES Modules)
* **Framework:** Express.js
* **Database:** MongoDB (Atlas/Local) + Mongoose
* **Caching/Queues:** Redis
* **Real-Time:** Socket.io
* **Integrations:** Google Calendar API, Google Gemini (GenAI)

---

## ⚙️ Prerequisities

Ensure you have the following installed:
* [Node.js](https://nodejs.org/) (v18+)
* [MongoDB](https://www.mongodb.com/) (Running locally or have an Atlas URI)
* [Redis](https://redis.io/) (Running locally)

---

## 📥 Installation & Setup

1.  **Clone the repository** (if you haven't already):
    ```bash
    git clone [https://github.com/your-username/smart-campus.git](https://github.com/your-username/smart-campus.git)
    cd smart-campus/backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the `backend/` root directory:
    ```ini
    NODE_ENV=development
    PORT=5000

    # 🍃 Database
    MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/smart-campus

    # ⚡ Cache
    REDIS_URL=redis://127.0.0.1:6379

    # Frontend
    FRONTEND_URL=http://your-frontend-url

    # 📅 Google Services (Get these from Google Cloud Console)
    # Note: For testing, the Mock Service is enabled by default.
    GOOGLE_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
    GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
    ```

4.  **Seed the Database:**
    Populate MongoDB with initial Room data (linked to specific Cameras and Calendars).
    

5.  **Start the Server:**
    ```bash
    # Development Mode (Hot Reloading if nodemon is installed)
    npm run dev
    
    # Or Standard Start
    node server.js
    ```

---

## 📡 API Documentation

### 🏠 Room Management

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/api/rooms` | Get list of all rooms with live status. |
| **GET** | `/api/rooms/:id` | Get details & today's schedule for a specific room (e.g., `101`). |

### 🤖 AI Integration (Internal)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **POST** | `/api/rooms/update-occupancy` | Called by **Python Worker**. Updates occupancy & triggers Ghost checks. |

**Payload for `update-status`:**
```json
{
  "cameraId": "CAM_001",
  "personCount": 5
}