const { Router } = require('express');
const {
  createUser,
  login,
  validateCreateUser,
  validateLogin,
  verifyToken,
  logout,
  getUser
} = require('../users/controllers');

const router = Router();

router.post('/auth/register', validateCreateUser, createUser);
router.post('/auth/login', validateLogin, login);
router.post('/auth/logout', verifyToken, logout);
router.get('/current', verifyToken, getUser);

module.exports = router;