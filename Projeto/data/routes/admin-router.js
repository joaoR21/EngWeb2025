const express = require('express');
const router = express.Router();
const admin_controller = require('../controllers/admin-controller');
const news_controller = require('../controllers/news-controller');
const resource_controller = require('../controllers/resource-controller');

router.get('/users', async (req, res) => {
  try {
    const users = await admin_controller.listUsers(req.query);
    res.status(200).json(users);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || "Failed to list users." });
  }
});

router.post('/users', async (req, res) => {
  try {
    const new_user = await admin_controller.adminRegisterUser(req.body);
    res.status(201).json(new_user);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || "Failed to register user." });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await admin_controller.getUserByID(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.status(200).json(user);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || "Failed to get user." });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const updated = await admin_controller.updateUser(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: 'User not found or could not be updated.' });
    res.status(200).json(updated);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || "Failed to update user." });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const result = await admin_controller.deleteUser(req.params.id, req.user._id);
    if (!result) return res.status(404).json({ message: 'User not found.' });
    res.status(200).json(result);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || "Failed to delete user." });
  }
});

router.get('/news', async (req, res) => {
  try {
    const news_items = await news_controller.listAllNews(req.query);
    res.status(200).json(news_items);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || "Failed to list news items." });
  }
});

router.post('/news', async (req, res) => {
  try {
    const new_news = await news_controller.createNews(req.body, req.user._id);
    res.status(201).json(new_news);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || "Failed to create news item." });
  }
});

router.get('/news/:id', async (req, res) => {
  try {
    const news_item = await news_controller.getNewsByID(req.params.id);
    if (!news_item) return res.status(404).json({ message: 'News item not found.' });
    res.status(200).json(news_item);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || "Failed to get news item." });
  }
});

router.put('/news/:id', async (req, res) => {
  try {
    const updated = await news_controller.updateNews(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: 'News item not found or could not be updated.' });
    res.status(200).json(updated);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || "Failed to update news item." });
  }
});

router.delete('/news/:id', async (req, res) => {
  try {
    const result = await news_controller.deleteNews(req.params.id);
    if (!result) return res.status(404).json({ message: 'News item not found.' });
    res.status(200).json(result);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || "Failed to delete news item." });
  }
});

router.patch('/news/:id/visibility', async (req, res) => {
  try {
    const news_item = await news_controller.toggleNewsVisibility(req.params.id);
    if (!news_item) return res.status(404).json({ message: 'News item not found.' });
    res.status(200).json(news_item);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || "Failed to toggle news item visibility." });
  }
});

router.get('/resources', async (req, res) => {
  try {
    const query_params = { ...req.query, forAdmin: true };
    const resources = await resource_controller.listResources(query_params, req.user._id, true);
    res.status(200).json(resources);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || "Failed to list resources for admin." });
  }
});

router.get('/statistics', async (req, res) => {
  try {
    const stats = await admin_controller.getUsageStatistics();
    res.status(200).json(stats);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || "Failed to get statistics." });
  }
});

module.exports = router;
