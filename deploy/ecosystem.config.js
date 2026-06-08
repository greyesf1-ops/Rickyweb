module.exports = {
  apps: [
    {
      name: 'rickysafe-api',
      cwd: '/var/www/rickysafe/backend',
      script: 'src/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};

