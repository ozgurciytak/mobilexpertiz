const express = require('express');
const app = express();
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.listen(3000, '0.0.0.0', () => console.log('Test server on 3000'));
