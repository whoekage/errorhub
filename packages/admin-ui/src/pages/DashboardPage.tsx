import React from 'react';
import { Link } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  return (
    <div>
      <h1>Dashboard</h1>
      {/* Key metrics: Total errors, translation coverage, most used error codes */}
      {/* Visual elements: Status cards, language coverage chart, recent activity feed */}
      {/* Quick actions: Add new error code, add translation, manage categories */}
      <div>
        <h2>Quick Actions</h2>
        <Link to="/errors/new">
          <button>Add new error code</button>
        </Link>
        {/* Add other quick action links/buttons here */}
      </div>
    </div>
  );
};

export default DashboardPage; 