const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const resource_controller = require('../controllers/resource-controller');
const { ensureAuthenticated } = require('./auth');

const UPLOAD_TEMP_DIR = path.join(__dirname, '..', 'uploads');
fs.mkdir(UPLOAD_TEMP_DIR, { recursive: true }).catch(err => {
  if (err.code !== 'EEXIST') console.error('[ERROR]: failed to create upload directory:', err);
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_TEMP_DIR),
  filename: (req, file, cb) => cb(null, `temp-sip-${Date.now()}-${file.originalname}`)
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed') {
      cb(null, true);
    } else {
      cb(new Error('invalid file type. Only ZIP files are allowed.'), false);
    }
  }
});

router.post('/', ensureAuthenticated, upload.single('sipFile'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'no SIP file uploaded.' });
  const tempSIP_path = req.file.path;
  if (!req.user || !req.user._id || !req.user.level) {
    if (tempSIP_path) await fs.unlink(tempSIP_path).catch(e => {});
    return res.status(401).json({ message: 'User information is missing or incomplete for resource creation.' });
  }
  try {
    const new_resource = await resource_controller.ingest_resource(req.file, req.user._id, req.user.level);
    res.status(201).json(new_resource);
    if (tempSIP_path) {
      await fs.unlink(tempSIP_path).catch(e => {});
    }
  } catch (error) {
    if (tempSIP_path) {
      try { await fs.unlink(tempSIP_path); } catch (e) {}
    }
    res.status(error.status || 500).json({ message: error.message || "Failed to ingest resource." });
  }
});

router.get('/', async (req, res) => {
  try {
    const requestingUser = req.user ? req.user._id : null;
    const resources = await resource_controller.listResources(req.query, requestingUser, false);
    res.status(200).json(resources);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/profile', ensureAuthenticated, async (req, res) => {
  try {
    const resources = await resource_controller.listResources(req.query, req.user._id, true);
    res.status(200).json(resources);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const resourceID = req.params.id;
    const resource = await resource_controller.getResourceByID(resourceID);
    if (!resource) return res.status(404).json({ message: 'Resource not found.' });
    const is_owner = req.user && resource.ownerID && resource.ownerID._id && resource.ownerID._id.toString() === req.user._id.toString();
    const is_admin = req.user && req.user.level === 'admin';
    if (!resource.isPublic && !is_owner && !is_admin) {
      return res.status(403).json({ message: 'FORBIDDEN: You do not have permission to view this private resource.' });
    }
    res.status(200).json(resource);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id/files/:storageName', ensureAuthenticated, async (req, res) => {
  try {
    const { id, storageName } = req.params;
    const resource = await resource_controller.getResourceByID(id);
    if (!resource) return res.status(404).json({ message: 'Resource not found.' });
    const is_owner = req.user && resource.ownerID && resource.ownerID._id && resource.ownerID._id.toString() === req.user._id.toString();
    const is_admin = req.user && req.user.level === 'admin';
    if (!resource.isPublic && !is_owner && !is_admin) {
      return res.status(403).json({ message: 'FORBIDDEN: You do not have permission to access files of this private resource.' });
    }
    const file_details = await resource_controller.getAssociatedFileDetails(id, storageName);
    if (!file_details) return res.status(404).json({ message: 'File not found for this resource.' });
    res.download(file_details.filePath, file_details.originalName, err => {
      if (err) console.error(`[ERROR]: sending file ${file_details.originalName} (storage:${storageName}):`, err);
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const resourceID = req.params.id;
    const updated_data = req.body;
    if (Object.keys(updated_data).length === 0) return res.status(400).json({ message: 'No update data provided.' });
    const resource = await resource_controller.updateResource(resourceID, updated_data, req.user._id, req.user.level);
    if (!resource) return res.status(404).json({ message: 'Resource not found or could not be updated.' });
    res.status(200).json(resource);
  } catch (error) {
    if (error.status === 403) return res.status(403).json({ message: error.message });
    if (error.name === 'ValidationError') return res.status(400).json({ message: 'validation failed.', errors: error.errors });
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', ensureAuthenticated, async (req, res, next) => {
  try {
    const resourceID = req.params.id;
    const result = await resource_controller.deleteResource(resourceID, req.user._id, req.user.level);
    if (!result) return res.status(404).json({ message: 'Resource not found.' });
    res.status(200).json(result);
  } catch (error) {
    if (error.status === 403) return res.status(403).json({ message: error.message });
  }
});

router.get('/:id/dip', ensureAuthenticated, async (req, res) => {
  try {
    const resourceID = req.params.id;
    const resource = await resource_controller.getResourceByID(resourceID);
    if (!resource) return res.status(404).json({ message: 'Resource not found.' });
    const is_owner = req.user && resource.ownerID && resource.ownerID._id && resource.ownerID._id.toString() === req.user._id.toString();
    const is_admin = req.user && req.user.level === 'admin';
    if (!resource.isPublic && !is_owner && !is_admin) {
      return res.status(403).json({ message: 'FORBIDDEN: You do not have permission to generate a DIP for this private resource.' });
    }
    const DIP_result = await resource_controller.generateDIPForResource(resourceID);
    if (!DIP_result || !DIP_result.data) return res.status(500).json({ message: 'DIP could not be generated or is empty.' });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${DIP_result.fileName}"`);
    res.send(DIP_result.data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
