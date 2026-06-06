module.exports = {
  apps: [{
    name: 'muebleuno',
    script: '.next/standalone/server.js',
    cwd: '/var/www/muebleuno',
    env: {
      NODE_ENV: 'production',
      PORT: 3008,
      HOSTNAME: '0.0.0.0',
      DATABASE_URL: 'file:/var/www/muebleuno/prisma/muebleuno.db',
      NEXTAUTH_SECRET: 'muebleuno_secret_key_2024_change_in_production',
      NEXTAUTH_URL: 'https://dcr.ar/muebleuno',
      AUTH_URL: 'https://dcr.ar/muebleuno',
      UPLOAD_DIR: '/var/www/muebleuno/public/uploads',
    },
  }],
}
