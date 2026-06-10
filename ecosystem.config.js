module.exports = {
  apps: [{
    name: 'muebleuno',
    script: 'node_modules/.bin/next',
    args: 'start -p 3008',
    cwd: '/var/www/muebleuno',
    env: {
      NODE_ENV: 'production',
      PORT: 3008,
      DATABASE_URL: 'file:/var/www/muebleuno/prisma/muebleuno.db',
      NEXTAUTH_SECRET: 'muebleuno_secret_key_2024_change_in_production',
      NEXTAUTH_URL: 'https://muebleuno.com',
      AUTH_URL: 'https://muebleuno.com',
      UPLOAD_DIR: '/var/www/muebleuno/public/uploads',
    },
  }],
}
