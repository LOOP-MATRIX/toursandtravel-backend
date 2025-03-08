const User = require('../models/user');
const bcrypt = require('bcrypt');
const generateToken = require('../utils/generateToken');

exports.registerUser = async (req, res) => {
    try {
        const { name, email, password ,phone} = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword,phone });
        await newUser.save();
        res.status(201).json({ message: 'User registered' ,newUser});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = generateToken(user._id, user.isAdmin);
        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
