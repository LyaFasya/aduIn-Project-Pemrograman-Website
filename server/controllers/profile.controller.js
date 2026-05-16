const bcrypt = require('bcrypt');
const { User, Profile } = require('../models');
const cloudinaryService = require('../services/cloudinary.service');

const getProfile = async (req, res) => {
  try {
    const user = await User.findOne({
      where: { id: req.user.id },
      attributes: ['id', 'name', 'email', 'role'],
      include: [{
        model: Profile,
        attributes: ['phone', 'address', 'photo']
      }]
    });

    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
    res.status(200).json({ message: 'Berhasil menampilkan profil', data: user });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menampilkan profil', error: error.message });
  }
};

const createProfile = async (req, res) => {
  try {
    const { phone, address } = req.body;

    if (phone && !/^\+?[0-9]{8,15}$/.test(phone)) {
      return res.status(400).json({ message: 'Nomor telepon tidak valid, hanya boleh angka (8-15 digit)' });
    }

    const profile = await Profile.findOne({ where: { user_id: req.user.id } });
    if (!profile) return res.status(404).json({ message: 'Profil tidak ditemukan' });
    if (profile.phone || profile.address || profile.photo) {
      return res.status(400).json({ message: 'Profil sudah ada, gunakan endpoint update' });
    }

    let photoUrl = null;
    if (req.file) {
      const uploadResult = await cloudinaryService.uploadImage(req.file, 'profiles');
      photoUrl = uploadResult.url;
    }

    await profile.update({ phone, address, photo: photoUrl });
    res.status(201).json({ message: 'Profil berhasil dibuat', data: profile });
  } catch (error) {
    res.status(500).json({ message: 'Gagal membuat profil', error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

    const profile = await Profile.findOne({ where: { user_id: req.user.id } });
    if (!profile) return res.status(404).json({ message: 'Profil tidak ditemukan' });

    const userUpdates = {};
    if (name) userUpdates.name = name;
    if (email) {
      const emailExist = await User.findOne({ where: { email } });
      if (emailExist && emailExist.id !== user.id) {
        return res.status(400).json({ message: 'Email sudah digunakan oleh akun lain' });
      }
      userUpdates.email = email;
    }
    if (password) {
      userUpdates.password = await bcrypt.hash(password, 10);
    }
    if (Object.keys(userUpdates).length > 0) await user.update(userUpdates);

    const profileUpdates = {};
    if (phone) {
      if (!/^\+?[0-9]{8,15}$/.test(phone)) {
        return res.status(400).json({ message: 'Nomor telepon tidak valid, hanya boleh angka (8-15 digit)' });
      }
      profileUpdates.phone = phone;
    }
    if (address) profileUpdates.address = address;
    if (req.file) {
      const uploadResult = await cloudinaryService.uploadImage(req.file, 'profiles');
      profileUpdates.photo = uploadResult.url;
    }
    if (Object.keys(profileUpdates).length > 0) await profile.update(profileUpdates);

    res.status(200).json({
      message: 'Profil berhasil diperbarui',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: profile.phone,
        address: profile.address,
        photo: profile.photo
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memperbarui profil', error: error.message });
  }
};

module.exports = { getProfile, createProfile, updateProfile };
