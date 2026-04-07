# Metro-Pulse

A full-stack metro route management platform that enables users to explore metro stations, plan journeys, and maintain a record of their travel history.

---

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Authentication](#authentication)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)
- [Support](#support)
- [Planned Enhancements](#planned-enhancements)

---

## Features

- **Station Exploration** — Browse and search metro stations across the network.
- **Route Planning** — Find optimal routes between any two stations.
- **Favorite Routes** — Save and manage frequently used commute routes for quick access.
- **Journey History** — View a complete log of past metro journeys.
- **Secure Authentication** — JWT-based user authentication with bcrypt password hashing.
- **User Profiles** — Personalized accounts with saved preferences.
- **RESTful API** — Well-structured backend endpoints for seamless data handling.

---

## Technology Stack

### Frontend

- **React.js** — UI library for building interactive interfaces.
- **JavaScript** — Core programming language.
- **CSS / Tailwind CSS / Material-UI** — Styling (update as applicable).

### Backend

- **Node.js** — Server-side runtime environment.
- **Express.js** — Web framework for API development.
- **MongoDB** — NoSQL database for flexible data storage.
- **JWT** — Token-based authentication.
- **bcrypt** — Secure password hashing.

---

## Prerequisites

Ensure the following are installed before proceeding:

- Node.js v14 or higher
- npm or yarn
- MongoDB (local installation or a cloud instance such as MongoDB Atlas)

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Shriram60/Metro-Pulse.git
cd Metro-Pulse
```

### 2. Configure and Start the Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory with the following variables:

```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

Start the backend server:

```bash
npm start
```

The server will be available at `http://localhost:5000`.

### 3. Configure and Start the Frontend

```bash
cd front-end
npm install
```

If required, create a `.env` file in the `front-end` directory:

```
REACT_APP_API_URL=http://localhost:5000
```

Start the development server:

```bash
npm start
```

The application will be available at `http://localhost:3000`.

---

## Project Structure

```
Metro-Pulse/
├── backend/
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API endpoint definitions
│   ├── controllers/      # Business logic
│   └── middleware/       # Authentication and validation
├── front-end/
│   ├── src/
│   │   ├── components/   # Reusable React components
│   │   ├── pages/        # Page-level components
│   │   ├── services/     # API call abstractions
│   │   └── App.js
│   └── public/
└── README.md
```

---

## API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Authenticate and receive a token |

### Stations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stations` | Retrieve all stations |
| GET | `/api/stations/:id` | Retrieve details of a specific station |

### Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/routes` | Retrieve all available routes |
| POST | `/api/routes/search` | Search for routes between two stations |
| POST | `/api/routes/favorite` | Save a route as a favorite |
| GET | `/api/routes/favorites` | Retrieve the user's saved favorite routes |

### Journey History

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/journeys` | Log a completed journey |
| GET | `/api/journeys` | Retrieve the user's journey history |

---

## Authentication

The application uses JSON Web Tokens (JWT) for stateless, secure authentication.

- Passwords are hashed using **bcrypt** prior to storage.
- A JWT token is issued upon successful login.
- All protected routes require the token to be included in the `Authorization` header as follows:

```
Authorization: Bearer <token>
```

---

## Contributing

Contributions are welcome. To contribute:

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add your feature description'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request for review.

---

## License

This project is licensed under the MIT License. Refer to the `LICENSE` file for full terms.

---

## Author

**Shriram60**  
GitHub: [github.com/Shriram60](https://github.com/Shriram60)

---

## Support

For bug reports or feature requests, please open an issue on the GitHub repository.

---

## Planned Enhancements

- Real-time transit updates
- Push notifications for service delays
- Mobile application (React Native)
- Integration with live metro APIs
- Advanced analytics dashboard
- Social sharing capabilities
