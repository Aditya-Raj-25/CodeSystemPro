const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        const token = req.header('Authorization');
        if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

        // Expecting token format: Bearer <token>
        const expectedToken = token.startsWith('Bearer ') ? token.slice(7) : token;

        const decoded = jwt.verify(expectedToken, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = authMiddleware;
