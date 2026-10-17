document.getElementById('employeeForm').addEventListener('submit', function(event) {
    // 1. Prevent the page from reloading
    event.preventDefault();

    // 2. Clear all previous errors before checking again
    clearErrors();

    // 3. Get all the input values
    let name = document.getElementById('empName').value.trim();
    let email = document.getElementById('empEmail').value.trim();
    let password = document.getElementById('empPassword').value;
    let phone = document.getElementById('empPhone').value.trim();
    let dept = document.getElementById('empDept').value;

    // A flag to track if everything is correct. We assume it's true until we find a mistake.
    let isValid = true; 

    // 4. Validate Name (Only letters and spaces allowed)
    let nameRule = /^[a-zA-Z\s]+$/;
    if (name === "" || !nameRule.test(name)) {
        document.getElementById('nameError').innerText = "Name must contain only letters and spaces.";
        isValid = false;
    }

    // 5. Validate Email (Simple check for "@" and ".")
    let emailRule = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email === "" || !emailRule.test(email)) {
        document.getElementById('emailError').innerText = "Please enter a valid email address.";
        isValid = false;
    }

    // 6. Validate Password (Must be at least 8 characters)
    if (password.length < 8) {
        document.getElementById('passwordError').innerText = "Password must be at least 8 characters long.";
        isValid = false;
    }

    // 7. Validate Phone Number (Must be exactly 10 digits, no letters)
    let phoneRule = /^[0-9]{10}$/;
    if (!phoneRule.test(phone)) {
        document.getElementById('phoneError').innerText = "Phone number must be exactly 10 digits.";
        isValid = false;
    }

    // 8. Validate Department (Ensure an option is actually picked)
    if (dept === "") {
        document.getElementById('deptError').innerText = "Please select a department.";
        isValid = false;
    }

    // 9. If everything passed (isValid is still true), submit successfully!
    if (isValid === true) {
        // Hide the form
        document.getElementById('employeeForm').classList.add('hidden');
        // Show the success message box
        document.getElementById('successMessage').classList.remove('hidden');
    }
});

// A small helper function that clears out old red error messages
function clearErrors() {
    let errorElements = document.getElementsByClassName('error-msg');
    // Loop through all <small> tags and empty their text
    for (let i = 0; i < errorElements.length; i++) {
        errorElements[i].innerText = '';
    }
}