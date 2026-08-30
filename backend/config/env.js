require('dotenv').config();

const required = ['MONGO_URI', 'JWT_SECRET'];

function validateEnv() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length && process.env.NODE_ENV !== 'test') {
    console.warn(
      `[ENV] Warning: missing recommended environment variables: ${missing.join(', ')}. ` +
      'Copy .env.example to .env and set them for a real deployment.'
    );
  }
}

module.exports = { validateEnv };
