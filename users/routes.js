const { Router } = require('express');
const path = require('path');
const shortId = require('shortid');
const multer = require('multer');

const {
  createUser,
  login,
  validateCreateUser,
  validateLogin,
  verifyToken,
  logout,
  getUser,
  minifyImg,
  changeAvatar
} = require('../users/controllers');

const storage = multer.diskStorage({
  destination: 'tmp',
  filename: function (req, file, cb) {
    const ext = path.parse(file.originalname).ext;
    cb(null, shortId() + ext);
  }
});

const upload = multer({ storage });

const router = Router();

router.post('/auth/register', validateCreateUser, createUser);
router.post('/auth/login', validateLogin, login);
router.post('/auth/logout', verifyToken, logout);
router.get('/current', verifyToken, getUser);
router.patch('/avatars', verifyToken, upload.single('custom_avatar'), minifyImg, changeAvatar);

module.exports = router;