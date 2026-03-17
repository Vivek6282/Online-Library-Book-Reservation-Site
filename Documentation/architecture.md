# 🏛️ Architectural Overview

## Javascript Architecture
The AJCE Archive utilizes a centralized and modern JavaScript approach to ensure maximum reliability and maintainability.

### 1. API Communication
The system primarily utilizes the modern `fetch` API for asynchronous conversations and data exchanges with the PHP backend infrastructure (e.g., `login.js` and `admin.js`). An `AjaxHandler` utility also exists using jQuery's `$.ajax` as a fallback or alternative for certain requests.

### 2. DOM Manipulation & UI
Instead of a dedicated DOM controller service, the UI orchestration is handled directly within the respective page scripts (`login.js`, `admin.js`, etc.). This includes seamlessly integrating visual elements such as background effects and feedback messages to provide a fluid user experience.

### 3. Client-Side Validation
Validation operates directly within the form submission event handlers. It enforces required fields and ensures valid data is present before sending requests to the server, bypassing the need for an external strict "Guardian" service.
