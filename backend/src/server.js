const app = require('./app');

const port = Number(process.env.PORT || 3001);

app.listen(port, () => {
  console.log(`RickySafe Maintenance API escuchando en http://localhost:${port}`);
});

