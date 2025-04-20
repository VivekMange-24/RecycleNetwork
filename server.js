const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const path = require("path");
const Razorpay = require("razorpay");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ MongoDB Connection String
const MONGO_URI = "mongodb://127.0.0.1:27017/registrationDB1";
const JWT_SECRET = "your_secret_key"; // Change this to an environment variable in production
// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: "rzp_test_jS4eq5qylvdyCm", // Use environment variables for security
  key_secret: "gIHGRgaHhN8xKDuCJgOfLroi",
});

// ✅ Serve static files (for avatars & frontend files)
app.use(express.static("allfiles"));

// ✅ Connect to MongoDB
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));


  const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, default: "/avatar/user.webp" },
    cart: [
      {
        title: String,
        price: Number,
        quantity: Number,
      }
    ],
    buycart: [
      {
        title: String,
        price: Number,
        quantity: Number,
      }
    ],
    orderaddress: [
      {
        label: { type: String, required: true },
        address1: { type: String, required: true },
        address2: { type: String },
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zip: { type: Number, required: true },
        country: { type: String, required: true },
      }
    ]
  });
  
const User = mongoose.model("User", userSchema);


const cartSchema = new mongoose.Schema({
  userID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
      itemID: { type: String, required: true },
      title: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true }
  }]
});

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;

// ✅ Middleware: Verify JWT Token
const authenticateUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.userId);
    if (!req.user) return res.status(404).json({ message: "User not found" });
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
};

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
      user: "recyclenetwork0@gmail.com",  // Store email in environment variables
      pass: "ttpf jdms qgjh gpta"   // Store password in environment variables
  }
});

