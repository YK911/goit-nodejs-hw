const userModel = require('../models/users');
const Joi = require('joi');
const bcypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const saltRounds = 3;

async function createUser(req, res, next) {
  try {
    const { email, password, subscription } = req.body;
    const existEmail = await userModel.findOne({ email });
    if (existEmail) {
      return res.status(400).json({ message: 'Email in use' });
    }

    const hashPassword = await bcypt.hash(password, saltRounds);
    const newUser = await userModel.create({
      email,
      password: hashPassword,
      subscription
    });
    await newUser.save((err, savedUser) => {
      err
        ? res.status(400).json(err.message)
        : res.status(201).json({
            user: {
              email: savedUser.email,
              subscription: savedUser.subscription
            }
          });
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Email not registered' });
    }
    const validPassword = await bcypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Неверный логин или пароль' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    await userModel.findByIdAndUpdate(user._id, { $set: { token } });
    res.status(200).json({
      token,
      user: {
        email: user.email,
        subscription: user.subscription
      }
    });
  } catch (err) {
    next(err);
  }
}

function validateCreateUser(req, res, next) {
  if (Object.keys(req.body).length === 0) {
    res.status(422).json({ message: 'Missing required fields' });
  }

  const schema = Joi.object().keys({
    email: Joi.string().email({ minDomainAtoms: 2 }).required(),
    password: Joi.string()
      .regex(/^[a-zA-Z0-9]{3,30}$/)
      .required(),
    subscription: Joi.string()
  });

  const { error, value } = Joi.validate(req.body, schema);
  error
    ? res.status(422).json({ message: error.details[0].message })
    : next();
}

function validateLogin(req, res, next) {
  const schema = Joi.object().keys({
    email: Joi.string().email({ minDomainAtoms: 2 }).required(),
    password: Joi.string()
      .regex(/^[a-zA-Z0-9]{3,30}$/)
      .required()
  });

  const { error, value } = Joi.validate(req.body, schema);
  error
    ? res.status(422).json({ message: error.details[0].message })
    : next();
}

async function verifyToken(req, res, next) {
  const authorizationHeader = req.get('Authorization');
  if (!authorizationHeader) {
    return res.status(401).json({ message: 'Not authorized' });
  }
  const token = authorizationHeader.replace('Bearer ', '');
  try {
    const userId = jwt.verify(token, process.env.JWT_SECRET).id;
    const user = await userModel.findById(userId);
    if (!user || user.token !== token) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized' });
  }
}

async function logout(req, res, next) {
  try {
    await userModel.findByIdAndUpdate(req.user._id, { token: null });
    res.status(200).json({ message: 'Logout success' });
  } catch (err) {
    next(err);
  }
}

async function getUser(req, res, next) {
  try {
    const user = await userModel.findById(req.user._id);
    res
      .status(200)
      .json({ email: user.email, subscription: user.subscription });
  } catch (err) {
    next(err);
  }
}


module.exports = {
  createUser,
  login,
  validateCreateUser,
  validateLogin,
  verifyToken,
  logout,
  getUser
}