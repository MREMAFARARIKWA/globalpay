

// Register form submission handler


const registerForm = document.getElementById('register-form');

registerForm.addEventListener('submit', (e) => {
  e.preventDefault();

   // Collect user data from form fields

  const userData = {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    cellnumber: document.getElementById('cellnumber').value,
    country: document.getElementById('country').value,
    password: document.getElementById('password').value,
    confirmpassword: document.getElementById('confirmpassword').value,
  };

      // Send POST request to register endpoint

  fetch('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.message === 'User registered successfully') {
        window.location.href = '/dashboard';
      } else {
        console.error(data.message);
      }
    })
    .catch((error) => console.error(error));
});





// Login form submission handler


const loginForm = document.getElementById('login-form');
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault(); // Prevent default form submission

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  // Basic validation
  if (!email || !password) {
    alert('Please enter both email and password');
    return;
  }

  // Send POST request to server
  try {
    const response = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.success) {
      // Login successful, redirect to dashboard
      window.location.href = '/dashboard.html';
    } else {
      // Handle error messages
      alert(data.message);
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('Login failed. Please try again.');
  }
});



document.addEventListener('DOMContentLoaded', () => {
  fetch('/user-data')
    .then(response => response.json())
    .then(data => {
      console.log('Received user data:', data);
      document.getElementById('welcome-message').innerText = `Welcome, ${data.username}!`;
      document.getElementById('balance-value').innerText = data.balance.toFixed(2);
    })
    .catch(error => console.error(error));
});






// Fetch user data on page load

document.getElementById('top-up-btn').addEventListener('click', (event) => {
  event.preventDefault();
  console.log('Top-up form submitted');

  const amount = document.getElementById('amount').value;

  console.log('Sending request to /top_up.html with amount:', amount);

  fetch('/top_up.html', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ amount })
  })
  // ...
});








  document.addEventListener('DOMContentLoaded', () => {
    fetch('/user-data')
      .then(response => response.json())
      .then(data => {
        const welcomeMessage = document.getElementById('welcome-message');
        const balanceValue = document.getElementById('balance-value');
        
        if (data.username) {
          welcomeMessage.innerText = `Welcome, ${data.username}!`;
          balanceValue.textContent = `$${data.balance.toFixed(2)}`;
        } else {
          welcomeMessage.innerText = 'Welcome, Guest!';
          balanceValue.textContent = '$0.00';
        }
      })
      .catch(error => console.error(error));
  });
  









// Top-up endpoint
app.post('/top_up', (req, res) => {
  const { amount } = req.body;
  const userId = req.session.userId;

  if (!userId) {
    return res.status(400).send({ message: 'User not logged in' });
  }

  if (!amount || isNaN(amount)) {
    return res.status(400).send({ message: 'Invalid amount' });
  }

  // Update user balance in database
  const query = 'UPDATE users SET balance = balance + ? WHERE id = ?';
  db.query(query, [amount, userId], (err, results) => {
    if (err) {
      console.error('Error updating balance:', err);
      return res.status(500).send({ message: 'Error updating balance' });
    }

    // Retrieve updated balance
    const balanceQuery = 'SELECT balance FROM users WHERE id = ?';
    db.query(balanceQuery, [userId], (err, results) => {
      if (err) {
        console.error('Error retrieving balance:', err);
        return res.status(500).send({ message: 'Error retrieving balance' });
      }

      const updatedBalance = results[0].balance;
      res.send({ success: true, balance: updatedBalance });
    });
  });
});

// API endpoint to retrieve balance
app.get('/api/get-balance', (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    return res.status(400).send({ message: 'User not logged in' });
  }

  const query = 'SELECT balance FROM users WHERE id = ?';
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error retrieving balance:', err);
      return res.status(500).send({ message: 'Error retrieving balance' });
    }

    const balance = results[0].balance;
    res.json({ balance });
  });
});




const sendMoneyForm = document.getElementById('send-money-form');
const recipientSelect = document.getElementById('recipient-select');
const amountInput = document.getElementById('amount-input');
const availableBalanceSpan = document.getElementById('available-balance');
const statusMessage = document.getElementById('status-message'); // Add this element

sendMoneyForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const recipientId = recipientSelect.value;
    const amount = amountInput.valueAsNumber;
    const userId = sessionStorage.getItem('userId');

    if (amount <= 0 || amount > parseFloat(availableBalanceSpan.textContent)) {
        statusMessage.textContent = 'Invalid amount';
        return;
    }

    try {
        const response = await fetch('/send-money', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipientId, amount, userId }),
        });

        const data = await response.json();

        if (data.success) {
            statusMessage.textContent = 'Money sent successfully';
            location.reload();
        } else {
            statusMessage.textContent = data.message;
        }
    } catch (error) {
        statusMessage.textContent = 'Error sending money';
        console.error(error);
    }
});












