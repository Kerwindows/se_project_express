const User = require('../models/user');
const jwt = require('jsonwebtoken');
const {
  HTTP_CLIENT_ERROR_NOT_FOUND,
  HTTP_CLIENT_BAD_REQUEST,
  SERVERSIDE_ERROR,
  HTTP_CLIENT_CONFLICT,
  HTTP_CLIENT_UNAUTHORISED
} = require('../utils/utils');

const { NODE_ENV, JWT_SECRET } = process.env;

const getCurrentUser = (req, res, next) => {
  User.findById(req.user._id)
    .then((user) => {
      if (!user) {
        res
          .status(HTTP_CLIENT_BAD_REQUEST)
          .send({ message: 'No User with that ID found' });
      }
      return res.status(200).send(user);
    })
    .catch(next);
};

const getUsers = (req, res) => {
  User.find({})
    .orFail()
    .then((users) => res.send(users))
    .catch((error) => res.status(HTTP_CLIENT_BAD_REQUEST).send(error));
};

const getUserById = (req, res) => {
  User.findById(req.params.id)
    .orFail()
    .then((user) => {
      res.status(200).send({ data: user });
    })
    .catch((error) => {
      if (error.name === 'CastError') {
        res
          .status(HTTP_CLIENT_BAD_REQUEST)
          .send({ message: 'Invalid user id' });
      } else if (error.name === 'DocumentNotFoundError') {
        res
          .status(HTTP_CLIENT_ERROR_NOT_FOUND)
          .send({ message: `no user found with id ${req.params.id}` });
      } else {
        res.status(SERVERSIDE_ERROR).send({ message: 'internal server error' });
      }
    });
};

const createUser = (req, res) => {
  const { name, about, avatar,email, password } = req.body;
  User.findOne({ email })
    .then((user) => {
      if (user) {
        res
        .status(HTTP_CLIENT_CONFLICT)
        .send({ message: 'Try another email' });
      }
    });
  if (!email || !password) {
    res
    .status(HTTP_CLIENT_BAD_REQUEST)
    .send({ message: 'Missing email or password' });
  }
  
  return bcrypt.hash(password, 10, (err, hash) => {
    User.create({
      name,
      about,
      avatar,
      email,
      password: hash,
    })
      .then((user) => {
        res.send({
          data: {
            name: user.name,
            about: user.about,
            avatar: user.avatar,
            email: user.email,
            _id: user._id,
          },
        });
      })
      .catch(next);
  });
  
  // User.create({ name, about, avatar })
  //   .then((user) => res.send({ data: user }))
  //   .catch((error) => {
  //     if (error.name === 'ValidationError') {
  //       res
  //         .status(HTTP_CLIENT_BAD_REQUEST)
  //         .send({ message: 'invalid user data' });
  //     } else {
  //       res.status(SERVERSIDE_ERROR).send({ Message: 'internal error' });
  //     }
  //   });
};

const updateProfile = (req, res) => {
  const { name, about } = req.body;

  User.findByIdAndUpdate(
    req.user._id,
    { name, about },
    { new: true, runValidators: true },
  )
    .orFail()
    .then((user) => res.send({ data: user }))
    .catch((error) => {
      if (error.name === 'ValidationError') {
        res
          .status(HTTP_CLIENT_BAD_REQUEST)
          .send({ message: 'invalid user data' });
      } else if (error.name === 'CastError') {
        res
          .status(HTTP_CLIENT_BAD_REQUEST)
          .send({ message: 'invalid user id' });
      } else if (error.name === 'DocumentNotFoundError') {
        res
          .status(HTTP_CLIENT_ERROR_NOT_FOUND)
          .send({ message: `no user found with id ${req.params.id}` });
      } else {
        res.status(SERVERSIDE_ERROR).send({ Message: 'internal error' });
      }
    });
};

const updateAvatar = (req, res) => {
  const { avatar } = req.body;
  User.findOneAndUpdate(req.user._id, avatar, {
    new: true,
    runValidators: true,
  })
    .orFail()
    .then((user) => res.send({ data: user }))
    .catch((error) => {
      if (error.name === 'ValidationError') {
        res
          .status(HTTP_CLIENT_BAD_REQUEST)
          .send({ message: 'invalid user data' });
      } else if (error.name === 'CastError') {
        res
          .status(HTTP_CLIENT_BAD_REQUEST)
          .send({ message: 'invalid user id' });
      } else if (error.name === 'DocumentNotFoundError') {
        res
          .status(HTTP_CLIENT_ERROR_NOT_FOUND)
          .send({ message: `no user found with id ${req.params.id}` });
      } else {
        res.status(SERVERSIDE_ERROR).send({ Message: 'Internal Error' });
      }
    });
};

const login = (req, res, next) => {
  const { email, password } = req.body;
  return User.findUserByCredentials(email, password)
    .then((user) => {
      if (!user) {
        res
          .status(HTTP_CLIENT_UNAUTHORISED)
          .send({ message: 'Probably a wrong email or password' });
      } else {
        const token = jwt.sign({ _id: user._id }, NODE_ENV === 'production' ? JWT_SECRET : 'dev-secret-key', { expiresIn: '7d' });
        res.send({ token });
      }
    })
    .catch(() => {
      next(
        res
          .status(HTTP_CLIENT_UNAUTHORISED)
          .send({ message: 'That email or password shall not pass' }));
    });
};

module.exports = {
  getCurrentUser,
  getUsers,
  getUserById,
  createUser,
  updateProfile,
  updateAvatar,
  login,
};