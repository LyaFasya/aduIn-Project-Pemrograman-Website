const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) return res.status(403).json({ message: 'Akses ditolak, token tidak ada' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = decoded; 
    
    next(); 
  } catch (err) {
    return res.status(401).json({ message: 'Token tidak valid' });
  }
};

const verifyAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Akses khusus Admin' });
  }
  next();
};

module.exports = { verifyToken, verifyAdmin };