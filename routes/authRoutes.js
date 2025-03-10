const express = require('express');
const { registerUser, loginUser,getAllUsers,deleteUser,getUserById } = require('../controllers/authController');

const router = express.Router();
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/all',getAllUsers)
router.delete('/:id',deleteUser)
router.get('/user/:id',getUserById)

module.exports = router;
