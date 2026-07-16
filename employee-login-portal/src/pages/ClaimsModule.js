import React, { useState } from 'react';
import ClaimsPage from './ClaimsPage';
import ClaimStatusPage from './ClaimStatusPage';
import ClaimHistoryPage from './ClaimHistoryPage';
import NewClaim from './NewClaim';

function ClaimsModule() {
  const [view, setView] = useState('list'); // default page

  const renderPage = () => {
    switch(view) {
      case 'list': return <ClaimsPage />;
      case 'status': return <ClaimStatusPage />;
      case 'history': return <ClaimHistoryPage />;
      case 'new': return <NewClaim />;
      default: return <ClaimsPage />;
    }
  }

  return (
    <div>
      {/* Example buttons to switch views */}
      <button onClick={() => setView('list')}>All Claims</button>
      <button onClick={() => setView('status')}>Status</button>
      <button onClick={() => setView('history')}>History</button>
      <button onClick={() => setView('new')}>New Claim</button>

      <hr />
      {renderPage()}
    </div>
  );
}

export default ClaimsModule;
