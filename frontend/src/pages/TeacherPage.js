import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import socket from '../services/socketService';
import { 
  setActivePoll, 
  setPollResults, 
  setIsTeacher, 
  setPollHistory,
  addChatMessage,
  setStudents
} from '../redux/store';

const TeacherPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { activePoll, pollResults, pollHistory, chatMessages, students } = useSelector(state => state.poll);
  
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [optionsCorrect, setOptionsCorrect] = useState([false, false]);
  const [timeLimit, setTimeLimit] = useState(60);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const [studentAnswers, setStudentAnswers] = useState({});
  const [chatTabActive, setChatTabActive] = useState(true);

  useEffect(() => {
    // Set teacher status
    dispatch(setIsTeacher(true));
    
    // Listen for new poll results
    socket.on('poll_results', (results) => {
      dispatch(setPollResults(results));
    });
    
    // Listen for poll errors
    socket.on('poll_error', (data) => {
      setError(data.message);
      setTimeout(() => setError(''), 5000);
    });
    
    // Listen for poll ended
    socket.on('poll_ended', (data) => {
      dispatch(setPollResults(data.results));
      dispatch(setActivePoll(null));
    });
    
    // Listen for poll history
    socket.on('poll_history', (history) => {
      dispatch(setPollHistory(history));
    });
    
    // Listen for chat messages
    socket.on('chat_message', (message) => {
      dispatch(addChatMessage(message));
    });
    
    // Listen for student updates
    socket.on('students_update', (updatedStudents) => {
      dispatch(setStudents(updatedStudents));
    });
    
    // Listen for student answers
    socket.on('student_answer', (data) => {
      setStudentAnswers(prev => ({
        ...prev,
        [data.studentId]: data.option
      }));
    });
    
    // Request poll history
    socket.emit('get_poll_history');
    
    return () => {
      socket.off('poll_results');
      socket.off('poll_error');
      socket.off('poll_ended');
      socket.off('poll_history');
      socket.off('chat_message');
      socket.off('students_update');
      socket.off('student_answer');
    };
  }, [dispatch]);

  const handleAddOption = () => {
    setOptions([...options, '']);
    setOptionsCorrect([...optionsCorrect, false]);
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleOptionCorrectChange = (index, isCorrect) => {
    const newOptionsCorrect = [...optionsCorrect];
    newOptionsCorrect[index] = isCorrect;
    setOptionsCorrect(newOptionsCorrect);
  };

  const handleRemoveOption = (index) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      const newOptionsCorrect = optionsCorrect.filter((_, i) => i !== index);
      setOptions(newOptions);
      setOptionsCorrect(newOptionsCorrect);
    }
  };

  const handleCreatePoll = (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!question.trim()) {
      setError('Question cannot be empty');
      return;
    }
    
    const validOptions = options.filter(opt => opt.trim() !== '');
    if (validOptions.length < 2) {
      setError('At least two options are required');
      return;
    }
    
    // Create poll
    const pollData = {
      question,
      options: validOptions,
      optionsCorrect,
      timeLimit: parseInt(timeLimit)
    };
    
    socket.emit('create_poll', pollData);
    
    // Reset form
    setError('');
    setStudentAnswers({});
  };

  const handleKickStudent = (studentId) => {
    socket.emit('kick_student', studentId);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (chatMessage.trim()) {
      const message = {
        sender: 'Teacher',
        text: chatMessage,
        timestamp: new Date().toISOString()
      };
      socket.emit('chat_message', message);
      dispatch(addChatMessage(message));
      setChatMessage('');
    }
  };

  const handleAskNewQuestion = () => {
    // Reset form for new question
    setQuestion('');
    setOptions(['', '']);
    setOptionsCorrect([false, false]);
    dispatch(setActivePoll(null));
    setStudentAnswers({});
  };

  if (!activePoll) {
    return (
      <div className="container">
        <div className="interactive-poll">Interactive Poll</div>
        
        <div className="get-started-header">
          <h2>Let's Get Started</h2>
          <p>You'll have the ability to create and manage polls, ask questions, and monitor your students' responses in real-time.</p>
        </div>
        
        <div className="question-form">
          <div className="form-group">
            <label htmlFor="question">Enter your question</label>
            <input
              type="text"
              id="question"
              className="question-input"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Enter your question here"
            />
          </div>
          
          <div className="edit-options-section">
            <h3>Edit Options</h3>
            {options.map((option, index) => (
              <div key={index} className="option-row">
                <div className="option-circle"></div>
                <input
                  type="text"
                  className="option-input"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                />
                <div style={{display: 'flex', marginLeft: '10px'}}>
                  <div 
                    style={{
                      display: 'flex', 
                      alignItems: 'center', 
                      marginRight: '10px',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleOptionCorrectChange(index, true)}
                  >
                    <div 
                      style={{
                        width: '16px', 
                        height: '16px', 
                        borderRadius: '50%', 
                        border: '2px solid #6c5ce7',
                        backgroundColor: optionsCorrect[index] === true ? '#6c5ce7' : 'transparent',
                        marginRight: '5px'
                      }}
                    ></div>
                    <span>Yes</span>
                  </div>
                  <div 
                    style={{
                      display: 'flex', 
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleOptionCorrectChange(index, false)}
                  >
                    <div 
                      style={{
                        width: '16px', 
                        height: '16px', 
                        borderRadius: '50%', 
                        border: '2px solid #6c5ce7',
                        backgroundColor: optionsCorrect[index] === false ? '#6c5ce7' : 'transparent',
                        marginRight: '5px'
                      }}
                    ></div>
                    <span>No</span>
                  </div>
                </div>
              </div>
            ))}
            <button 
              type="button" 
              onClick={handleAddOption}
              className="add-option-btn"
            >
              + Add new option
            </button>
          </div>
          
          <div className="time-selector">
            <label htmlFor="timeLimit">60 seconds</label>
            <select 
              id="timeLimit" 
              value={timeLimit} 
              onChange={(e) => setTimeLimit(e.target.value)}
            >
              <option value="30">30 seconds</option>
              <option value="60">60 seconds</option>
              <option value="90">90 seconds</option>
              <option value="120">2 minutes</option>
            </select>
          </div>
          
          <button 
            type="button" 
            onClick={handleCreatePoll}
            className="ask-question-btn"
          >
            Ask Question
          </button>
        </div>
        
        {showHistory && (
          <div className="poll-history-modal">
            <h2>View Poll History</h2>
            
            {pollHistory && pollHistory.length > 0 ? (
              pollHistory.map((poll, index) => (
                <div key={index} className="poll-history-question">
                  <div className="poll-history-question-number">Question {index + 1}</div>
                  <div className="poll-history-question-text">{poll.question}</div>
                  
                  {Object.entries(poll.results || {}).map(([option, votes], i) => {
                    const totalVotes = Object.values(poll.results || {}).reduce((a, b) => a + b, 0);
                    const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                    
                    return (
                      <div key={i}>
                        <div className="option-result">
                          <span>{option}</span>
                          <span>{percentage}%</span>
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
                </div>
              ))
            ) : (
              <p>No poll history available yet.</p>
            )}
            
            <button 
              className="close-btn"
              onClick={() => setShowHistory(false)}
            >
              ×
            </button>
          </div>
        )}
        
        {error && <div className="error-message">{error}</div>}
      </div>
    );
  }

  // Active poll view
  return (
    <div className="container">
      <button 
        className="view-poll-history-btn"
        onClick={() => setShowHistory(true)}
      >
        View Poll History
      </button>
      
      <div className="question-container">
        <div className="question-box">
          <div className="question-header">
            <h3 className="question-title">{activePoll.question}</h3>
          </div>
          
          <div className="tab-bar">
            <div 
              className={`tab ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              Chat
            </div>
            <div 
              className={`tab ${activeTab === 'participants' ? 'active' : ''}`}
              onClick={() => setActiveTab('participants')}
            >
              Participants
            </div>
          </div>
          
          {activeTab === 'chat' ? (
            <div className="poll-options">
              {activePoll.options.map((option, index) => {
                const votes = pollResults[option] || 0;
                const totalVotes = Object.values(pollResults).reduce((a, b) => a + b, 0);
                const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                
                return (
                  <div key={index}>
                    <div className="poll-option">
                      <div className="poll-option-circle"></div>
                      <span className="poll-option-text">{option}</span>
                      <span className="poll-option-percentage">{percentage}%</span>
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
              
              <button 
                type="button" 
                onClick={handleAskNewQuestion}
                className="new-question-btn"
              >
                + Ask a new question
              </button>
            </div>
          ) : (
            <div className="participants-tab">
              {Object.values(students).length > 0 ? (
                Object.values(students).map((student, index) => (
                  <div key={index} className="participant-row">
                    <span className="participant-name">
                      {student.name}
                      {studentAnswers[student.id] && (
                        <span style={{color: '#6c5ce7', marginLeft: '10px', fontStyle: 'italic'}}>
                          - Answered: {studentAnswers[student.id]}
                        </span>
                      )}
                    </span>
                    <button 
                      className="kick-btn"
                      onClick={() => handleKickStudent(student.id)}
                    >
                      Kick out
                    </button>
                  </div>
                ))
              ) : (
                <p>No participants yet</p>
              )}
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
                  className={`chat-message ${msg.sender === 'Teacher' ? 'self' : ''}`}
                >
                  {msg.sender !== 'Teacher' && (
                    <div className="chat-message-sender">{msg.sender}</div>
                  )}
                  <div className="chat-message-text">{msg.text}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="participants-list">
              {Object.values(students).length > 0 ? (
                Object.values(students).map((student, index) => (
                  <div key={index} className="participant-item">{student.name}</div>
                ))
              ) : (
                <p>No participants yet</p>
              )}
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
        className="chat-icon"
        onClick={() => setShowChat(!showChat)}
      >
        💬
      </div>
      
      {showHistory && (
        <div className="poll-history-modal">
          <h2>View Poll History</h2>
          
          {pollHistory && pollHistory.length > 0 ? (
            pollHistory.map((poll, index) => (
              <div key={index} className="poll-history-question">
                <div className="poll-history-question-number">Question {index + 1}</div>
                <div className="poll-history-question-text">{poll.question}</div>
                
                {Object.entries(poll.results || {}).map(([option, votes], i) => {
                  const totalVotes = Object.values(poll.results || {}).reduce((a, b) => a + b, 0);
                  const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                  
                  return (
                    <div key={i}>
                      <div className="option-result">
                        <span>{option}</span>
                        <span>{percentage}%</span>
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
              </div>
            ))
          ) : (
            <p>No poll history available yet.</p>
          )}
          
          <button 
            className="close-btn"
            onClick={() => setShowHistory(false)}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default TeacherPage;