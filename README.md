# Live Polling System

A real-time polling application with teacher and student roles using React, Redux, Express, and Socket.io.

## Features

### Teacher Features
- Create new polls with custom questions and options
- Configure time limit for polls
- View live polling results
- Access poll history
- Kick students from the session
- Chat with students

### Student Features
- Join with a unique name (persisted in browser tab)
- Answer polls within the time limit
- View live poll results after answering or when time expires
- Chat with teacher and other students

## Project Structure

```
polling-system/
├── backend/             # Express and Socket.io server
│   ├── package.json
│   └── server.js
└── frontend/            # React application
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   │   ├── HomePage.js
    │   │   ├── TeacherPage.js
    │   │   └── StudentPage.js
    │   ├── redux/
    │   │   └── store.js
    │   ├── services/
    │   │   └── socketService.js
    │   ├── App.js
    │   ├── index.css
    │   └── index.js
    └── package.json
```

## Installation

### Backend Setup
1. Navigate to the backend directory:
   ```
   cd polling-system/backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the server:
   ```
   npm start
   ```
   The server will run on http://localhost:5000

### Frontend Setup
1. Navigate to the frontend directory:
   ```
   cd polling-system/frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the React application:
   ```
   npm start
   ```
   The application will run on http://localhost:3000

## Usage

1. Open http://localhost:3000 in your browser
2. Choose your role (Teacher or Student)
3. If you're a teacher, you can create polls and view results
4. If you're a student, you can answer polls and view results after submission

## Deployment

### Backend Deployment
The backend can be deployed to platforms like Heroku, AWS, or any Node.js hosting service.

### Frontend Deployment
The React frontend can be built for production using:
```
cd polling-system/frontend
npm run build
```

The build folder can then be deployed to services like Netlify, Vercel, or GitHub Pages.

## Technologies Used

- **Frontend**: React, Redux, React Router, Socket.io Client, Bootstrap
- **Backend**: Express.js, Socket.io
- **State Management**: Redux Toolkit
- **Styling**: Bootstrap 5