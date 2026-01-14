# 🏫 Smart Campus - AI Powered Space Management

> **TechSprint 2026 Hackathon Project**
> *Turn your campus into a Smart, Energy-Efficient, and Data-Driven ecosystem.*

## 📖 Overview
**Smart Campus** is an intelligent facility management system that solves the problem of **"Ghost Bookings"** (rooms booked but empty) and **Inefficient Space Usage**.

It combines **Computer Vision (YOLOv11)**, **Cloud Scheduling (Google Calendar)**, and **Generative AI (Gemini)** to provide real-time occupancy insights, automate room release, and optimize energy usage.

![Smart Campus Architecture](https://via.placeholder.com/800x400?text=Architecture+Diagram:+AI+Camera+%3E+Node+Backend+%3E+React+Dashboard)

---

## 🏗️ Architecture

The system is composed of three microservices:

1.  **👁️ AI Service (Python + YOLOv11)**
    * **Role:** The "Eyes". Captures camera feeds, detects humans, and counts occupancy.
    * **Features:** Real-time object detection, Simulator Mode (for testing without cameras).
    * **Output:** Sends occupancy data (e.g., `{"camera_id": "CAM_001", "count": 0}`) to the Backend.

2.  **🧠 Backend Service (Node.js + Express)**
    * **Role:** The "Brain". Manages data, logic, and integrations.
    * **Features:**
        * **Ghost Booking Engine:** Compares *Google Calendar* schedules vs. *AI Occupancy* data.
        * **WebSockets:** Pushes "Live Status" updates to the frontend instantly.
        * **Database:** Stores room metadata and historical logs in MongoDB.

3.  **💻 Frontend Dashboard (React + Vite)**
    * **Role:** The "Face". An interactive dashboard for Students and Admins.
    * **Features:** Live Occupancy Heatmaps, Room Booking (via Google Calendar), and Analytics Reports.

---

## 🚀 Quick Start Guide

Follow these steps to run the entire system locally for a demo.

### 1️⃣ Prerequisites
* [Node.js](https://nodejs.org/) (v18+)
* [Python](https://www.python.org/) (v3.9+)
* [MongoDB](https://www.mongodb.com/) (Local or Atlas)
* [Redis](https://redis.io/) (Optional, but recommended for production)

### 2️⃣ Clone & Configure
```bash
git clone [https://github.com/your-username/smart-campus.git](https://github.com/your-username/smart-campus.git)
cd smart-campus