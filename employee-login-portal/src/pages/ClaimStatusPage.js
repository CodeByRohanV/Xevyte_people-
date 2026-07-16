import React, { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";

import api from "../api";
import { formatDateToIST } from '../utils/DateUtils';
import ToastNotification from '../components/ToastNotification';

import './ClaimStatusPage.css';
import './Dashboard.css';
import { Link, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import Sidebar from './Sidebar.js';
import { FiEye } from 'react-icons/fi';
pdfjs.GlobalWorkerOptions.workerSrc = `./pdf.worker.min.js`;

function ClaimStatusPage() {
  const [claims, setClaims] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const employeeId = sessionStorage.getItem("employeeId");
  const [employeeName, setEmployeeName] = useState(sessionStorage.getItem("employeeName"));

  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  // Toast state
  const [toast, setToast] = useState({ open: false, message: '', type: 'error' });
  const showToast = (message, type = 'error') => setToast({ open: true, message, type });
  const closeToast = () => setToast(t => ({ ...t, open: false }));
  const formatDate = (dateString) => {
    return formatDateToIST(dateString);
  };
  const truncateFileName = (fileName, length = 10) => {
    if (!fileName) {
      return "No Receipt";
    }
    if (fileName.length > length) {
      return `${fileName.substring(0, length)}...`;
    }
    return fileName;
  };
  useEffect(() => {
    setLoading(true); // start loading before fetch

    fetch(`/claims/history/${employeeId}`)

      .then(res => res.json())
      .then(data => {
        const filteredClaims = data.filter(
          claim => claim.status !== "Rejected" && claim.status !== "Paid"
        );

        const sortedClaims = filteredClaims.sort((a, b) => b.id - a.id);

        setClaims(sortedClaims);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching status:", err);
        setLoading(false); // stop loading on error
      });
  }, [employeeId]);
  const handleDownloadReceipt = async (claimId, fileName) => {
    try {
      const response = await api.get(
        `/claims/receipt/${claimId}`,

        { responseType: "blob" } // Ensure the response is a blob
      );

      // Create a temporary URL for the blob data
      const fileURL = window.URL.createObjectURL(new Blob([response.data]));

      // Create a hidden anchor element
      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', fileName); // Set the filename for download
      document.body.appendChild(link); // Append to the document body

      // Trigger the download
      link.click();

      // Clean up by removing the link and revoking the URL
      document.body.removeChild(link);
      window.URL.revokeObjectURL(fileURL);

    } catch (error) {
      console.error("Error downloading receipt:", error);
      showToast("Failed to download the receipt.", "error");
    }
  };
  // --- UPDATED PREVIEW LOGIC ---
  const handleViewReceipt = async (claimId, fileName) => {
    try {

      const response = await api.get(
        `/claims/receipt/${claimId}`,

        { responseType: "blob" }
      );

      const fileExtension = fileName.split('.').pop().toLowerCase();
      const fileUrl = URL.createObjectURL(response.data);

      setPreviewFile(fileUrl);
      if (fileExtension === 'pdf') {
        setFileType('pdf');
      } else {
        setFileType('image');
      }
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching receipt:", error);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1); // Reset to first page on load
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setPreviewFile(null);
    setFileType(null);
    setNumPages(null);
    setPageNumber(1);
    URL.revokeObjectURL(previewFile); // Clean up the object URL
  };

  const goToPrevPage = () => setPageNumber(prevPageNumber => prevPageNumber - 1);
  const goToNextPage = () => setPageNumber(prevPageNumber => prevPageNumber + 1);

  // Filter the claims based on the search term.
  // We use useMemo to optimize and prevent re-calculation on every render.
  const filteredClaims = useMemo(() => {
    if (!searchTerm) {
      return claims;
    }
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return claims.filter(claim => {
      // Create an array of values from the claim object to search through.
      // This includes all the fields in your table.
      const searchableFields = [
        String(claim.id),
        String(claim.employeeId),
        claim.name,
        claim.category,
        String(claim.amount),
        claim.expenseDescription,
        claim.businessPurpose,
        claim.additionalNotes,
        claim.expenseDate,
        claim.receiptName,
        claim.submittedDate ? formatDate(claim.submittedDate) : "N/A",
        claim.status,
        claim.nextApprover,
      ];

      // Check if any of the fields contain the search term.
      return searchableFields.some(field =>
        field && field.toLowerCase().includes(lowercasedSearchTerm)
      );
    });
  }, [claims, searchTerm]);

  return (
    <Sidebar>
      <div style={{ padding: "0" }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: "8px 16px", // Slightly reduced padding
            backgroundColor: "#f0f0f0",
            color: "#333",
            fontSize: '15px',
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: "pointer",
            margin: "20px 0 20px 0", // Top and bottom margins only
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            transition: "background-color 0.3s ease",
            width: "fit-content", // Make width only as big as content
            display: "block", // Ensure it respects margin auto if needed
          }}
        >
          ⬅ Back
        </button>

        <h2>Your Claim Status</h2>

        {loading ? null : claims.length === 0 ? (
          <p>No claims submitted yet.</p>
        ) : filteredClaims.length === 0 ? (
          <p>No claims found for your search criteria.</p>
        ) : (
          <div className="table">
            <table className="status-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>

                  <th>Category</th>
                  <th>Amount</th>
                  <th>Description</th>

                  <th>Expense Date</th>
                  <th>Receipt</th>
                  <th>Submitted Date</th>
                  <th>Status</th>
                  <th>Next Approver</th>
                </tr>
              </thead>
              <tbody>
                {filteredClaims.map((claim) => (
                  <tr key={claim.id}>

                    <td>{claim.category}</td>
                    <td>{claim.amount}</td>
                    <td>{claim.expenseDescription}</td>
                    {/* <td>{claim.businessPurpose}</td> */}
                    {/* <td>{claim.additionalNotes}</td> */}
                    <td>{formatDate(claim.expenseDate)}</td>
                    <td>
                      {claim.receiptName ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handleDownloadReceipt(claim.id, claim.receiptName);
                            }}
                            style={{
                              cursor: "pointer",
                              color: "blue",
                              textDecoration: "underline",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <span title={claim.receiptName}>
                              {truncateFileName(claim.receiptName)}
                            </span>
                          </a>
                          <button
                            onClick={() => handleViewReceipt(claim.id, claim.receiptName)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "#3b82f6",
                              display: "flex",
                              alignItems: "center",
                              padding: "4px",
                              fontWeight: 'normal',
                              fontSize: '15px',
                              textDecoration: 'underline'
                            }}
                            title="Preview Receipt"
                          >
                            Preview
                          </button>
                        </div>
                      ) : "No Receipt"}
                    </td>
                    <td>{claim.submittedDate ? formatDate(claim.submittedDate) : "N/A"}</td>
                    <td>{claim.status}</td>
                    <td>{claim.nextApprover || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {isModalOpen && previewFile && (
          <div style={{
            position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center",
            justifyContent: "center", zIndex: 1000
          }}>
            <div style={{
              backgroundColor: "#fff", padding: "20px", borderRadius: "8px",
              boxShadow: "0 0 10px rgba(0,0,0,0.25)", maxWidth: "90%", maxHeight: "90%", textAlign: "center"
            }}>
              <h3>Receipt Preview</h3>
              {fileType === 'pdf' ? (
                <>
                  <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
                    <Document file={previewFile} onLoadSuccess={onDocumentLoadSuccess}>
                      <Page pageNumber={pageNumber} />
                    </Document>
                  </div>
                  <div className="pdf-controls">
                    <p>Page {pageNumber} of {numPages}</p>
                    <button onClick={goToPrevPage} disabled={pageNumber <= 1}>Previous</button>
                    <button onClick={goToNextPage} disabled={pageNumber >= numPages}>Next</button>
                  </div>
                </>
              ) : (
                <img
                  src={previewFile}
                  alt="Receipt"
                  style={{ maxWidth: "100%", maxHeight: "70vh", marginBottom: "20px" }}
                />
              )}
              <br />
              <button onClick={handleCloseModal} style={{
                padding: "10px 20px", border: "none", backgroundColor: "#f44336",
                color: "#fff", borderRadius: "5px", cursor: "pointer", marginTop: '0'
              }}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
      <ToastNotification
        isOpen={toast.open}
        onClose={closeToast}
        message={toast.message}
        type={toast.type}
      />
    </Sidebar>
  );
}

export default ClaimStatusPage;
