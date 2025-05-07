import React from 'react';
// Import ErrorCode type from the new central types location
import { ErrorCode } from '../types'; 

// Removed local ErrorCode interface to use the imported one.
// interface ErrorCode {
//   id: string;
//   code: string;
//   defaultMessage: string;
//   category?: { id: string; name: string }; 
//   // Add other relevant fields like creationDate, updatedDate, etc.
// }

interface ErrorCodesListProps {
  errorCodes: ErrorCode[]; // Now uses the imported ErrorCode type
  onEdit: (errorCode: ErrorCode) => void;
  onDelete: (errorCodeId: string) => void;
  // Add other props like onFilterChange, onSortChange if needed
}

const ErrorCodesList: React.FC<ErrorCodesListProps> = ({ errorCodes, onEdit, onDelete }) => {
  if (!errorCodes || errorCodes.length === 0) {
    return <p>No error codes found.</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Code</th>
          <th>Default Message</th>
          <th>Category</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {errorCodes.map((ec) => (
          <tr key={ec.id}>
            <td>{ec.code}</td>
            <td>{ec.defaultMessage}</td>
            <td>{ec.category?.name || 'N/A'}</td>
            <td>
              <button onClick={() => onEdit(ec)}>Edit</button>
              <button onClick={() => onDelete(ec.id)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ErrorCodesList; 