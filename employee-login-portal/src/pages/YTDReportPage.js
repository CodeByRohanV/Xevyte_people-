import React from "react";
import Sidebar from "./Sidebar";
import YTDReport from "./YTDReport";
import "./DocumentHub.css";

const YTDReportPage = () => {
    return (
        <Sidebar>
            <div className="document-hub-wrapper">
                <div className="document-hub-content-wrapper">
                    <header className="document-hub-page-header">
                        <h1 className="document-hub-header-title">YTD Reports</h1>
                    </header>
                    <div className="document-hub-card">
                        <YTDReport />
                    </div>
                </div>
            </div>
        </Sidebar>
    );
};

export default YTDReportPage;
