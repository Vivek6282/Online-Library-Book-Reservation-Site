
/**
 * DomController.js (jQuery Version)
 * ============================================================
 * This script is the "Visual Manager".
 * It uses jQuery to control the screen and make things move.
 * ============================================================
 */

const DomController = {
    /**
     * Shows a message on the screen (like "Success" or "Error").
     * @param {string} selector - The ID or Class of the message box.
     * @param {string} text - What the message should say.
     * @param {string} type - 'success' or 'danger' (green or red).
     */
    showMessage(selector, text, type = 'danger') {
        const $el = $(selector); // Use jQuery to find the box.
        if (!$el.length) return;

        $el.text(text) // Set the message text.
           .removeClass('alert-success alert-danger alert-info') // Clear old colors.
           .addClass(`alert alert-${type} mt-3 animate__animated animate__fadeIn`) // Add new style.
           .show(); // Make it visible.
    },

    /**
     * Makes a box shake when there is an error.
     * @param {string} selector - The ID or Class of the box to shake.
     */
    shake(selector) {
        const $el = $(selector);
        if (!$el.length) return;

        // Add the shaking animation.
        $el.addClass('shake-vibrate');
        // Stop shaking after half a second.
        setTimeout(() => $el.removeClass('shake-vibrate'), 500);
    },

    /**
     * Shows a loading spinner inside a button using jQuery.
     * @param {string} selector - The ID or Class of the button.
     * @param {boolean} show - True to show spinner, False to hide.
     */
    setLoading(selector, show) {
        const $btn = $(selector);
        if (!$btn.length) return;

        const $spinner = $btn.find('.btn-spinner, .spinner-border');
        
        if (show) {
            $btn.prop('disabled', true); // Stop user from clicking again.
            $spinner.removeClass('d-none').show(); // Show the spinning circle.
        } else {
            $btn.prop('disabled', false); // Let user click again.
            $spinner.addClass('d-none').hide(); // Hide the spinning circle.
        }
    }
};

// Export it for other files.
window.DomController = DomController;
