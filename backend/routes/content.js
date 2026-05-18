const express = require('express');
const { getContent, getArticle, getCategories } = require('../controllers/contentController');

const router = express.Router();

router.get('/', getContent);
router.get('/categories', getCategories);
router.get('/:id', getArticle);

module.exports = router;
