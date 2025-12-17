import { useState, useEffect } from 'react';
import { ocrAPI } from '../services/api';

const History = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actrec, setActrec] = useState({});

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data } = await ocrAPI.getHistory();
      setRecords(data.records);
      setActrec(data.records);
    } catch (err) {
      setError('Error fetching history');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) {
      return;
    }

    try {
      await ocrAPI.deleteRecord(id);
      setRecords(records.filter(record => record.id !== id));
    } catch (err) {
      alert('Error deleting record');
    }
  };

  const handleCopy = (id) => {
  const selectedRecord = actrec.find(record => record.id === id);
  if (!selectedRecord || !selectedRecord.extractedText) {
    console.warn("No text found for this record.");
    return;
  }

  const textToCopy = selectedRecord.extractedText;

  // Try the modern clipboard API first
  if (navigator.clipboard && window.isSecureContext) {
    // Must be triggered by a click event — not async render
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        console.log("Copied to clipboard!");
        // alert("Text copied to clipboard!");
      })
      .catch((err) => {
        console.error("Clipboard API failed, using fallback:", err);
        fallbackCopyText(textToCopy);
      });
  } else {
    // Non-HTTPS or non-focused fallback
    fallbackCopyText(textToCopy);
  }
};

// Fallback function using a hidden textarea
const fallbackCopyText = (text) => {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand("copy");
    console.log(successful ? "Fallback copy successful" : "Fallback copy failed");
    // alert("Text copied!");
  } catch (err) {
    console.error("Fallback copy error:", err);
  }

  document.body.removeChild(textArea);
};

  if (loading) {
    return <div className="loading">Loading history...</div>;
  }

  return (
    <div className="history-container">
      <h2>📚 OCR History</h2>
      {error && <div className="error-message">{error}</div>}
      
      {records.length === 0 ? (
        <div className="empty-state">
          <p>No records yet. Start scanning images!</p>
        </div>
      ) : (
        <div className="records-grid">
          {records.map((record) => (
            <div key={record.id} className="record-card">
              <div className="record-header">
                <span className="record-date">
                  {new Date(record.createdAt).toLocaleString()}
                </span>
                <button
                  onClick={() => handleDelete(record.id)}
                  className="btn-delete"
                >
                  🗑️
                </button>
              </div>
              <div className="record-text">
                {record?.extracted_text?.substring(0, 200)}
                {record?.extracted_text?.length > 200 && '...'}
              </div>
              <button
                onClick={() => handleCopy(record.id)}
                className="btn btn-small"
              >
                📋 Copy Full Text
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;