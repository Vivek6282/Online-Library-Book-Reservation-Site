# 🌌 Security and Visual Experience

## Visual Experience: A Symphony of Motion
The AJCE Archive incorporates high-performance visual effects designed to bridge the gap between magic and code:
- **The Aurora Borealis**: A responsive, mathematical simulation generating light ribbons that dance across the background.
- **The Rotating Galaxies**: A dynamic deep space field powered by CSS and HTML5 Canvas that responds to cursor movements.
- **The 3D Archival Cards**: Real-time interactive tilting effects applied to book "Tomes," giving them weight and physical presence.

## 🔐 Security of the High Vault
Security is fundamentally prioritized to protect the archival integrity:
- **Default Master Access**: An administrative '911' account is seeded into the database for the High Curator to access the system and manage books and users, with password verification enabled.
- **Auth Guard**: A robust asynchronous authentication system protected by strong BCrypt hashing (e.g. `auth.php`).
- **Access Roles**: Specific features are locked to the Admin role (such as adding and deleting books or users), while standard scholars browse and reserve texts.