// ✅ API Route: User Signup
app.post("/signup", async (req, res) => {
  const { name, email, password, address } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword, address });

    await newUser.save();

    // Email Content
    const mailOptions = {
      from: '"Recycle Network Team" <recyclenetwork@gmail.com>',
      to: email,
      subject: "Welcome to Recycle Network! ♻️",
      html: `
        <h2>Hey ${name}, welcome aboard! 🌍</h2>
        <p>You've just taken a step towards a greener planet! We're super excited to have you as part of our recycling community. 🌱</p>
        <p>With Recycle Network, you can turn waste into rewards, your recycling goals, and make a real difference.</p>
        <p>Login now and start recycling
        <br>
        <p>Stay green, stay awesome! ✨</p>
        <p><strong>- The Recycle Network Team</strong></p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({ message: "User registered successfully. Check your email!" });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Error registering user", error: error.message });
  }
});

// ✅ API Route: User Signin
app.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" });

    res.status(200).json({ message: "Login successful", token, user });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
});

// ✅ API Route: Get User Profile
app.get("/profile", authenticateUser, async (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  res.json({
    name: req.user.name,
    email: req.user.email,
    address: req.user.address || "Not provided",
    selectedAvatar: `${baseUrl}${req.user.avatar}`, // ✅ Return full avatar URL
  });
});

// ✅ API Route: Save Selected Avatar
app.post("/save-avatar", authenticateUser, async (req, res) => {
  const { avatar } = req.body;
  if (!avatar) return res.status(400).json({ message: "Avatar is required" });

  try {
    await User.findByIdAndUpdate(req.user._id, { avatar });
    res.json({ message: "✅ Avatar updated successfully", selectedAvatar: avatar });
  } catch (error) {
    res.status(500).json({ message: "❌ Error updating avatar", error });
  }
});


// ✅ API Route: Save Selected Avatar
app.post("/save-avatar", authenticateUser, async (req, res) => {
  const { avatar } = req.body;
  if (!avatar) return res.status(400).json({ message: "Avatar is required" });

  try {
    await User.findByIdAndUpdate(req.user._id, { avatar });
    res.json({ message: "✅ Avatar updated successfully", selectedAvatar: avatar });
  } catch (error) {
    res.status(500).json({ message: "❌ Error updating avatar", error });
  }
});


// ✅ **Add item to cart**
app.post("/add-to-cart", authenticateUser, async (req, res) => {
  const { title, price, quantity } = req.body;
  if (!title || !price || !quantity) return res.status(400).json({ error: "Missing item data" });

  const user = req.user;
  const existingItem = user.cart.find(item => item.title === title);

  if (existingItem) {
      existingItem.quantity += quantity;
  } else {
      user.cart.push({ title, price, quantity });
  }

  await user.save();
  res.json({ message: "Item added to cart", cart: user.cart });
});

// ✅ **Fetch user's cart**
app.get("/cart", authenticateUser, async (req, res) => {
  res.json({ items: req.user.cart });
});

// ✅ **Remove item from cart**
app.delete("/remove-from-cart", authenticateUser, async (req, res) => {
  const { itemID } = req.body;
  req.user.cart = req.user.cart.filter(item => item._id.toString() !== itemID);
  await req.user.save();
  res.json({ message: "Item removed", cart: req.user.cart });
});

//buyer cart
// ✅ **Add item to buycart**
app.post("/add-to-buycart", authenticateUser, async (req, res) => {
  const { title, price, quantity } = req.body;
  if (!title || !price || !quantity) return res.status(400).json({ error: "Missing item data" });

  const user = req.user;
  const existingItem = user.buycart.find(item => item.title === title);

  if (existingItem) {
      existingItem.quantity += quantity;
  } else {
      user.buycart.push({ title, price, quantity });
  }

  await user.save();
  res.json({ message: "Item added to buycart", buycart: user.buycart });
});

// ✅ **Fetch user's buycart**
app.get("/buycart", authenticateUser, async (req, res) => {
  res.json({ items: req.user.buycart });
});

// ✅ **Remove item from buycart**
app.delete("/remove-from-buycart", authenticateUser, async (req, res) => {
  const { itemID } = req.body;
  req.user.buycart = req.user.buycart.filter(item => item._id.toString() !== itemID);
  await req.user.save();
  res.json({ message: "Item removed from buycart", buycart: req.user.buycart });
});

// Add a new address
app.post("/add-orderaddress", authenticateUser, async (req, res) => {
  const { label, address1, address2, street, city, state, zip, country } = req.body;

  if (!label || !address1 || !street || !city || !state || !zip || !country) {
    return res.status(400).json({ error: "Missing address fields" });
  }

  try {
    const newOrderAddress = { label, address1, address2, street, city, state, zip, country };
    req.user.orderaddress.push(newOrderAddress);
    await req.user.save();
    res.json({ message: "Order address added successfully", orderaddress: req.user.orderaddress });
  } catch (error) {
    res.status(500).json({ message: "Error adding address", error: error.message });
  }
});

// Edit an address
app.put("/edit-orderaddress/:orderaddressId", authenticateUser, async (req, res) => {
  const { orderaddressId } = req.params;
  const { label, address1, address2, street, city, state, zip, country } = req.body;

  try {
    const address = req.user.orderaddress.id(orderaddressId);
    if (!address) return res.status(404).json({ message: "Address not found" });

    Object.assign(address, { label, address1, address2, street, city, state, zip, country });
    await req.user.save();
    res.json({ message: "Address updated successfully", orderaddress: req.user.orderaddress });
  } catch (error) {
    res.status(500).json({ message: "Error editing address", error: error.message });
  }
});

// Get all user addresses
app.get("/orderaddresses", authenticateUser, async (req, res) => {
  try {
    res.json({ orderaddresses: req.user.orderaddress });
  } catch (error) {
    res.status(500).json({ message: "Error fetching addresses", error: error.message });
  }
});

// Delete an address
app.delete("/delete-orderaddress/:orderaddressId", authenticateUser, async (req, res) => {
  const { orderaddressId } = req.params;
  try {
    req.user.orderaddress = req.user.orderaddress.filter(addr => addr._id.toString() !== orderaddressId);
    if (req.user.selectedAddress === orderaddressId) {
      req.user.selectedAddress = null;
    }
    await req.user.save();
    res.json({ message: "Address deleted successfully", orderaddress: req.user.orderaddress });
  } catch (error) {
    res.status(500).json({ message: "Error deleting address", error: error.message });
  }
});

// Save selected address
app.post("/save-selected-address/:userId", async (req, res) => {
  const { userId } = req.params;
  const { selectedAddress } = req.body;

  try {
    await User.findByIdAndUpdate(userId, { selectedAddress });
    res.json({ message: "Selected address saved successfully." });
  } catch (error) {
    res.status(500).json({ message: "Error saving selected address." });
  }
});

// Get selected address
app.get("/get-selected-address/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);
    res.json({ selectedAddress: user.selectedAddress || null });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving selected address." });
  }
});


// Save confirmed cart and address
app.post("/confirm-order", authenticateUser, async (req, res) => {
  try {
      const userId = req.user.id;
      const { items, selectedAddress } = req.body;

      if (!items || items.length === 0 || !selectedAddress) {
          return res.status(400).json({ message: "Cart items and address are required." });
      }

      // Here you can integrate with an existing order system or database

      res.status(200).json({ message: "Order confirmed successfully!" });
  } catch (error) {
      res.status(500).json({ message: "Error confirming order", error: error.message });
  }
});

// Fetch confirmed order for checkout
app.get("/checkout-details", authenticateUser, async (req, res) => {
  try {
      const userId = req.user.id;
      // Fetch order details from an existing order system or database

      res.status(200).json({ message: "Order details fetched successfully!" });
  } catch (error) {
      res.status(500).json({ message: "Error fetching order details", error: error.message });
  }
});

//feedback
// Feedback Schema
const feedbackSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { 
      type: String, 
      required: true, 
      trim: true, 
      match: [/.+\@.+\..+/, 'Please enter a valid email'] 
  },
  feedback: { type: Number, required: true, min: 0, max: 4 },
  message: { type: String, required: true, trim: true },
  submittedAt: { type: Date, default: Date.now }
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

// Nodemailer Transporter


// API to handle form submission
app.post('/submit-feedback', async (req, res) => {
  try {
      const { name, email, feedback, message } = req.body;

      const newFeedback = new Feedback({
          name,
          email,
          feedback,
          message
      });

      await newFeedback.save();

      // Admin Notification Email
      const adminMailOptions = {
          from: email,
          to: "recyclenetwork0@gmail.com",
          subject: 'New Feedback Received',
          html: `<h3>New Feedback Submission</h3>
                 <p><strong>Name:</strong> ${name}</p>
                 <p><strong>Email:</strong> ${email}</p>
                 <p><strong>Feedback Rating:</strong> ${feedback} / 4</p>
                 <p><strong>Message:</strong> ${message}</p>
                 <br>
                 <p>Please review this feedback and respond if needed.</p>`
      };

      await transporter.sendMail(adminMailOptions);

      // User Confirmation Email
      let userMessage = `<p>Thank you for your feedback! 😊</p>`;
      if (feedback == 0 || feedback == 1) {
          userMessage = `<p>We noticed your experience was unsatisfactory. Our team will reach out to address your concerns. 🙏</p>`;
      }

      const userMailOptions = {
          from: "recyclenetwork0@gmail.com",
          to: email,
          subject: 'Thank You for Your Feedback!',
          html: `<h3>Hi ${name},</h3>
                 ${userMessage}
                 <p><strong>Your Feedback Rating:</strong> ${feedback} / 4</p>
                 <p><strong>Your Message:</strong> ${message}</p>
                 <br>
                 <p>We appreciate your time in helping us improve.</p>
                 <p>Best regards,<br>Recycle Network Team</p>`
      };

      await transporter.sendMail(userMailOptions);

      res.status(200).json({ message: 'Feedback submitted successfully' });
  } catch (error) {
      console.error('Error processing feedback:', error);
      res.status(500).json({ error: 'Error saving feedback' });
  }
});

// Middleware to check if user is admin
function isAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
      next();
  } else {
      return res.status(403).json({ error: "Access denied" });
  }
}
// Route to fetch all user orders (for admin)
app.get('/admin/orders', authenticateUser, isAdmin, async (req, res) => {
  try {
      const orders = await Order.find().populate('user', 'name email');
      res.status(200).json({ orders });
  } catch (err) {
      console.error("Admin fetch orders error:", err);
      res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// ✅ Route for Homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "allfiles", "mainloader.html"));
});

// ✅ Start Server
const PORT = 5100;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
