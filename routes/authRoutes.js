const express = require('express');
const { registerUser, loginUser,getAllUsers,deleteUser } = require('../controllers/authController');

const router = express.Router();
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/all',getAllUsers)
router.delete('/:id',deleteUser)

module.exports = router;
