
const mysql = require('mysql2');
const express = require('express');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcrypt');
const sequelize = require('sequelize');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const app = express();
dotenv.config();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.listen(3000, () => {
  console.log('Server listening on port 3000');
});


app.use(express.json()); // Add this line


//
const cookieParser = require('cookie-parser');

app.use(cookieParser());


// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.json());
 app.use(express.urlencoded({ extended: true }));

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/register.html'));
});



// Connect to the database
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
});






// Create database
db.query('CREATE DATABASE IF NOT EXISTS globalpay', (err, result) => {
  if (err) {
    console.error(err);
  } else {
    console.log('Database created successfully!');
    
    // Connect to the newly created database
    db.changeUser({ database: 'globalpay' }, (err) => {
      if (err) {
        console.error(err);
      } else {
        console.log('Connected to database');
        
        // Create users table
        db.query(`
          CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            cellnumber VARCHAR(20) NOT NULL,
            country VARCHAR(100) NOT NULL,
            password VARCHAR(255) NOT NULL,
            balance DECIMAL(10, 2) DEFAULT 0.00,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `, (err, result) => {
          if (err) {
            console.error('Error creating users table:', err);
          } else {
            console.log('Users table created successfully');
            
            // Create Recipients table
            db.query(`
              CREATE TABLE IF NOT EXISTS Recipients (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                recipient_name VARCHAR(50) NOT NULL,
                recipient_email VARCHAR(100) NOT NULL,
                recipient_phone VARCHAR(20) NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id)
              )
            `, (err, result) => {
              if (err) {
                console.error('Error creating Recipients table:', err);
              } else {
                console.log('Recipients table created successfully');
              }
            });
          }
        });
      }
    });
  }
});





// Serve static files
app.use(express.static('public')); 
app.use(express.static(path.join(__dirname,'public')))


// Parse URL-encoded bodies (as sent by HTML forms)
 app.use(express.urlencoded({ extended: true })); 


// Session middleware
 const expressSession = require('express-session');
 app.use(expressSession({
   secret: 'amanda',
   resave: false,
   saveUninitialized: true,
   cookie: { secure: false }
 }));




// Home page route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});


// Register page route
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'register.html'));
});

// Dashboard page route
app.get('/dashboard', (req, res) => {
  if (!req.session) {
    return res.redirect('/login');
  }
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// User data endpoint
app.get('/user-data', (req, res) => {
  if (!req.session) {
    return res.json({ username: 'Guest' });
  }
  res.json({ username: req.session.name });
});


  // Register endpoint
app.post('/register', async (req, res) => {
  try {
    const { name, email, cellnumber, country, password, confirmpassword } = req.body;

    // Check if passwords match
    if (password !== confirmpassword) {
      res.status(400).json({ message: 'Passwords do not match' });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user data into database
    const query = `INSERT INTO users (name, email, cellnumber, country, password) VALUES (?, ?, ?, ?, ?);`;
    const values = [name, email, cellnumber, country, hashedPassword];

    db.query(query, values, (err, result) => {
      if (err) {
        console.error('Error inserting user data:', err);
        res.status(500).json({ message: 'Error registering user' });
      } else {
        console.log('User data inserted successfully:', result);
       //+ res.redirect('/login'); // Redirect to login page after registration
      }
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
});


// Login page route
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});



// Login endpoint
app.post('/login', (req, res) => {
  console.log(req.body);
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send({ message: 'Email and password required' });
  }

  // Authenticate user
  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send({ message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(401).send({ message: 'Invalid email' });
    }

    const user = results[0];
    req.session.name = user.name; 
    const isValidPassword = bcrypt.compareSync(password, user.password);

    if (!isValidPassword) {
      return res.status(401).send({ message: 'Invalid password' });
    }

  
    req.session.userId = user.id;
   res.redirect('/dashboard.html');
  });
});

app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});





//top-up endpoint

app.post('/top-up', (req, res) => {
  const email = req.session.name + '@gmail.com'; 
  const amount = parseInt(req.body.amount);
  
  if (!email || !amount) {
    return res.json({ success: false, message: 'Invalid request' });
  }
  
  db.query('UPDATE users SET balance = balance + ? WHERE email = ?', [amount, email], (err, results) => {
    if (err) {
      console.error(err);
      res.json({ success: false, message: 'Database error' });
    } else {
      console.log('Balance updated successfully');
      res.json({ success: true });
    }
  });
});



// User data endpoint
app.get('/user-data', (req, res) => {
  const userId = req.session.userId;
  console.log('User ID:', userId);
  
  if (!userId) {
    console.log('No user ID');
    return res.json({ username: 'Guest', balance: 0 });
  }
  
  const query = 'SELECT balance, username FROM users WHERE id = ?';
  console.log('Query:', query);
  
  db.prepare(query).bind(userId).get((err, row) => {
    if (err) {
      console.error('Database error:', err);
      res.json({ username: 'Guest', balance: 0 });
    } else {
      console.log('Database result:', row);
      res.json({ username: row.username, balance: row.balance });
    }
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



app.get('/add_recipient', (req, res) => {
  res.sendFile('C:/Users/ElishaMafararikwa/Downloads/globalpay/public/add_recipient.html');
});


// Insert recipient endpoint
app.post('/add_recipient', (req, res) => {

  console.log('Request Body:', req.body);

  const userId = req.session.userId;

  const { name, email, phone } = req.body;

  // Validate input
  if (!name || !email || !phone) {
    return res.status(400).send('Invalid input');
  }


  
  // Insert query
  const query = 'INSERT INTO Recipients (user_id, recipient_name, recipient_email, recipient_phone) VALUES (?, ?, ?, ?)';
  db.query(query, [userId, name, email, phone], (err, result) => {
    if (err) {
      console.error('Insertion error:', err);
      return res.status(500).send('Insertion failed');
    }

    if (result.affectedRows === 1) {
      console.log('Recipient added successfully');
      return res.send('Recipient added successfully');
    } else {
      console.log('Insertion failed');
      return res.status(500).send('Insertion failed');
    }
  });
});





app.get('/send-money', (req, res) => {
  res.sendFile(path.join(__dirname, 'send-money.html'));
});



app.post('/send-money', (req, res) => {
  const { recipient, amount } = req.body;

  // Simulate successful money transfer
  res.json({ success: true, message: 'Money sent successfully' });

});


