import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import socket from '../services/socketService';
import { 
  setActivePoll, 
  setPollResults, 
  setStudentName,
  addChatMessage 
} from '../redux/store';

const StudentPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { activePoll, pollResults, studentName, chatMessages } = useSelector(state => state.poll);
  
  const [nameInput, setNameInput] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [hasAnswered, setHasAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [isKicked, setIsKicked] = useState(false);
  const [chatTabActive, setChatTabActive] = useState(true);

  useEffect(() => {
    // Check if student name exists in localStorage
    const storedName = localStorage.getItem('studentName');
    if (storedName) {
      dispatch(setStudentName(storedName));
      socket.emit('register_student', { name: storedName });
    }
    
    // Listen for new polls
    socket.on('new_poll', (poll) => {
      dispatch(setActivePoll(poll));
      setHasAnswered(false);
      setSelectedOption('');
      setTimeLeft(poll.timeLimit);
    });
    
    // Listen for poll results
    socket.on('poll_results', (results) => {
      dispatch(setPollResults(results));
    });
    
    // Listen for poll ended
    socket.on('poll_ended', (data) => {
      dispatch(setPollResults(data.results));
      setHasAnswered(true);
    });
    
    // Listen for being kicked
    socket.on('kicked', () => {
      localStorage.removeItem('studentName');
      dispatch(setStudentName(''));
      setIsKicked(true);
    });
    
    // Listen for chat messages
    socket.on('chat_message', (message) => {
      dispatch(addChatMessage(message));
    });
    
    return () => {
      socket.off('new_poll');
      socket.off('poll_results');
      socket.off('poll_ended');
      socket.off('kicked');
      socket.off('chat_message');
    };
  }, [dispatch, navigate]);

  // Timer countdown effect
  useEffect(() => {
    let timer;
    if (activePoll && timeLeft > 0 && !hasAnswered) {
      timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
        if (timeLeft === 1) {
          setHasAnswered(true);
        }
      }, 1000);
    }
    
    return () => {
      clearTimeout(timer);
    };
  }, [activePoll, timeLeft, hasAnswered]);

  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (nameInput.trim()) {
      dispatch(setStudentName(nameInput));
      localStorage.setItem('studentName', nameInput);
      socket.emit('register_student', { name: nameInput });
    }
  };

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption) {
      socket.emit('submit_answer', { option: selectedOption });
      setHasAnswered(true);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (chatMessage.trim() && studentName) {
      const message = {
        sender: studentName,
        text: chatMessage,
        timestamp: new Date().toISOString()
      };
      socket.emit('chat_message', message);
      dispatch(addChatMessage(message));
      setChatMessage('');
    }
  };

  // If student is kicked
  if (isKicked) {
    return (
      <div className="container">
        <div className="interactive-poll">Interactive Poll</div>
        <div className="kicked-screen">
          <h2>You've been Kicked out!</h2>
          <p>Looks like the teacher had removed you from the poll system. Please try again sometime.</p>
          <button 
            className="continue-btn"
            onClick={() => {
              setIsKicked(false);
              navigate('/');
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // If student name is not set, show name input form
  if (!studentName) {
    return (
      <div className="container">
        <div className="interactive-poll">Interactive Poll</div>
        
        <div className="get-started-header">
          <h2>Let's Get Started</h2>
          <p>If you're a student, you'll be able to submit your answers, participate in live polls, and see how your responses compare with your classmates</p>
        </div>
        
        <div className="card">
          <div className="form-group">
            <label htmlFor="studentName">Enter your name</label>
            <input
              type="text"
              className="student-name-input"
              id="studentName"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Enter your name"
            />
          </div>
          
          <button 
            className="continue-btn"
            onClick={handleNameSubmit}
            disabled={!nameInput.trim()}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // If no active poll
  if (!activePoll) {
    return (
      <div className="container">
        <div className="interactive-poll">Interactive Poll</div>
        
        <div className="waiting-screen">
          <div className="waiting-spinner"></div>
          <h2 className="waiting-text">Wait for the teacher to ask questions..</h2>
        </div>
        
        {showChat && (
          <div className="chat-popup">
            <div className="chat-tabs">
              <div 
                className={`chat-tab ${chatTabActive ? 'active' : ''}`}
                onClick={() => setChatTabActive(true)}
              >
                Chat
              </div>
              <div 
                className={`chat-tab ${!chatTabActive ? 'active' : ''}`}
                onClick={() => setChatTabActive(false)}
              >
                Participants
              </div>
            </div>
            
            {chatTabActive ? (
              <div className="chat-content">
                {chatMessages.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`chat-message ${msg.sender === studentName ? 'self' : ''}`}
                  >
                    {msg.sender !== studentName && (
                      <div className="chat-message-sender">{msg.sender}</div>
                    )}
                    <div className="chat-message-text">{msg.text}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="participants-list">
                {/* Participants list would go here */}
              </div>
            )}
            
            <div className="chat-input-container">
              <input
                type="text"
                className="chat-input"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type a message..."
              />
              <button 
                className="chat-send-btn"
                onClick={handleSendMessage}
              >
                →
              </button>
            </div>
          </div>
        )}
        
        <div 
          className="chat-button"
          onClick={() => setShowChat(!showChat)}
        >
          💬
        </div>
      </div>
    );
  }

  // Active poll view
  return (
    <div className="container">
      <div className="question-container">
        <div className="question-box">
          <div className="question-header">
            <div className="question-number">
              <span>Question 1</span>
              {timeLeft > 0 && !hasAnswered && (
                <span className="timer-badge">{timeLeft}s</span>
              )}
            </div>
            <h3 className="question-title">{activePoll.question}</h3>
          </div>
          
          {!hasAnswered ? (
            <div className="option-list">
              {activePoll.options.map((option) => (
                <div 
                  key={option}
                  className={`student-option ${selectedOption === option ? 'selected' : ''}`}
                  onClick={() => handleOptionSelect(option)}
                >
                  <div className={`student-option-circle ${selectedOption === option ? 'selected' : ''}`}></div>
                  <span>{option}</span>
                </div>
              ))}
              
              <button 
                className="submit-button"
                onClick={handleSubmitAnswer}
                disabled={!selectedOption}
              >
                Submit
              </button>
            </div>
          ) : (
            <div className="option-list">
              {activePoll.options.map((option, index) => {
                const votes = pollResults[option] || 0;
                const totalVotes = Object.values(pollResults).reduce((a, b) => a + b, 0);
                const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                
                return (
                  <div key={index}>
                    <div className="option-item">
                      <div className="option-circle"></div>
                      <span className="option-text">{option}</span>
                      <span className="option-percentage">{percentage}%</span>
                    </div>
                    <div className="progress-container">
                      <div 
                        className="progress-bar" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
              
              <div className="wait-for-teacher">
                Wait for the teacher to ask a new question.
              </div>
            </div>
          )}
        </div>
      </div>
      
      {showChat && (
        <div className="chat-popup">
          <div className="chat-tabs">
            <div 
              className={`chat-tab ${chatTabActive ? 'active' : ''}`}
              onClick={() => setChatTabActive(true)}
            >
              Chat
            </div>
            <div 
              className={`chat-tab ${!chatTabActive ? 'active' : ''}`}
              onClick={() => setChatTabActive(false)}
            >
              Participants
            </div>
          </div>
          
          {chatTabActive ? (
            <div className="chat-content">
              {chatMessages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`chat-message ${msg.sender === studentName ? 'self' : ''}`}
                >
                  {msg.sender !== studentName && (
                    <div className="chat-message-sender">{msg.sender}</div>
                  )}
                  <div className="chat-message-text">{msg.text}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="participants-list">
              {/* Participants list would go here */}
            </div>
          )}
          
          <div className="chat-input-container">
            <input
              type="text"
              className="chat-input"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Type a message..."
            />
            <button 
              className="chat-send-btn"
              onClick={handleSendMessage}
            >
              →
            </button>
          </div>
        </div>
      )}
      
      <div 
        className="chat-button"
        onClick={() => setShowChat(!showChat)}
      >
        💬
      </div>
    </div>
  );
};

export default StudentPage;