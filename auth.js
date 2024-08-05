

document.addEventListener('DOMContentLoaded', function() {
    const loginButton = document.getElementById('loginButton');
    
    loginButton.addEventListener('click', function() {
        const provider = new firebase.auth.GoogleAuthProvider();
        firebase.auth().signInWithPopup(provider)
            .then((result) => {
                // This gives you a Google Access Token. You can use it to access the Google API.
                const credential = result.credential;
                const token = credential.accessToken;
                // The signed-in user info.
                const user = result.user;
                console.log('User signed in:', user);
                updateUIAfterLogin(user);
            }).catch((error) => {
                // Handle Errors here.
                const errorCode = error.code;
                const errorMessage = error.message;
                console.error('Error during sign in:', errorCode, errorMessage);
            });
    });

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            updateUIAfterLogin(user);
        } else {
            updateUIAfterLogout();
        }
    });

    function updateUIAfterLogin(user) {
        loginButton.textContent = 'Logout';
        loginButton.onclick = function() {
            firebase.auth().signOut().then(() => {
                console.log('User signed out');
                updateUIAfterLogout();
            }).catch((error) => {
                console.error('Error signing out:', error);
            });
        };
        console.log('Logged in as:', user.displayName);
        // You can add more UI updates here, like showing a welcome message
    }

    function updateUIAfterLogout() {
        loginButton.textContent = 'Login';
        loginButton.onclick = null;  // Remove the logout function
        // Reattach the login event listener
        loginButton.addEventListener('click', function() {
            const provider = new firebase.auth.GoogleAuthProvider();
            firebase.auth().signInWithPopup(provider);
        });
        console.log('User logged out');
        // You can add more UI updates here, like hiding user-specific content
    }
});