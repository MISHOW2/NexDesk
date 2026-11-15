// controllers/authControllers.js

import * as userService from "../services/userService.js";

export const register = async (req, res, next) => {
  try {
    await userService.registerUser(req.body && typeof req.body === "object" ? req.body : {});

    return res.status(201).json({
      message: "User registered",
    });
  } catch (err) {
    if (err.statusCode && err.statusCode < 500) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    return next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const {user , token} = await userService.userLogin(
      req.body && typeof req.body === "object" ? req.body : {}
    );

    const { password, ...safeUser } = user;

    return res.status(200).json({
      message: "Login successful",
      user: safeUser,
      token: token
    });
  } catch (error) {
    if (error.statusCode && error.statusCode < 500) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return next(error);
  }
};