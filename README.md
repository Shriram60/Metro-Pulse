# 🚇 Metro-Pulse

A full-stack metro route management platform that helps users explore metro stations, plan journeys, and track their travel history with ease.

## ✨ Features

- **Station Exploration**: Browse and search metro stations across the network
- **Route Planning**: Find optimal metro routes between any two stations
- **Favorite Routes**: Save and manage your favorite commute routes for quick access
- **Journey History**: Track and view your past metro journeys
- **Secure Authentication**: JWT-based user authentication with bcrypt password hashing
- **User Profiles**: Personalized user accounts with saved preferences
- **RESTful APIs**: Efficient backend APIs for seamless data handling

## 🛠️ Technology Stack

### Frontend
- **React.js** - UI library for interactive user interfaces
- **JavaScript** - Core programming language
- **[Add your styling library - CSS, Tailwind, Material-UI, etc.]**

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework for building APIs
- **MongoDB** - NoSQL database for flexible data storage
- **JWT** - Secure token-based authentication
- **bcrypt** - Password hashing and security

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local or cloud instance like MongoDB Atlas)

## 🚀 Getting Started

### 1. Clone the Repository

\`\`\`bash
git clone https://github.com/Shriram60/Metro-Pulse.git
cd Metro-Pulse
\`\`\`

### 2. Setup Backend

\`\`\`bash
cd backend
npm install
\`\`\`

Create a `.env` file in the backend directory:
\`\`\`
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5000
\`\`\`

Start the backend server:
\`\`\`bash
npm start
\`\`\`

The backend will run on `http://localhost:5000`

### 3. Setup Frontend

\`\`\`bash
cd front-end
npm install
\`\`\`

Create a `.env` file in the frontend directory (if needed):
\`\`\`
REACT_APP_API_URL=http://localhost:5000
\`\`\`

Start the React development server:
\`\`\`bash
npm start
\`\`\`

The frontend will open at `http://localhost:3000`

## 📁 Project Structure

\`\`\`
Metro-Pulse/
├── backend/              # Node.js/Express backend
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API endpoints
│   ├── controllers/      # Business logic
│   └── middleware/      # Authentication & validation
├── front-end/           # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API calls
│   │   └── App.js
│   └── public/
└── README.md
\`\`\`

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login

### Stations
- `GET /api/stations` - Get all stations
- `GET /api/stations/:id` - Get station details

### Routes
- `GET /api/routes` - Get available routes
- `POST /api/routes/search` - Search routes between stations
- `POST /api/routes/favorite` - Save favorite route
- `GET /api/routes/favorites` - Get favorite routes

### Journey History
- `POST /api/journeys` - Log a journey
- `GET /api/journeys` - Get user's journey history

## 🔐 Authentication

The app uses JWT (JSON Web Tokens) for secure authentication:
- User passwords are hashed using bcrypt before storage
- JWT tokens are issued upon successful login
- Include the token in the `Authorization: Bearer <token>` header for protected routes

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👤 Author

**Shriram60**
- GitHub: [@Shriram60](https://github.com/Shriram60)

## 🙋 Support

If you encounter any issues or have questions, please open an issue on the GitHub repository.

## 🎯 Future Enhancements

- [ ] Real-time transit updates
- [ ] Push notifications for delays
- [ ] Mobile app (React Native)
- [ ] Integration with live metro APIs
- [ ] Advanced analytics dashboard
- [ ] Social sharing features
