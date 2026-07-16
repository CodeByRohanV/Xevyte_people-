import { format } from "date-fns";
export const TIMEZONE_IST = 'Asia/Kolkata';

// Helper to ensure date string is treated as IST if missing timezone info
const ensureIST = (dateInput) => {
    if (typeof dateInput === 'string' && dateInput.includes('T') && !dateInput.endsWith('Z') && !dateInput.includes('+')) {
        return dateInput + '+05:30';
    }
    return dateInput;
};

// Get current date string in IST formatted as YYYY-MM-DD
export const getPropperDate = () => {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: TIMEZONE_IST,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(new Date());
};

// Wrapper for new Date() that conceptually represents the current time BUT 
// we can't shift the actual timestamp of the Date object without changing the "time".
// This helper might be less useful than specific formatters.

export const formatDateToIST = (dateInput) => {
    if (!dateInput) return '';

    // Handle array format [yyyy, mm, dd]
    if (Array.isArray(dateInput)) {
        if (dateInput.length >= 3) {
            const [year, month, day] = dateInput;
            return `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
        }
        return '';
    }

    // Handle standard date object or string
    const date = new Date(ensureIST(dateInput));
    if (isNaN(date.getTime())) return '';

    // Returns DD-MM-YYYY in IST
    const options = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: TIMEZONE_IST
    };

    // en-GB format is dd/mm/yyyy
    const parts = new Intl.DateTimeFormat('en-GB', options).formatToParts(date);
    const day = parts.find(p => p.type === 'day')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const year = parts.find(p => p.type === 'year')?.value;

    if (!day || !month || !year) return '';

    return `${day}-${month}-${year}`;
};

export const formatDateTimeToIST = (dateInput) => {
    if (!dateInput) return '';
    const date = new Date(ensureIST(dateInput));
    if (isNaN(date.getTime())) return '';

    const options = {
        timeZone: TIMEZONE_IST,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };

    const parts = new Intl.DateTimeFormat('en-GB', options).formatToParts(date);
    const day = parts.find(p => p.type === 'day').value;
    const month = parts.find(p => p.type === 'month').value;
    const year = parts.find(p => p.type === 'year').value;
    const hour = parts.find(p => p.type === 'hour').value;
    const minute = parts.find(p => p.type === 'minute').value;
    const second = parts.find(p => p.type === 'second').value;

    // dayPeriod might not be present in en-GB (it uses 24h usually, but we asked for hour12: true)
    // Actually en-GB + hour12: true gives "am/pm" in lowercase usually, depending on implementation.
    // Let's stick to en-US for the AM/PM part to be safe or safer en-IN which defaults to 12h for some environments or 24h for others.
    // Let's use simpler logic: get the standard local string but replace slashes.

    // Re-attempt using toLocaleString and string replacement if the format is consistent (dd/mm/yyyy).
    // The user wants dd-mm-yy (or DD-MM-YYYY? prompt said dd-mm-yy but example showed 28-09-2026 which is YYYY).
    // Let's assume DD-MM-YYYY as per the previous method.

    // Better manual construction:
    const d = new Intl.DateTimeFormat('en-GB', { ...options, hour12: true }).formatToParts(date);
    const getPart = (key) => d.find(p => p.type === key)?.value;

    return `${getPart('day')}-${getPart('month')}-${getPart('year')} ${getPart('hour')}:${getPart('minute')}:${getPart('second')} ${getPart('dayPeriod').toUpperCase()}`;
};

/**
 * Returns a new Date object constructed from the ISO string representation of the given date in IST.
 * This effectively "shifts" the date so that getHours() etc return the IST hours in the local timezone context.
 * Useful for DatePickers that expect local dates.
 */
export const getISTAsDateObject = (dateInput = new Date()) => {
    const date = new Date(dateInput);
    const istString = date.toLocaleString('en-US', { timeZone: TIMEZONE_IST });
    return new Date(istString);
};

export const parseISTDateStringToDatePickerValue = (dateString = '') => {
    if (!dateString) return null;
    // dateString is YYYY-MM-DD
    const [y, m, d] = dateString.split('-').map(Number);
    // Create local date for 00:00:00
    return new Date(y, m - 1, d);
};
