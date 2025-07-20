const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const path = require('path');
// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../frontend/build')));

// For any other requests, send back React's index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store active poll and results
let activePoll = null;
let pollResults = {};
let students = {};
let pollHistory = [];
let chatMessages = [];
let studentAnswers = {};

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Teacher creates a new poll
  socket.on('create_poll', (pollData) => {
    // Only create a new poll if no active poll or all students have answered
    const allStudentsAnswered = Object.values(students).every(student => 
      !student.active || student.answered
    );
    
    if (!activePoll || allStudentsAnswered) {
      const pollId = Date.now().toString();
      activePoll = {
        id: pollId,
        question: pollData.question,
        options: pollData.options,
        timeLimit: pollData.timeLimit || 60, // Default 60 seconds
        createdAt: Date.now()
      };
      
      // Reset poll results
      pollResults = {};
      activePoll.options.forEach(option => {
        pollResults[option] = 0;
      });
      
      // Reset answered status for all active students
      Object.keys(students).forEach(id => {
        if (students[id].active) {
          students[id].answered = false;
        }
      });
      
      // Reset student answers
      studentAnswers = {};
      
      // Broadcast new poll to all clients
      io.emit('new_poll', activePoll);
      
      // Broadcast updated students list
      io.emit('students_update', students);
      
      // Set timer to end poll
      setTimeout(() => {
        if (activePoll && activePoll.id === pollId) {
          const pollRecord = {
            ...activePoll,
            results: {...pollResults},
            endedAt: Date.now()
          };
          pollHistory.push(pollRecord);
          io.emit('poll_ended', { pollId, results: pollResults });
        }
      }, activePoll.timeLimit * 1000);
      
      console.log('New poll created:', activePoll);
    } else {
      // Notify teacher that poll cannot be created
      socket.emit('poll_error', { 
        message: 'Cannot create new poll until all students have answered the current one'
      });
    }
  });

  // Student registers
  socket.on('register_student', (data) => {
    const { name } = data;
    students[socket.id] = {
      id: socket.id,
      name,
      active: true,
      answered: activePoll ? false : true
    };
    
    // Send current poll to the student if one exists
    if (activePoll) {
      socket.emit('new_poll', activePoll);
    }
    
    // Broadcast updated students list
    io.emit('students_update', students);
    
    console.log('Student registered:', name);
  });

  // Student submits answer
  socket.on('submit_answer', (data) => {
    const { option } = data;
    
    if (activePoll && students[socket.id] && !students[socket.id].answered) {
      // Increment the count for this option
      pollResults[option] = (pollResults[option] || 0) + 1;
      
      // Mark student as answered
      students[socket.id].answered = true;
      
      // Store student's answer
      studentAnswers[socket.id] = option;
      
      // Broadcast updated results to all clients
      io.emit('poll_results', pollResults);
      
      // Broadcast student answer to teacher
      io.emit('student_answer', {
        studentId: socket.id,
        option: option
      });
      
      // Broadcast updated students list
      io.emit('students_update', students);
      
      console.log('Answer submitted by', students[socket.id].name, ':', option);
    }
  });

  // Teacher requests poll history
  socket.on('get_poll_history', () => {
    console.log('Sending poll history:', pollHistory);
    socket.emit('poll_history', pollHistory);
  });

  // Teacher kicks a student
  socket.on('kick_student', (studentId) => {
    if (students[studentId]) {
      io.to(studentId).emit('kicked');
      delete students[studentId];
      
      // Broadcast updated students list
      io.emit('students_update', students);
      
      console.log('Student kicked:', studentId);
    }
  });
  
  // Handle chat messages
  socket.on('chat_message', (message) => {
    chatMessages.push(message);
    // Keep only the last 100 messages
    if (chatMessages.length > 100) {
      chatMessages.shift();
    }
    io.emit('chat_message', message);
    console.log('Chat message:', message);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    if (students[socket.id]) {
      students[socket.id].active = false;
      
      // Broadcast updated students list
      io.emit('students_update', students);
    }
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});