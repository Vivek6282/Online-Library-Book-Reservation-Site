/**
 * AjaxHandler.js (jQuery Version)
 * ============================================================
 * This is our "AJAX Developer" service. 
 * It handles all the talking between the browser and the server.
 * It uses jQuery (the $ sign) to send and receive information.
 * ============================================================
 */

const AjaxHandler = {
    /**
     * This function sends data to a PHP file using jQuery.
     * @param {string} url - The address of the PHP file (e.g., 'php/auth.php').
     * @param {object} data - The info you want to send.
     * @returns {Promise<object>} - The answer from the server.
     */
    post(url, data) {
        // Return a "Promise" (a promise to give an answer later).
        return new Promise((resolve) => {
            // Use jQuery's AJAX tool to send the info.
            $.ajax({
                url: url,           // Where to send it.
                method: 'POST',     // How to send it (POST is safer).
                data: data,         // The information package.
                dataType: 'json',   // We expect the answer to be in JSON format.
                success: (response) => {
                    // If the server answers correctly, give back the answer.
                    resolve(response);
                },
                error: (xhr, status, error) => {
                    // If something breaks (like no internet), show an error.
                    console.error("AJAX Error:", status, error);
                    resolve({ 
                        success: false, 
                        message: "The Archive could not be reached. Please check your connection." 
                    });
                }
            });
        });
    },

    /**
     * This function asks for info (like a list of books) using jQuery.
     * @param {string} url - The address to ask.
     * @returns {Promise<object>} - The info received.
     */
    get(url) {
        return new Promise((resolve) => {
            $.ajax({
                url: url,
                method: 'GET',
                dataType: 'json',
                success: (response) => resolve(response),
                error: () => resolve({ success: false, message: "Failed to load database info." })
            });
        });
    }
};

// Export it so other files can use it.
window.AjaxHandler = AjaxHandler;

