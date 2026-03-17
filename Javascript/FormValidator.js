/**
 * FormValidator.js
 * ============================================================
 * This script is the "Checker". 
 * It makes sure the user typed the right things.
 * ============================================================
 */

const FormValidator = {
    /**
     * This function checks if a box is empty.
     * @param {string} value - What the user typed.
     * @returns {boolean} - True if there is text, False if empty.
     */
    isNotEmpty(value) {
        // Trimming removes empty spaces at the beginning and end.
        return value && value.trim().length > 0;
    },

    /**
     * This function checks if a Scholar ID (Member ID) is okay.
     * It must be at least 3 characters long.
     */
    isValidScholarId(id) {
        return id && id.trim().length >= 3;
    },

    /**
     * This function checks if a password is long enough (at least 6).
     */
    isSecurePassword(password) {
        return password && password.length >= 6;
    },

    /**
     * This function checks if two passwords are the same.
     */
    doPasswordsMatch(p1, p2) {
        return p1 === p2;
    }
};

// Export it for other files.
window.FormValidator = FormValidator;
