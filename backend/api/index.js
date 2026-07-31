const app = require('../server');

module.exports = (req, res) => {
  try {
    return app(req, res);
  } catch (err) {
    console.error('Serverless error:', err);
    return res.status(500).json({ error: 'Serverless Error', message: err.message });
  }
};
