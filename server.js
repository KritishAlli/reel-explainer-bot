require('dotenv').config();
const express = require('express');
const webhookRouter = require('./src/webhook');
const explainRouter = require('./src/explainRoute');

const app = express();
app.use(express.json());

app.use('/webhook', webhookRouter);
app.use('/explain', explainRouter);

app.get('/', (req, res) => {
  res.send('Reel Explainer Bot is running.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
