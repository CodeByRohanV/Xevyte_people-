// Preview handler functions to add to ManagerTasks.js
// Add these after the fetchEmployeeName function (around line 60)

const handlePreview = async (leaveId, fileName) => {
    const token = sessionStorage.getItem("token");
    if (!token) return alert("Authorization required.");

    try {
        const response = await api.get(`/leaves/download/${leaveId}`, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'arraybuffer',
        });

        const fileExtension = fileName.split('.').pop().toLowerCase();
        let blob;
        if (fileExtension === 'pdf') {
            blob = new Blob([response.data], { type: 'application/pdf' });
        } else {
            blob = new Blob([response.data]);
        }

        const fileUrl = URL.createObjectURL(blob);

        setFileType(fileExtension === 'pdf' ? 'pdf' : 'image');
        setPreviewFile(fileUrl);
        setPreviewFileName(fileName);
        setIsPreviewModalOpen(true);

    } catch (err) {
        console.error("Error viewing document:", err);
        alert('Failed to load document for preview.');
    }
};

const handleClosePreviewModal = () => {
    if (previewFile) {
        URL.revokeObjectURL(previewFile);
    }
    setIsPreviewModalOpen(false);
    setPreviewFile(null);
    setFileType("");
    setPreviewFileName("");
};
