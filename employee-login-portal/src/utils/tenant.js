/**
 * Utility to extract tenant subdomain from the current hostname.
 * Supports:
 * - <tenant>.hrms.scaloz.com -> <tenant>
 * - <tenant>.localhost:3000 -> <tenant>
 */
export const getTenantSubdomain = () => {
    const hostname = window.location.hostname;
    
    // Handle localhost development
    if (hostname.endsWith(".localhost") || hostname === "localhost") {
        if (hostname === "localhost") return null;
        const parts = hostname.split('.');
        // Extract first part
        return parts[0];
    }

    // Handle production base domain (scaloz.com)
    // We look for the part before hrms.scaloz.com or hrmstest.scaloz.com
    const parts = hostname.split('.');
    const scalozIndex = parts.indexOf('scaloz');
    
    if (scalozIndex > 0) {
        // The part immediately before 'scaloz' might be 'hrms', 'hrmstest', or the tenant
        const prevPart = parts[scalozIndex - 1];
        if (prevPart === 'hrms' || prevPart === 'hrmstest') {
            // If there's a part before 'hrms'/'hrmstest', that's the tenant (e.g. tcs.hrmstest.scaloz.com)
            if (scalozIndex > 1) {
                return parts[scalozIndex - 2];
            }
            return null; // Just hrms.scaloz.com
        } else {
            // If the part before 'scaloz' is not hrms/hrmstest, it's the tenant (e.g. xevyte.scaloz.com)
            return prevPart;
        }
    }


    return null;
};
