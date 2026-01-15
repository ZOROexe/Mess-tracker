# 🍽️ Mess Food & Expense Tracker

A full-stack web application to track daily food consumption from a mess and outside sources, calculate monthly expenses automatically, and visualize spending using a calendar-based interface.

Built for real-world usage with dynamic pricing, accurate billing, and a clean UX.

---

## Live Demo

👉 [https://your-vercel-app-url.vercel.app](https://mess-tracker-neon.vercel.app)  

---

## Features

### Calendar-Based Food Logging
- Track **Breakfast, Lunch, Dinner** for each day
- Log food source:
  - Mess
  - Outside
  - Not taken
- Click any date to **add or edit entries**

### Automatic Cost Calculation
- Mess food prices calculated **on the backend**
- Outside food cost entered manually
- Monthly totals computed automatically

### Monthly Summary
- Total Mess expense
- Total Outside expense
- Grand total for the month

### Visual Indicators
- 🟢 Green → Mess only
- 🟠 Orange → Mess + Outside
- 🔴 Red → Outside only

### Dynamic Mess Pricing
- Mess prices stored in database
- Prices can change over time using an **effective date**
- Old records remain accurate (no retroactive changes)

### Smart Design
- One entry per day
- Backend-driven billing logic
- No frontend price manipulation

---

## Tech Stack

### Frontend
- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- FullCalendar

### Backend
- Next.js API Routes
- MongoDB
- Mongoose

### Deployment
- Vercel
- MongoDB Atlas
