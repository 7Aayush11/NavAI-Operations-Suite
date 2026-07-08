# NavAI Operations Suite

## Overview

NavAI Operations Suite is an enterprise application designed to streamline operations and enhance productivity through intelligent insights and efficient management tools. This application is built using a modern tech stack, ensuring scalability, maintainability, and performance.

## Tech Stack

### Frontend
- **React JS**: A JavaScript library for building user interfaces.
- **React Router**: For routing and navigation within the application.
- **Tailwind CSS**: A utility-first CSS framework for styling.
- **Axios**: For making HTTP requests to the backend.

### Backend
- **Python**: The programming language used for backend development.
- **FastAPI**: A modern web framework for building APIs with Python.
- **SQLAlchemy**: An ORM for database interactions.
- **PostgreSQL**: The relational database used for data storage.
- **JWT Authentication**: For secure user authentication.
- **Pydantic**: For data validation and serialization.

## Project Structure

The project is organized into a feature-based architecture, separating concerns for better maintainability:

```
navai-operations-suite
├── backend
│   ├── app
│   │   ├── auth
│   │   ├── core
│   │   ├── database
│   │   ├── middleware
│   │   ├── models
│   │   ├── routers
│   │   ├── schemas
│   │   ├── services
│   │   ├── utils
│   │   └── main.py
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
├── frontend
│   ├── src
│   │   ├── components
│   │   ├── context
│   │   ├── hooks
│   │   ├── layouts
│   │   ├── pages
│   │   ├── services
│   │   ├── utils
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── README.md
└── README.md
```

## Getting Started

### Backend Setup

1. Navigate to the `backend` directory.
2. Create a virtual environment:
   - For Windows: `python -m venv venv`
   - For Linux: `source venv/bin/activate`
3. Install dependencies:
   - Run `pip install -r requirements.txt`
4. Set up the database connection in the `.env` file based on the `.env.example` template.
5. Run the FastAPI application:
   - Use `uvicorn app.main:app --reload` to start the server.

### Frontend Setup

1. Navigate to the `frontend` directory.
2. Install dependencies:
   - Run `npm install`
3. Start the React application:
   - Use `npm start` to launch the development server.

## Features

- JWT Authentication for secure access.
- Role-based authorization to manage user permissions.
- Responsive design using Tailwind CSS.
- Protected routes to secure sensitive pages.

## Testing

The application includes tests for:
- User authentication (login/logout).
- JWT token handling.
- Role-based access control.
- Database connection verification.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.