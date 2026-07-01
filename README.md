# 🚑 MotoResQ – Emergency Fuel & Mechanic Assistance

MotoResQ is a web-based emergency assistance platform that connects stranded vehicle owners with nearby fuel stations and mechanics in real time. The project uses live location tracking and an optimized pathfinding algorithm to help users receive assistance as quickly as possible.

Designed as an academic team project, MotoResQ demonstrates the integration of networking, algorithms, geolocation, and modern web technologies into a practical real-world solution.

---

## ✨ Features

- 🚗 Request emergency fuel delivery or mechanic assistance
- 📍 Real-time user location tracking
- 🗺️ Interactive map powered by OpenStreetMap
- ⚡ Fast route calculation using the A* pathfinding algorithm
- 🔧 Dedicated dashboard for service providers
- 🚚 Live request tracking from user to provider
- 📱 Responsive and user-friendly interface

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **C++ (C++11)** | Backend Server |
| **Winsock2** | Socket Programming & HTTP Communication |
| **HTML5** | Structure |
| **CSS3** | Styling |
| **JavaScript** | Frontend Logic |
| **Leaflet.js** | Interactive Maps |
| **OpenStreetMap** | Map Tiles |
| **JSON** | Data Storage |
| **A* Algorithm** | Route Optimization |

---

## 📂 Project Structure

```text
MotoResQ/
│
├── motoresq_server.cpp      # Backend server and API handling
├── index.html               # User interface
├── script.js                # User-side logic
├── provider.html            # Provider dashboard
├── provider.js              # Provider functionality
├── delivery.html            # Delivery tracking page
├── delivery.js              # Live tracking logic
├── providers.json           # Service provider database
└── README.md
```

---

## 🚀 How It Works

1. The user requests emergency assistance.
2. The application fetches the user's current location.
3. Nearby fuel stations and mechanics are identified.
4. The A* algorithm calculates the optimal route.
5. The nearest provider receives the request.
6. The user can track the service request in real time.

---

## 🚀 Getting Started

### Clone the repository

```bash
git clone https://github.com/mohityadav24952-ai/MotoResQ.git
```

### Navigate to the project directory

```bash
cd MotoResQ
```

### Start the backend server

Compile the C++ server using your preferred compiler.

Example (MinGW):

```bash
g++ motoresq_server.cpp -o server -lws2_32
```

Run the executable:

```bash
server.exe
```

Finally, open `index.html` in your browser.

---

## 📸 Screenshots

Add screenshots of:

- Home Page
- User Dashboard
- Provider Dashboard
- Live Tracking
- Route Visualization

---

## 💡 Challenges Faced

- Implementing HTTP communication using Winsock2
- Integrating real-time geolocation
- Synchronizing user, provider, and delivery workflows
- Optimizing route calculation using the A* algorithm
- Managing service provider data with JSON

---

## 🔮 Future Improvements

- User Authentication
- Database Integration (MongoDB/MySQL)
- Payment Gateway
- Push Notifications
- Mobile Application
- Admin Dashboard
- Multi-city Support

---



## 📄 License

This project is developed for educational purposes.

---

## 👨‍💻 Author

**Mohit Kumar Yadav**

- GitHub: https://github.com/mohityadav24952-ai

---

⭐ If you found this project helpful, don't forget to give it a star!
