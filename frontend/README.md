# Frontend README.md

# NavAI Operations Suite - Frontend

This document provides an overview of the frontend setup and usage for the NavAI Operations Suite application.

## Tech Stack

- **React JS**: A JavaScript library for building user interfaces.
- **React Router**: A library for routing in React applications.
- **Tailwind CSS**: A utility-first CSS framework for styling.
- **Axios**: A promise-based HTTP client for making API requests.

## Getting Started

### Prerequisites

Make sure you have the following installed:

- Node.js (version 14 or higher)
- npm (Node package manager)

### Installation

1. Navigate to the `frontend` directory:

   ```bash
   cd frontend
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

### Running the Application

To start the development server, run:

```bash
npm start
```

This will start the application and open it in your default web browser at `http://localhost:3000`.

### Folder Structure

- **src/components**: Contains reusable React components.
- **src/context**: Manages authentication state and user information using Context API.
- **src/hooks**: Custom hooks for managing state and side effects.
- **src/layouts**: Layout components for structuring pages.
- **src/pages**: Main pages of the application (e.g., Login, Dashboard).
- **src/services**: Handles API calls using Axios.
- **src/utils**: Utility functions for the frontend.

### Protected Routes

Certain routes in the application are protected and require authentication. Ensure that you are logged in to access these routes.

### Styling

The application uses Tailwind CSS for styling. You can customize the styles in the `tailwind.config.js` file.

### API Integration

The frontend communicates with the backend using Axios. Ensure that the backend server is running to make API calls successfully.

### Future Enhancements

- Implement additional pages and features as outlined in the project specifications.
- Improve user experience and accessibility.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.