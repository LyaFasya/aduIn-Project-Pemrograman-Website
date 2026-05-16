const bcrypt = require('bcrypt');
const { User, Profile } = require('../models');
const jwt = require('jsonwebtoken');

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email sudah digunakan!' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'user'
    });

    await Profile.create({
      user_id: newUser.id,
      phone: null,
      address: null,
      photo: null
    });

    res.status(201).json({
      message: 'Registrasi berhasil! Silakan login.',
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server', data: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'Email tidak ditemukan' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Password salah' });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await user.update({ refresh_token: refreshToken });

    res.status(200).json({
      message: 'Login berhasil',
      accessToken,
      refreshToken
    });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) return res.status(401).json({ message: 'Refresh token tidak ditemukan' });
    const user = await User.findOne({ where: { refresh_token: token } });
    if (!user) return res.status(403).json({ message: 'Refresh token tidak valid' });

    jwt.verify(token, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
      if (err) return res.status(403).json({ message: 'Refresh token sudah kadaluarsa, silakan login ulang' });
      const newAccessToken = generateAccessToken(user);

      res.status(200).json({
        message: 'Access token berhasil diperbarui',
        accessToken: newAccessToken
      });
    });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return res.status(400).json({ message: 'Refresh token diperlukan' });
    const user = await User.findOne({ where: { refresh_token: token } });
    if (!user) return res.status(404).json({ message: 'Refresh token tidak ditemukan' });
    await user.update({ refresh_token: null });
    res.status(200).json({ message: 'Logout berhasil' });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

module.exports = { register, login, refreshToken, logout };