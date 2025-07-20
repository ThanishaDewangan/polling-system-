import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('');

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
  };

  const handleContinue = () => {
    if (selectedRole === 'teacher') {
      navigate('/teacher');
    } else if (selectedRole === 'student') {
      navigate('/student');
    }
  };

  return (
    <div className="container">
      <div className="badge">Interactive Poll</div>
      
      <div className="welcome-header">
        <h1>Welcome to the Live Polling System</h1>
        <p>Please select the role that best describes you to begin using the live polling system</p>
      </div>
      
      <div className="role-selection">
        <div 
          className={`role-card ${selectedRole === 'student' ? 'selected' : ''}`}
          onClick={() => handleRoleSelect('student')}
        >
          <h3>I'm a Student</h3>
          <p>Students can actively participate in dummy test of the printing and typesetting industry</p>
        </div>
        
        <div 
          className={`role-card ${selectedRole === 'teacher' ? 'selected' : ''}`}
          onClick={() => handleRoleSelect('teacher')}
        >
          <h3>I'm a Teacher</h3>
          <p>Teachers can create and view live poll results in real-time</p>
        </div>
      </div>
      
      <button 
        className="continue-btn" 
        onClick={handleContinue}
        disabled={!selectedRole}
      >
        Continue
      </button>
    </div>
  );
};

export default HomePage;