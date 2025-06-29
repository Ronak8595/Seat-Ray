# Seat Ray

**Seat Ray** is a next-generation web application designed to help travelers choose the perfect seat for breathtaking sunrise and sunset views during their flights. By combining advanced sun position algorithms with AI-driven insights, Seat Ray delivers personalized recommendations, interactive visualizations, and expert tips for an unforgettable journey.

---

## 🌍 What is Seat Ray?

Seat Ray analyzes your flight details—departure, destination, date, and duration—to calculate the sun's path along your route. It then recommends the optimal side of the plane for the best views, highlights key moments, and provides AI-powered advice to enhance your experience.

---

## ✨ Features

- **Real-Time Sun Tracking:** Visualize the sun's position along your flight path on an interactive map.
- **Smart Seat Suggestions:** Instantly know whether to sit on the left, right, or neither for the best sunrise/sunset views.
- **AI-Powered Analysis:** Get detailed explanations, practical tips, and weather considerations powered by Google Gemini.
- **Global Airport Support:** Works with thousands of airports worldwide.
- **Intuitive UI:** Modern, responsive design with smooth animations and easy-to-use controls.

---

## 🛫 How It Works

1. **Enter Flight Details:** Select your departure and arrival airports, date, and flight duration.
2. **Sun Path Calculation:** The app computes the sun's trajectory relative to your flight.
3. **Interactive Visualization:** Explore your route and sun position on a dynamic map with a time slider.
4. **AI Insights:** Receive tailored recommendations and tips for your journey.
5. **Enjoy the View:** Use the advice to pick your seat and make the most of your flight.

---

## ⚡ Quick Start

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Installation

```bash
git clone <repository-url>
cd seat-ray
npm install
```

### Development

```bash
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
npm run build
npm run preview
```

The app will be served from the `dist/` directory.

---

## 🤖 AI Integration (Gemini)

To unlock AI-powered recommendations:

1. Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey).
2. Create a `.env` file in the project root:
   ```
   VITE_GEMINI_API_KEY=your_api_key_here
   ```
3. Restart the development server.

---

## 🖥️ Technology Stack

- **React** (with TypeScript)
- **Vite** (build tool)
- **Tailwind CSS** (styling)
- **Leaflet & React-Leaflet** (maps)
- **Luxon** (date/time)
- **SunCalc** (sun position)
- **Google Gemini API** (AI)

---

## 📋 Usage Guide

1. Select your source and destination airports.
2. Set your departure time and flight duration.
3. Click "Calculate" to analyze your flight.
4. Explore the interactive map and time slider.
5. Review seat recommendations and AI insights.

---

## 🤝 Contributing

- Fork this repository
- Create a new branch for your feature or fix
- Commit your changes with clear messages
- Open a pull request for review

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙌 Credits

- Sun position calculations: SunCalc
- AI analysis: Google Gemini
- Mapping: Leaflet
- UI: Tailwind CSS, React

---

**Made with passion by Ronak**
