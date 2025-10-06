// DevRev Plug SDK Initialization
// This script initializes the Plug SDK only for authenticated users

(function() {
    'use strict';

    // Check if Plug SDK is already initialized to prevent duplicates
    if (window.plugSDK && window.plugSDK._initialized) {
        console.log('Plug SDK already initialized, skipping...');
        return;
    }

    // Check if user is logged in
    const savedUser = localStorage.getItem('fairbnb_user');
    if (!savedUser) {
        console.log('No user logged in, Plug SDK not initialized');
        return;
    }

    try {
        const user = JSON.parse(savedUser);
        const userEmail = user.email;
        const userName = user.name;
        
        console.log("User Email:", userEmail);
        console.log("User Name:", userName);

        if (!userEmail || !userName) {
            console.warn("Incomplete user info in localStorage, Plug SDK not initialized");
            return;
        }

        // Generate session token and initialize Plug SDK
        fetch("/generate-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: userEmail, display_name: userName }),
            timeout: 10000 // 10 second timeout
        })
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            return res.json();
        })
        .then(data => {
            if (!data.session_token) {
                throw new Error('No session token received from server');
            }
            
            console.log("Session Token received, initializing Plug SDK...");
            const sessionToken = data.session_token;

            // Check again if SDK is already initialized (race condition protection)
            if (window.plugSDK && window.plugSDK._initialized) {
                console.log('Plug SDK already initialized during token fetch, skipping...');
                return;
            }

            // Initialize PLuG SDK with session token
            window.plugSDK.init({
                app_id: 'DvRvStPZG9uOmNvcmU6ZHZydi1pbi0xOmRldm8vMk9KQnRsU3drazpwbHVnX3NldHRpbmcvMV9ffHxfXzIwMjQtMTEtMjIgMDg6MzY6MDkuNzY5ODc2MDA0ICswMDAwIFVUQw==xlxendsDvRv',
                session_token: sessionToken,
                enable_session_recording: true
            });
            
            // Mark as initialized
            window.plugSDK._initialized = true;

            // Wait for SDK to be ready, then log session/tab ID
            window.plugSDK.onEvent(payload => {
                if (payload.type === "ON_OBSERVABILITY_READY") {
                    const { sessionId, tabId } = window.plugSDK.getSessionDetails();
                    console.log("PLuG Session ID:", sessionId);
                    console.log("PLuG Tab ID:", tabId);
                    console.log("Plug SDK successfully initialized for user:", userEmail);
                }
            });

            // Handle other SDK events
            window.plugSDK.onEvent(payload => {
                if (payload.type === "ON_ERROR") {
                    console.error("Plug SDK Error:", payload.error);
                } else if (payload.type === "ON_PLUG_READY") {
                    console.log("Plug SDK is ready and widget should be visible");
                } else if (payload.type === "ON_PLUG_LOADED") {
                    console.log("Plug widget loaded successfully");
                }
            });

        })
        .catch(err => {
            console.error("Error initializing Plug SDK:", err);
        });

    } catch (error) {
        console.error("Error parsing user data from localStorage:", error);
    }

})();
