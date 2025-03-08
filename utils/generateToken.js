const jwt = require('jsonwebtoken');

const generateToken = (id, isAdmin) => {
    return jwt.sign({ userId: id, isAdmin }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

module.exports = generateToken;
