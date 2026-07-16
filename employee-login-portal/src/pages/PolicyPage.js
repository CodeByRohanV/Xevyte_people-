import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import "./PolicyPage.css";
import scalozLogo from "../assets/Scaloz.png";

const PolicyPage = () => {
    const { policyKey } = useParams();
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState("");
    const navigate = useNavigate();

    const policies = {
        terms_and_conditions: {
            title: "Terms & Conditions",
            content: `Terms & Conditions – Xevyte Technologies HRMS\n\nWelcome to Xevyte Technologies. By accessing or using the Xevyte HRMS platform, website, or related services, you agree to comply with and be bound by the following Terms & Conditions. Please read them carefully before using the platform.\n\n1. Acceptance of Terms\n\nBy accessing or using the Xevyte HRMS application, you acknowledge and agree to these Terms & Conditions and all applicable laws and regulations. If you are using the platform on behalf of an organization, you represent that you are authorized to bind the organization to these terms.\n\n2. Eligibility\n\nYou must be at least 18 years old or legally authorized by your organization to access and use the Xevyte HRMS platform. Users under the age of 18 may only use the platform under appropriate supervision and authorization.\n\n3. Use of the HRMS Platform\n\nYou agree to use the Xevyte HRMS platform responsibly, securely, and in compliance with all applicable laws.\n\nProhibited activities include, but are not limited to:\n\nUnauthorized access to systems, accounts, or organizational data.\nAttempting to disrupt, damage, or interfere with platform functionality.\nUploading or transmitting malicious software, viruses, or harmful code.\nMisusing employee, payroll, attendance, or confidential organizational data.\nCopying, scraping, or reproducing platform content or software without written permission.\nUsing the platform for unlawful, fraudulent, or unauthorized purposes.\n\n4. Intellectual Property\n\nAll software, content, branding, trademarks, logos, designs, and intellectual property associated with the Xevyte HRMS platform are owned by Xevyte Technologies or its licensors. No content may be copied, modified, distributed, or reproduced without prior written consent.\n\n5. User-Generated Content\n\nAny feedback, suggestions, comments, or other content submitted to Xevyte Technologies may be used for improving products and services. By submitting such content, you grant Xevyte a non-exclusive, royalty-free, perpetual right to use, reproduce, and modify the content for business purposes.\n\n6. Privacy and Data Protection\n\nYour use of the Xevyte HRMS platform is also governed by our Privacy Policy and Cookie Policy. Xevyte Technologies takes reasonable measures to protect organizational and employee data handled through the platform.\n\n7. Third-Party Services\n\nThe HRMS platform may integrate with or provide access to third-party services, applications, or websites. Xevyte Technologies is not responsible for the availability, security, content, or practices of such third-party services.\n\n8. Disclaimer of Warranties\n\nThe Xevyte HRMS platform and all associated services are provided on an “as is” and “as available” basis without warranties of any kind, either express or implied. Xevyte Technologies disclaims all warranties, including merchantability, fitness for a particular purpose, and non-infringement.\n\n9. Limitation of Liability\n\nTo the maximum extent permitted by applicable law, Xevyte Technologies shall not be liable for any direct, indirect, incidental, special, or consequential damages arising from the use of or inability to use the HRMS platform or related services.\n\n10. Indemnification\n\nYou agree to indemnify and hold harmless Xevyte Technologies, its employees, partners, and affiliates from any claims, liabilities, damages, or expenses arising from your misuse of the platform or violation of these Terms & Conditions.\n\n11. Platform Availability\n\nXevyte Technologies strives to maintain continuous platform availability but does not guarantee uninterrupted or error-free access. Scheduled maintenance, updates, technical issues, or external factors may temporarily affect availability.\n\n12. Suspension or Termination of Access\n\nXevyte Technologies reserves the right to suspend, restrict, or terminate access to the HRMS platform at its sole discretion if a user violates these Terms & Conditions or engages in activities that may harm the platform, organization, or other users.\n\n13. Modifications to Terms\n\nXevyte Technologies may revise or update these Terms & Conditions from time to time. Updated versions will become effective upon publication within the platform or website. Continued use of the platform after changes constitutes acceptance of the revised terms.\n\n14. Governing Law and Jurisdiction\n\nThese Terms & Conditions shall be governed by and interpreted in accordance with the laws of India. Any disputes arising out of or relating to these terms shall fall under the exclusive jurisdiction of the courts located in Bangalore, Karnataka.\n\nIf any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.\n\n15. Contact Information\n\nFor any questions, concerns, or support related to these Terms & Conditions, please contact:\n\nXevyte Technologies\nEmail: info@xevyte.com\n\nWebsite: www.xevyte.com`
        },
        privacy_policy: {
            title: "Privacy Policy",
            content: `Privacy Policy – Xevyte Technologies HRMS\n\nAt Xevyte Technologies, protecting the privacy and security of organizational and employee data is a top priority. This Privacy Policy explains how Xevyte Technologies collects, uses, stores, shares, and protects information within the Xevyte HRMS platform and related services.\n\n1. Information We Collect\n\nWe may collect the following categories of information through the Xevyte HRMS platform:\n\nPersonal Information\nEmployee name and contact details\nEmail address and phone number\nJob title, department, employee ID, and organizational details\nPayroll, attendance, leave, and HR-related information\nInformation submitted through forms, support requests, or onboarding processes\nTechnical Information\nIP address\nBrowser type and version\nDevice information and operating system\nLogin activity and access timestamps\nUsage and Behavioral Data\nPages accessed within the HRMS platform\nUser interactions and feature usage\nSession duration and navigation activity\nCookies and Tracking Technologies\n\nWe may use cookies and similar technologies to improve platform functionality, maintain secure sessions, remember user preferences, and analyze performance.\n\n2. How We Use Your Information\n\nXevyte Technologies uses collected information to:\n\nProvide, operate, and maintain HRMS services\nManage employee and organizational workflows\nEnable secure login, authentication, and access control\nImprove platform performance and user experience\nRespond to support requests and technical issues\nSend important system notifications or service updates\nAnalyze usage patterns to improve functionality\nDetect and prevent security threats, fraud, or unauthorized access\nComply with legal obligations and enforce platform policies\n\n3. How We Share Your Information\n\nXevyte Technologies does not sell personal or organizational data. Information may be shared only in the following circumstances:\n\nService Providers\n\nTrusted third-party vendors who support hosting, analytics, cloud infrastructure, communication services, or technical operations under strict confidentiality obligations.\n\nLegal and Regulatory Requirements\n\nWhen required to comply with applicable laws, regulations, court orders, legal proceedings, or governmental requests.\n\nOrganizational Access\n\nAuthorized administrators within your organization may access employee-related data based on role-based permissions and organizational policies.\n\n4. Data Retention\n\nWe retain personal and organizational data only for as long as necessary to provide HRMS services, fulfill contractual obligations, comply with legal requirements, or resolve disputes.\n\n5. Data Security\n\nXevyte Technologies implements appropriate technical and organizational safeguards to protect data, including:\n\nSecure servers and infrastructure\nData encryption where applicable\nRole-based access controls\nAuthentication and session security\nContinuous monitoring and security practices\n\nWhile we strive to protect all information, no digital system can guarantee absolute security.\n\n6. Your Rights\n\nDepending on applicable laws and organizational policies, users may have the right to:\n\nAccess and review personal data\nRequest corrections or updates to inaccurate information\nRequest deletion of personal data where permitted\nWithdraw consent for certain data processing activities\nRestrict or object to specific processing activities\nSubmit complaints to applicable data protection authorities\n\n7. Cookies and Tracking Technologies\n\nUsers may choose to manage or disable cookies through browser settings. However, disabling cookies may affect certain HRMS functionalities, authentication features, or platform performance.\n\nFor additional details, please refer to our Cookie Policy.\n\n8. Third-Party Services and Links\n\nThe Xevyte HRMS platform may integrate with third-party tools or services. Xevyte Technologies is not responsible for the privacy practices, content, or policies of external platforms. Users are encouraged to review the privacy policies of such third parties.\n\n9. Children’s Privacy\n\nThe Xevyte HRMS platform is not intended for children under the age of 13, and we do not knowingly collect personal information from minors.\n\n10. Changes to This Privacy Policy\n\nXevyte Technologies may update this Privacy Policy periodically to reflect changes in legal requirements, security practices, or platform functionality. Updated versions will be published within the platform or website along with the revised effective date.\n\n11. Contact Us\n\nIf you have questions, concerns, or requests related to this Privacy Policy or data protection practices, please contact:\n\nXevyte Technologies\nEmail: info@xevyte.com\n\nWebsite: www.xevyte.com`
        },
        cookies_policy: {
            title: "Cookie Policy",
            content: `Cookie Policy – Xevyte Technologies HRMS\n\nThis Cookie Policy explains how Xevyte Technologies uses cookies and similar technologies within the Xevyte HRMS application to enhance user experience, improve platform performance, and maintain security.\n\n1. What Are Cookies?\n\nCookies are small text files stored on your device when you access or use the Xevyte HRMS platform. These cookies help the application recognize users, remember preferences, and ensure secure access to HRMS services.\n\n2. Types of Cookies We Use\n\nEssential Cookies\nThese cookies are necessary for the core functionality of the HRMS application, including secure login, session management, authentication, and access control.\n\nAnalytical Cookies\nUsed to collect information about how users interact with the HRMS platform, helping us analyze performance, usage trends, and improve overall usability.\n\nFunctional Cookies\nEnable enhanced features such as remembering user preferences, dashboard settings, language preferences, and personalized HRMS experiences.\n\nPerformance Cookies\nHelp monitor application responsiveness, loading times, and system stability to ensure smooth platform performance.\n\nSecurity Cookies\nUsed to detect suspicious activity, prevent unauthorized access, and maintain the security of employee and organizational data.\n\n3. Why We Use Cookies\n\nXevyte Technologies uses cookies in the HRMS application to:\n\nProvide secure user authentication and session management.\nEnhance user experience across devices and browsers.\nRemember user and organizational preferences.\nAnalyze platform usage and improve HRMS functionality.\nMonitor system performance and reliability.\nStrengthen platform security and prevent fraudulent activities.\n\n4. Managing Cookies\n\nUsers can manage or disable cookies through their browser settings. However, disabling certain cookies may impact the functionality, security, or accessibility of some HRMS features.\n\n5. Third-Party Cookies\n\nThe Xevyte HRMS platform may use trusted third-party services such as analytics, monitoring, or authentication providers. These services may place their own cookies to support application functionality and performance. Users are encouraged to review the respective privacy and cookie policies of such third-party providers.\n\n6. Consent for Cookies\n\nBy accessing or using the Xevyte HRMS application, users consent to the use of cookies as described in this Cookie Policy. Users may withdraw consent at any time by updating browser settings or clearing stored cookies.\n\n7. Updates to This Policy\n\nXevyte Technologies may update this Cookie Policy periodically to reflect changes in technology, legal requirements, or platform practices. Updated versions will be published within the HRMS application along with the revised effective date.\n\n8. Contact Us\n\nIf you have any questions regarding this Cookie Policy or the use of cookies within the Xevyte HRMS platform, please contact:\n\nXevyte Technologies\nEmail: info@xevyte.com\n\nWebsite: www.xevyte.com`
        }
    };

    useEffect(() => {
        setLoading(true);
        const policy = policies[policyKey];
        if (policy) {
            setTitle(policy.title);
            setContent(policy.content);
        } else {
            setTitle("Policy Not Found");
            setContent("The requested policy page could not be found.");
        }
        setLoading(false);
    }, [policyKey]);

    const renderContent = (text) => {
        const lines = text.split('\n');
        let firstLineFound = false;
        let isFirstParagraph = true;
        let headingIndex = 0;

        // Helper to identify headings
        const isHeading = (str) => /^\d+\./.test(str.trim());

        return lines.map((line, i) => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return <div key={i} className="policy-spacer" />;

            // Subtitle (First line of the text)
            if (!firstLineFound) {
                firstLineFound = true;
                return null; // We skip the subtitle because we have the main title above
            }

            // Main Heading (e.g. 1. Acceptance of Terms)
            if (isHeading(trimmedLine)) {
                isFirstParagraph = false;
                const currentId = `section-${headingIndex}`;
                headingIndex++;
                return (
                    <div key={i} className="policy-section" id={currentId}>
                        <h2 className="policy-section-title">{trimmedLine}</h2>
                    </div>
                );
            }

            // List Items
            if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('→')) {
                return (
                    <li key={i} className="policy-list-item">
                        {trimmedLine.replace(/^[•-→]\s*/, '')}
                    </li>
                );
            }

            // Welcome Text (First paragraph before any headings)
            if (isFirstParagraph) {
                return <p key={i} className="policy-welcome-text">{trimmedLine}</p>;
            }

            // Standard Text
            return <p key={i} className="policy-text">{trimmedLine}</p>;
        });
    };

    const getTOC = (text) => {
        const lines = text.split('\n');
        return lines
            .filter(line => /^\d+\./.test(line.trim()))
            .map((line, index) => (
                <a key={index} href={`#section-${index}`} className="toc-link">
                    {line.trim()}
                </a>
            ));
    };

    return (
        <div className="policy-page">
            <header className="policy-header">
                <div className="header-inner">
                    <img
                        src={scalozLogo}
                        alt="Scaloz Logo"
                        onClick={() => navigate("/")}
                        className="header-logo"
                    />
                </div>
            </header>

            <main className="policy-container">
                {/* Left Sidebar for Enterprise Look */}
                <aside className="policy-sidebar">
                    <div className="sidebar-sticky">
                        <h3>On this page</h3>
                        <div className="toc-list">
                            {getTOC(content)}
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <div className="policy-main-content">
                    <div className="policy-header-info">
                        <h1 className="policy-main-title">{title}</h1>
                        <p className="last-updated">Last updated: May 14, 2026</p>
                    </div>

                    {loading ? (
                        <div className="policy-loading">
                            <div className="spinner"></div>
                        </div>
                    ) : (
                        <div className="policy-body-content">
                            {renderContent(content)}
                        </div>
                    )}
                </div>
            </main>

            <footer className="policy-footer">
                <div className="footer-inner">
                    <p>&copy; {new Date().getFullYear()} Xevyte Technologies. All rights reserved.</p>
                    <div className="footer-bottom-links">
                        <a href="/policy/terms_and_conditions">Terms</a>
                        <a href="/policy/privacy_policy">Privacy</a>
                        <a href="/policy/cookies_policy">Cookies</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PolicyPage;
