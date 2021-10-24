const config = require('./config.json');

const validateAuthKey = async (req, res, next) => {
    const authKey = req.headers['auth-key'];
    if (config.authKey == authKey)
        return next();

    console.log('Authentication failed');
    return res.status(401).json({
        success: 'false',
        message: 'Invalid authentication key'
    });
};

module.exports = validateAuthKey;