document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.querySelector('.login-btn');
    const logoutButton = document.querySelector('.logout-btn');
    
    // Check if the user is already logged in
    const token = localStorage.getItem('token');

    // Toggle buttons based on login state
    if (token) {
        // If the user is logged in, show the logout button and hide the login button
        loginButton.style.display = 'none';
        logoutButton.style.display = 'inline-block';
    } else {
        // If the user is not logged in, show the login button and hide the logout button
        loginButton.style.display = 'inline-block';
        logoutButton.style.display = 'none';
    }

    // Add event listener to handle logout
    logoutButton.addEventListener('click', () => {
        // Remove the token from localStorage to log the user out
        localStorage.removeItem('token');
        alert('You have been logged out.');
        
        // Redirect to login page or reload
        window.location.href = '/homepage.html'; // or window.location.reload();
    });
});
// Helper function to check if the email is in a valid format
const isValidEmail = (email) => {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    return emailPattern.test(email);
};

// Helper function to check if the password is strong (at least 6 characters)
const isValidPassword = (password) => {
    return password.length >= 6;
};

// Helper function to check if the phone number is valid (10 digits, integer only)
// Phone number validation function to allow only digits and 10 digits maximum
const validatePhoneNumber = (event) => {
    const phoneInput = event.target;
    let phoneValue = phoneInput.value;

    // Allow only digits
    phoneValue = phoneValue.replace(/[^0-9]/g, '');

    // Set the phone input value to only digits, and limit to 10 digits
    if (phoneValue.length > 10) {
        phoneValue = phoneValue.slice(0, 10); // Limit to 10 digits
    }

    phoneInput.value = phoneValue; // Update the input value
};

const isValidPhone = (phone) => {
    const phonePattern = /^[0-9]{10}$/;
    return phonePattern.test(phone);
};


// Sign-up function
const signup = async () => { 
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const address = document.getElementById('signup-address').value;
    const phone = document.getElementById('signup-phone').value;

    // Validation checks
    if (!name || !email || !password || !address || !phone) {
        alert('Please fill in all required fields');
        return;
    }

    // Email validation
    if (!isValidEmail(email)) {
        alert('Please enter a valid email address');
        return;
    }

    // Password validation
    if (!isValidPassword(password)) {
        alert('Password should be at least 6 characters');
        return;
    }

    // Phone number validation
    if (!isValidPhone(phone)) {
        alert('Phone number should be exactly 10 digits');
        return;
    }

    const userData = {
        name,
        email,
        password,
        address,
        phone
    };

    // Send the data to the server for registration
    try {
        const response = await fetch('http://localhost:5100/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const result = await response.json();
        if (response.ok) {
            alert('Registration successful');
            window.location.href = '/homepage.html'; // Redirect after successful registration
        } else {
            alert(result.message || 'Error during registration');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred during registration');
    }
};


// Sign-in function
const signin = async () => {
    const email = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;

    // Validation checks
    if (!email || !password) {
        alert('Please fill in both email and password');
        return;
    }

    if (!isValidEmail(email)) {
        alert('Please enter a valid email address');
        return;
    }

    if (!isValidPassword(password)) {
        alert('Password must be at least 6 characters');
        return;
    }

    const credentials = { email, password };

    try {
        const response = await fetch('http://localhost:5100/signin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials)
        });

        const result = await response.json();
        if (response.ok) {
            localStorage.setItem('token', result.token); // Store JWT token
            localStorage.setItem('userID', result.userID); // Store userID dynamically
            
            alert('Login successful');
            window.location.href = '/homepage.html'; // Redirect to homepage
        } else {
            alert(result.message || 'Invalid credentials');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred during login');
    }
};

