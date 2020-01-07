const express = require('express');
const router = express.Router();
const search = require('../models/search');
const fetch = require('node-fetch');

const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({ extended: false });

router.get('/', async (req, res) => {
  let data = {
    title: 'KMeans',
  };

  res.render('home', {
    data: { ...data },
    page: req.url,
  });
});

router.get('/search', async (req, res) => {
  let data = {
    title: `Search for: '${req.query.q}'`,
  };

  const results = req.query.q
    ? await fetch('http://localhost:1337/search?q=' + req.query.q).then(
        response => response.json()
      )
    : [];

  res.render('search', {
    data: { ...data, results, q: req.query.q },
    page: req.url,
  });
});

module.exports = router;
