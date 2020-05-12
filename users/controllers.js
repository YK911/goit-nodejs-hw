const userModel = require('../models/users');
const fs = require('fs');
const {promises: fsPromises} = require('fs');
const path = require('path');
const Joi = require('joi');
const bcypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const imagemin = require('imagemin');
const imageminJpegtran = require('imagemin-jpegtran');
const imageminPngquant = require('imagemin-pngquant');
const Avatar = require('avatar-builder');
const avatar = Avatar.githubBuilder(128);
const shortId = require('shortid');
const sgMail = require('@sendgrid/mail');

const saltRounds = 3;

async function createUser(req, res, next) {
  try {
    const { email, password, subscription } = req.body;
    const existEmail = await userModel.findOne({ email });
    if (existEmail) {
      return res.status(400).json({ message: 'Email in use' });
    }

    const hashPassword = await bcypt.hash(password, saltRounds);
    const otpCode = shortId();
    const newAvatar = `avatar_${shortId()}.png`;
    avatar
      .create('gabriel')
      .then(buffer => fs.writeFileSync(`./tmp/${newAvatar}`, buffer));
    const newUser = await userModel.create({
      email,
      password: hashPassword,
      subscription,
      avatarURL: `http://localhost:3030/${newAvatar}`,
      otpCode
    });
    await newUser.save((err, savedUser) => {
      if (err) {
        res.status(400).json(err.message);
      }
      this.sendEmail(newUser);
      res
        .status(201)
        .json({
          message:
            'We sent you a verification email to the email address that you specified at the registration. Please go to your inbox to complete the registration.'
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
        subscription: user.subscription,
        avatarURL: user.avatarURL
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

async function minifyImg(req, res, next) {
  try {
    const parsedUrl = req.user.avatarURL.split('/');
    const oldAvatar = parsedUrl[parsedUrl.length - 1];
    await fsPromises.unlink(`tmp/${oldAvatar}`);
    
    await imagemin([`tmp/${req.file.filename}`], {
      destination: ('public/images'),
      plugins: [
        imageminJpegtran(),
        imageminPngquant({
          quality: [0.6, 0.8]
        })
      ]
    });

    const { filename, path: tmpPath } = req.file;
    req.file.path = path.join(__dirname, '..', 'public', 'images', filename);
    req.file.destination = path.join(__dirname, '..', 'public', 'images');
    await fsPromises.unlink(tmpPath);
    next();
  } catch (err) {
    next(err);
  }
}

async function changeAvatar(req, res, next) {
  try {
    await userModel.findByIdAndUpdate(
      req.user._id,
      { avatarURL: req.file.path }
    );
    res.status(201).json({message: 'Avatar changed'});
  } catch (err) {
    next(err);
  }
}

async function sendEmail(user) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const msg = {
    to: user.email,
    from: "jaroslavkositsa@gmail.com",
    subject: "Since we can't all win the lottery …",
    text: `Copy this link to your browser to take your prize: http://localhost:8080/api/users/otp/${user.otpCode}`,
    html: `Let's click on the following link to take your prize: <a href="http://localhost:8080/api/users/otp/${user.otpCode}">Win a prize!!!</a>`
  };
  await sgMail.send(msg);
}

async function completeRegister(req, res, next) {
  try {
    const { otpCode } = req.params;
    const verifiedUser = await userModel.findOne({ otpCode });

    if (!verifiedUser) {
      res.status(401).json({ message: 'Verification link expired' });
    }

    await userModel.findByIdAndUpdate(verifiedUser._id, {
      registered: true,
      otpCode: null
    });
    res.status(200).json({
      message: 'Your email was successfully verified',
      user: {
        email: verifiedUser.email,
        subscription: verifiedUser.subscription,
        avatarURL: verifiedUser.avatarURL,
        registered: true
      }
    });
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
  getUser,
  minifyImg,
  changeAvatar,
  sendEmail,
  completeRegister
}