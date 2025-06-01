const express = require('express');
const router = express.Router();
const axios = require('axios');
const multer = require('multer');
const JSZip = require('jszip');
const fsPromises = require('fs').promises;
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const crypto = require('crypto');
const { resource_types, suggested_tags } = require('../config/taxonomies');

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:16000';
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

fsPromises.mkdir(UPLOAD_DIR, { recursive: true }).catch(err => {
    if (err.code !== 'EEXIST') console.error('[ERROR]: failed to create frontend upload directory:', err);
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    fsPromises.mkdir(UPLOAD_DIR, { recursive: true })
      .then(() => cb(null, UPLOAD_DIR))
      .catch(err => cb(err));
  },
  filename: function (req, file, cb) {
    cb(null, `temp-${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage: storage });

async function generateSHA256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function ensure_authenticated(req, res, next) {
  if (req.session.isAuthenticated && req.session.user && req.session.jwtToken) {
    return next();
  }
  req.session.returnTo = req.originalUrl;
  res.redirect('/login');
}

function ensure_admin(req, res, next) {
  if (req.session.isAuthenticated && req.session.user && req.session.user.level === 'admin' && req.session.jwtToken) {
    return next();
  }
  req.session.message = 'Admin access required.';
  req.session.messageType = 'error';
  req.session.returnTo = req.originalUrl;
  res.redirect('/login');
}

const axios_instance = axios.create({
  baseURL: BACKEND_API_URL
});

function getAuthConfig(req) {
    const config = {};
    if (req.session.jwtToken) {
        config.headers = { Authorization: req.session.jwtToken };
    }
    return config;
}

function extractCustomFieldsFromRequest(body) {
    const custom_fields = {};
    const resource_type = body.resourceType;

    if (resource_type === 'photo') {
        if (body.photo_location) custom_fields.location = body.photo_location;
        if (body.photo_date) custom_fields.date = body.photo_date;
    } else if (resource_type === 'academic record') {
        if (body.academic_course_name) custom_fields.course_name = body.academic_course_name;
        if (body.academic_grade) custom_fields.grade = parseFloat(body.academic_grade);
    } else if (resource_type === 'sports activity') {
        if (body.sports_distance) custom_fields.distance = parseFloat(body.sports_distance);
        if (body.sports_duration) custom_fields.duration_minutes = parseInt(body.sports_duration,10);
    }
    return custom_fields;
}


router.post('/login', async (req, res) => {
  const { username,password } = req.body;
  try {
    const response = await axios_instance.post(`/auth/login`, { username, password });

    if (response.data && response.data.user && response.data.token) {
      req.session.user = response.data.user;
      req.session.jwtToken = response.data.token;
      req.session.isAuthenticated = true;
      const return_to = req.session.returnTo || (response.data.user.level === 'admin' ? '/admin' : '/profile');
      delete req.session.returnTo;
      res.redirect(return_to);
    } else {
      res.render('login', { title:'Login', message:'Login FAILED! (unexpected response from server).', messageType:'error', backendBaseUrl: BACKEND_API_URL });
    }
  } catch (error) {
    const error_message = error.response?.data?.message || 'Login FAILED! Please, check your credentials or try again later.';
    console.error('[FRONTEND][ERROR]: login attempt failed:', error.response ? JSON.stringify(error.response.data) : error.message);
    res.render('login', { title:'Login', message:error_message, messageType: 'error', backendBaseUrl: BACKEND_API_URL });
  }
});

router.post('/register', async (req, res) => {
  const { username,password,confirmPassword,level } = req.body;

  if (password !== confirmPassword) {
    return res.render('register', { title:'Register', message:'Passwords do not match.', messageType:'error', backendBaseUrl: BACKEND_API_URL, formData: req.body });
  }
  try {
    const response = await axios_instance.post(`/auth/register`, { username, password, level:level || 'consumer' });

    if (response.data && response.data.user && response.data.token) {
      req.session.user = response.data.user;
      req.session.jwtToken = response.data.token;
      req.session.isAuthenticated = true;
      res.redirect('/profile');
    } else {
      res.render('register', { title:'Register', message:'Registration SUCCESSFUL!, but failed to get token.', messageType: 'warning', backendBaseUrl: BACKEND_API_URL, formData: req.body });
    }
  } catch (error) {
    const error_message = error.response?.data?.message || 'Registration FAILED! Please, try again later.';
    console.error('[FRONTEND][ERROR]: registration attempt failed:', error.response ? JSON.stringify(error.response.data) : error.message);
    res.render('register', { title:'Register', message: error_message, messageType: 'error', backendBaseUrl: BACKEND_API_URL, formData: req.body });
  }
});

router.get('/logout', async (req, res) => {
  try {
    // Optional: Call backend logout endpoint if it exists and needs to invalidate the token server-side
    // await axios_instance.get('/auth/logout', getAuthConfig(req));
    console.log('[FRONTEND]: User initiated logout.');
  } catch (error) {
    console.error('[FRONTEND][ERROR]: signaling logout to backend (if applicable):', error.response ? JSON.stringify(error.response.data) : error.message);
  } finally {
    req.session.destroy(err => {
      if (err) {
        console.error('[FRONTEND][ERROR]: failed to destroy frontend session during logout:', err);
      }
      res.clearCookie('connect.sid'); // Ensure the session cookie is cleared
      res.redirect('/login');
    });
  }
});


router.get('/profile', ensure_authenticated, async (req, res) => {
  try {
    const { resourceType, minGrade, maxGrade, minDistance, maxDistance } = req.query;
    const query_params = { customFields: {} };

    if (resourceType) {
      query_params.resourceType = resourceType;
    }

    if (resourceType === 'academic record') {
        if (minGrade) query_params.customFields.grade_gte = minGrade;
        if (maxGrade) query_params.customFields.grade_lte = maxGrade;
    }

    if (resourceType === 'sports activity') {
        if (minDistance) query_params.customFields.distance_gte = minDistance;
        if (maxDistance) query_params.customFields.distance_lte = maxDistance;
    }
    
    if (Object.keys(query_params.customFields).length === 0) {
        delete query_params.customFields;
    }

    const response = await axios_instance.get(`/data/resources/profile`, {
        ...getAuthConfig(req),
        params: query_params
    });

    const message = req.session.message;
    const message_type = req.session.messageType;
    delete req.session.message;
    delete req.session.messageType;

    res.render('profile', {
      title: 'My Profile',
      resources: response.data,
      currentUser: req.session.user,
      message: message,
      messageType: message_type,
      backendBaseUrl: BACKEND_API_URL,
      definedResourceTypes: resource_types,
      selectedResourceType: resourceType || '',
      currentFilters: { minGrade, maxGrade, minDistance, maxDistance }
    });
  } catch (error) {
    const error_message = error.response?.data?.message || 'Could not fetch your profile items.';
    console.error("[FRONTEND][ERROR]: fetching profile items:", error.response ? JSON.stringify(error.response.data) : error.message);
     if (error.response && error.response.status === 401) {
        req.session.destroy(() => res.redirect('/login?message=Session expired. Please log in again.&messageType=error'));
        return;
    }
    res.render('profile', {
      title: 'My Profile',
      resources: [],
      error: error_message,
      currentUser: req.session.user,
      backendBaseUrl: BACKEND_API_URL,
      definedResourceTypes: resource_types,
      selectedResourceType: '',
      currentFilters: {}
    });
  }
});

router.get('/profile/academic', ensure_authenticated, async (req, res) => {
  try {
    const academicResourceType = 'academic record';
    const { minGrade, maxGrade } = req.query;
    const query_params = { resourceType: academicResourceType, customFields: {} };

    if (minGrade) query_params.customFields.grade_gte = minGrade;
    if (maxGrade) query_params.customFields.grade_lte = maxGrade;
    
    if (Object.keys(query_params.customFields).length === 0) {
        delete query_params.customFields;
    }

    const response = await axios_instance.get(`/data/resources/profile`, {
        ...getAuthConfig(req),
        params: query_params
    });

    res.render('profile', {
      title: 'My Academic Journey',
      resources: response.data,
      currentUser: req.session.user,
      message: null,
      messageType: null,
      backendBaseUrl: BACKEND_API_URL,
      definedResourceTypes: resource_types,
      selectedResourceType: academicResourceType,
      isJourneyView: true,
      currentFilters: { minGrade, maxGrade }
    });
  } catch (error) {
    const error_message = error.response?.data?.message || 'Could not fetch your academic journey.';
    console.error("[FRONTEND][ERROR]: fetching academic journey:", error.response ? JSON.stringify(error.response.data) : error.message);
    if (error.response && error.response.status === 401) {
        req.session.destroy(() => res.redirect('/login?message=Session expired. Please log in again.&messageType=error'));
        return;
    }
    res.render('profile', {
      title: 'My Academic Journey',
      resources: [],
      error: error_message,
      currentUser: req.session.user,
      backendBaseUrl: BACKEND_API_URL,
      definedResourceTypes: resource_types,
      selectedResourceType: 'academic record',
      isJourneyView: true,
      currentFilters: {}
    });
  }
});

router.get('/profile/sports', ensure_authenticated, async (req, res) => {
  try {
    const sportsResourceType = 'sports activity';
    const { minDistance, maxDistance } = req.query;
    const query_params = { resourceType: sportsResourceType, customFields: {} };

    if (minDistance) query_params.customFields.distance_gte = minDistance;
    if (maxDistance) query_params.customFields.distance_lte = maxDistance;

    if (Object.keys(query_params.customFields).length === 0) {
        delete query_params.customFields;
    }

    const response = await axios_instance.get(`/data/resources/profile`, {
        ...getAuthConfig(req),
        params: query_params
    });

    res.render('profile', {
      title: 'My Sports Journey',
      resources: response.data,
      currentUser: req.session.user,
      message: null,
      messageType: null,
      backendBaseUrl: BACKEND_API_URL,
      definedResourceTypes: resource_types,
      selectedResourceType: sportsResourceType,
      isJourneyView: true,
      currentFilters: { minDistance, maxDistance }
    });
  } catch (error) {
    const error_message = error.response?.data?.message || 'Could not fetch your sports journey.';
    console.error("[FRONTEND][ERROR]: fetching sports journey:", error.response ? JSON.stringify(error.response.data) : error.message);
    if (error.response && error.response.status === 401) {
        req.session.destroy(() => res.redirect('/login?message=Session expired. Please log in again.&messageType=error'));
        return;
    }
    res.render('profile', {
      title: 'My Sports Journey',
      resources: [],
      error: error_message,
      currentUser: req.session.user,
      backendBaseUrl: BACKEND_API_URL,
      definedResourceTypes: resource_types,
      selectedResourceType: 'sports activity',
      isJourneyView: true,
      currentFilters: {}
    });
  }
});

router.get('/new', ensure_authenticated, (req, res, next) => {
  if (req.session.user && req.session.user.level !== 'producer' && req.session.user.level !== 'admin') {
    req.session.message = 'You do not have permission to create new resources.';
    req.session.messageType = 'error';
    return res.redirect('/profile');
  }

  const message = req.session.message;
  const message_type = req.session.messageType;
  delete req.session.message;
  delete req.session.messageType;

  const form_data = { ...req.query };
  const types = req.query.resourceType || '';

  res.render('new-item', {
    title: 'New Item',
    backendBaseUrl: BACKEND_API_URL,
    formData: form_data,
    message: message,
    messageType: message_type,
    definedResourceTypes: resource_types,
    suggestedTags: suggested_tags,
    selectedResourceType: types
  });
});

router.post('/new', ensure_authenticated, upload.array('files'), async (req, res, next) => {
  const files = req.files || [];
  const manifest = {};
  const zip = new JSZip();
  let temp_ZIP_path = '';

  try {
    manifest.title = req.body.title || 'untitled resource';
    manifest.resourceType = req.body.resourceType || 'unknown';
    manifest.creationDate = req.body.creationDate && req.body.creationDate.trim() !== ''
      ? new Date(req.body.creationDate).toISOString()
      : new Date().toISOString();
    manifest.producer = req.body.producer || req.session.user.username;

    manifest.isPublic = req.body.isPublic === 'on' || req.body.isPublic === 'true';
    manifest.description = req.body.description;
    manifest.tags = req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    manifest.customFields = extractCustomFieldsFromRequest(req.body);
    manifest.files = [];

    zip.file('bagit.txt', 'BagIt-Version: 0.97\nTag-File-Character-Encoding: UTF-8');
    const data_dir = zip.folder('data');
    const payload_lines = [];
    let payload_bytes = 0;

    for (const file of files) {
      const file_content = await fsPromises.readFile(file.path);
      data_dir.file(file.originalname, file_content);
      const hash = await generateSHA256(file_content);
      payload_lines.push(`${hash}  data/${file.originalname}`);
      payload_bytes += file_content.length;
      manifest.files.push({
        pathInZip: `data/${file.originalname}`,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file_content.length,
        checksum: hash
      });
    }
    zip.file('manifest-sha256.txt', payload_lines.join('\n'));

    const bag_content = [
      `Source-Organization: ${manifest.producer || 'DigitalMe App User'}`,
      `Bagging-Date: ${new Date().toISOString().slice(0,10)}`,
      `Payload-Oxum: ${payload_bytes}.${files.length}`
    ].join('\n');
    zip.file('bag-info.txt', bag_content);

    const path_ZIP = 'metadata/manifesto-SIP.json';
    zip.folder('metadata').file('manifesto-SIP.json', JSON.stringify(manifest, null, 2));

    const tag_files = ['bagit.txt', 'bag-info.txt', 'manifest-sha256.txt', path_ZIP];
    const tag_Lines = [];
    for (const tag_file_path of tag_files) {
      const zipped_tag_file = zip.file(tag_file_path);
      if (zipped_tag_file) {
        const content_buffer = await zipped_tag_file.async('nodebuffer');
        const hash = await generateSHA256(content_buffer);
        tag_Lines.push(`${hash}  ${tag_file_path}`);
      }
    }
    zip.file('tagmanifest-sha256.txt', tag_Lines.join('\n'));

    temp_ZIP_path = path.join(UPLOAD_DIR, `sip_${Date.now()}_${req.session.user.username}.zip`);
    const zip_buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    await fsPromises.writeFile(temp_ZIP_path, zip_buffer);

    const form = new FormData();
    form.append('sipFile', fs.createReadStream(temp_ZIP_path), {
      filename: path.basename(temp_ZIP_path),
      contentType: 'application/zip'
    });

    const config = getAuthConfig(req);
    config.headers = { ...config.headers, ...form.getHeaders() };

    const backend_response = await axios_instance.post(`/data/resources`, form, config);

    req.session.message = `Resource "${backend_response.data.title}" submitted successfully!`;
    req.session.messageType = 'success';
    res.redirect('/new');

  } catch (error) {
    const error_message = error.response?.data?.message || error.message || 'Failed to submit resource.';
    console.error("[FRONTEND][ERROR]: while submitting new resource:", error.response ? JSON.stringify(error.response.data) : error.message);
    if (error.response && error.response.status === 401) {
        req.session.destroy(() => res.redirect('/login?message=Session expired. Please log in again.&messageType=error'));
        return;
    }
    const form_Data = { ...req.body, tags: req.body.tags || '' };
    if (files && files.length > 0) {
        form_Data.fileNames = files.map(f => f.originalname).join(', ');
    }

    res.render('new-item', {
      title: 'New item',
      message: `[ERROR]: failed to submit resource: ${error_message}`,
      messageType: 'error',
      formData: form_Data,
      backendBaseUrl: BACKEND_API_URL,
      definedResourceTypes: resource_types,
      suggestedTags: suggested_tags,
      selectedResourceType: req.body.resourceType || ''
    });
  } finally {
    for (const file of files) {
      if (file && file.path) {
        try { await fsPromises.unlink(file.path); } catch (e) { console.warn("ERROR unlinking frontend temporary file:", e.message)}
      }
    }
    if (temp_ZIP_path) {
      try { await fsPromises.unlink(temp_ZIP_path); } catch (e) { console.warn("ERROR unlinking frontend temporary SIP:", e.message)}
    }
  }
});

router.get('/', async (req, res, next) => {
  try {
    const public_axios = axios.create({ baseURL: BACKEND_API_URL });
    const type = req.query.resourceType || '';
    const query_params = {};
    if (type) {
      query_params.resourceType = type;
    }

    const response = await public_axios.get(`/data/resources`, { params: query_params });
    const news_response = await public_axios.get('/news/public');

    res.render('timeline', {
      title: 'Timeline',
      resources: response.data,
      newsItems: news_response.data,
      backendBaseUrl: BACKEND_API_URL,
      currentUser: req.session.user,
      isAuthenticated: req.session.isAuthenticated,
      definedResourceTypes: resource_types,
      selectedResourceType: type
    });
  } catch (error) {
    const error_message = error.response ? JSON.stringify(error.response.data) : error.message;
    console.error("[FRONTEND][ERROR]: while fetching public timeline/news:", error_message);
    res.render('timeline', {
        title: 'Timeline',
        resources: [],
        newsItems: [],
        error: `Could not fetch public content. ${error_message}`,
        backendBaseUrl: BACKEND_API_URL,
        currentUser: req.session.user,
        isAuthenticated: req.session.isAuthenticated,
        definedResourceTypes: resource_types,
        selectedResourceType: ''
    });
  }
});

router.get('/edit/:id', ensure_authenticated, async (req, res, next) => {
  const resourceID = req.params.id;
  try {
    const query_params = { ...req.query };
    const type = req.query.resourceType;

    const response = await axios_instance.get(`/data/resources/${resourceID}`, getAuthConfig(req));
    let resource_data = response.data;

    if (resource_data.tags && Array.isArray(resource_data.tags)) {
        resource_data.tags = resource_data.tags.join(', ');
    }

    let form = { ...resource_data, ...query_params };
    if (type) {
        form.resourceType = type;
    }

    res.render('edit-item', {
      title: 'Edit item',
      resource: form,
      backendBaseUrl: BACKEND_API_URL,
      currentUser: req.session.user,
      definedResourceTypes: resource_types,
      suggestedTags: suggested_tags,
      selectedResourceType: form.resourceType
    });
  } catch (error) {
    const error_message = error.response?.data?.message || `Could not fetch resource ${resourceID} for editing.`;
    console.error(`[FRONTEND][ERROR]: while fetching resource ${resourceID} for editing:`, error_message);
    if (error.response && error.response.status === 401) {
        req.session.destroy(() => res.redirect('/login?message=Session expired. Please log in again.&messageType=error'));
        return;
    }
    req.session.message = error_message;
    req.session.messageType = 'error';
    res.redirect('/profile');
  }
});

router.post('/edit/:id', ensure_authenticated, async (req, res, next) => {
    const resourceID = req.params.id;
    const update_data = {
        title: req.body.title,
        resourceType: req.body.resourceType,
        creationDate: req.body.creationDate ? new Date(req.body.creationDate).toISOString() : undefined,
        producer: req.body.producer,
        isPublic: req.body.isPublic === 'on' || req.body.isPublic === 'true',
        description: req.body.description,
        tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : undefined,
    };

    update_data.customFields = extractCustomFieldsFromRequest(req.body);

    Object.keys(update_data).forEach(key => {
      if (update_data[key] === undefined) {
          delete update_data[key];
      }
    });
    if (!update_data.hasOwnProperty('customFields')) {
        update_data.customFields = {};
    }

    try {
        const response = await axios_instance.put(`/data/resources/${resourceID}`, update_data, getAuthConfig(req));
        req.session.message = `Resource "${response.data.title}" updated successfully!`;
        req.session.messageType = 'success';
        if (req.session.user && req.session.user.level === 'admin') {
          res.redirect('/admin/resources');
        } else {
          res.redirect('/profile');
        } 
    } catch (error) {
        const error_message = error.response?.data?.message || 'Failed to update resource.';
        console.error(`[FRONTEND][ERROR]: while updating resource ${resourceID}:`, error_message);
        if (error.response && error.response.status === 401) {
            req.session.destroy(() => res.redirect('/login?message=Session expired. Please log in again.&messageType=error'));
            return;
        }
        try {
            const response = await axios_instance.get(`/data/resources/${resourceID}`, getAuthConfig(req));
            let resource_data = response.data;

            if (resource_data.tags && Array.isArray(resource_data.tags)) {
                resource_data.tags = resource_data.tags.join(', ');
            }
            const form = { ...resource_data, ...req.body };

            res.render('edit-item', {
                title: 'Edit item',
                resource: form,
                message: `[ERROR] ${error_message}`,
                messageType: 'error',
                backendBaseUrl: BACKEND_API_URL,
                currentUser: req.session.user,
                definedResourceTypes: resource_types,
                suggestedTags: suggested_tags,
                selectedResourceType: form.resourceType
            });
        } catch (fetchError) {
            req.session.message = `Update failed: ${error_message}. Additionally, could not reload resource details.`;
            req.session.messageType = 'error';
            if (req.session.user && req.session.user.level === 'admin') {
              res.redirect('/admin/resources');
            } else {
              res.redirect('/profile');
            }  
        }
    }
});

router.post('/delete/:id', ensure_authenticated, async (req, res, next) => {
    const resourceID = req.params.id;
    try {
        await axios_instance.delete(`/data/resources/${resourceID}`, getAuthConfig(req));
        req.session.message = `Resource deleted successfully.`;
        req.session.messageType = 'success';
        if (req.session.user && req.session.user.level === 'admin') {
          res.redirect('/admin/resources');
        } else {
          res.redirect('/profile');
        }  
    } catch (error) {
        const error_message = error.response?.data?.message || 'Failed to delete resource.';
        console.error(`[FRONTEND][ERROR] Deleting resource ${resourceID}:`, error_message);
        if (error.response && error.response.status === 401) {
            req.session.destroy(() => res.redirect('/login?message=Session expired. Please log in again.&messageType=error'));
            return;
        }
        req.session.message = `[ERROR] ${error_message}`;
        req.session.messageType = 'error';
        if (req.session.user && req.session.user.level === 'admin') {
          res.redirect('/admin/resources');
        } else {
          res.redirect('/profile');
        }  
    }
});

router.get('/login', (req, res) => {
  if (req.session.isAuthenticated) return res.redirect(req.session.user.level === 'admin' ? '/admin' : '/profile');
  const message = req.session.message || req.query.message;
  const message_type = req.session.messageType || req.query.messageType;
  delete req.session.message; delete req.session.messageType;
  res.render('login', { title:'Login', backendBaseUrl: BACKEND_API_URL, message: message, messageType: message_type });
});

router.get('/register', (req, res) => {
  if (req.session.isAuthenticated) return res.redirect(req.session.user.level === 'admin' ? '/admin' : '/profile');
  const message = req.session.message;
  const message_type = req.session.messageType;
  delete req.session.message; delete req.session.messageType;
  const levels = ['consumer', 'producer'];
  res.render('register', { title:'Register', backendBaseUrl: BACKEND_API_URL, message: message, messageType: message_type, levels: levels, formData: {} });
});

router.get('/download/resource/:resourceId/file/:storageName/:originalName', ensure_authenticated, async (req, res, next) => {
  try {
    const { resourceId, storageName, originalName } = req.params;
    const backendURL = `${BACKEND_API_URL}/data/resources/${resourceId}/files/${storageName}`;
    const response = await axios_instance({
      method: 'GET',
      url: backendURL,
      responseType: 'stream',
      headers: getAuthConfig(req).headers
    });
    res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
    if (response.headers['content-type']) {
         res.setHeader('Content-Type', response.headers['content-type']);
    }
    response.data.pipe(res);
  } catch (error) {
    console.error('[FRONTEND][ERROR]: downloading single file:', error.response ? (error.response.data.message || error.response.data) : error.message);
     if (error.response && error.response.status === 401) {
        req.session.destroy(() => res.status(401).send("Session expired. Please log in again."));
        return;
    }
    res.status(error.response ? error.response.status : 500).send("ERROR downloading file.");
  }
});

router.get('/download/resource/:resourceId/dip', ensure_authenticated, async (req, res, next) => {
  try {
    const { resourceId } = req.params;
    const backendDIPURL = `${BACKEND_API_URL}/data/resources/${resourceId}/dip`;
    let dIP_filename = `DIP_${resourceId}.zip`;
    try {
        const response = await axios_instance.get(`/data/resources/${resourceId}`, getAuthConfig(req));
        if (response.data && response.data.title) {
            const title = response.data.title.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
            dIP_filename = `DIP_${title || resourceId}.zip`;
        }
    } catch (detailError) {
        console.warn(`[FRONTEND] Could not fetch resource details for DIP filename for ${resourceId}:`, detailError.message);
    }

    const response = await axios_instance({
      method: 'GET',
      url: backendDIPURL,
      responseType: 'stream',
      headers: getAuthConfig(req).headers
    });
    res.setHeader('Content-Disposition', `attachment; filename="${dIP_filename}"`);
    res.setHeader('Content-Type', 'application/zip');
    response.data.pipe(res);
  } catch (error) {
    console.error('[FRONTEND][ERROR]: downloading DIP:', error.response ? (error.response.data.message || error.response.data) : error.message);
    if (error.response && error.response.status === 401) {
        req.session.destroy(() => res.status(401).send("Session expired. Please log in again."));
        return;
    }
    res.status(error.response ? error.response.status : 500).send("ERROR downloading DIP.");
  }
});

router.get('/admin', ensure_admin, (req, res) => {
  const message = req.session.message;
  const message_type = req.session.messageType;
  delete req.session.message;
  delete req.session.messageType;
  res.render('admin-dashboard', { title: 'Dashboard', backendBaseUrl: BACKEND_API_URL, message, messageType: message_type });
});

router.get('/admin/users', ensure_admin, async (req, res) => {
  try {
    const response = await axios_instance.get('/admin/users', getAuthConfig(req));
    const message = req.session.message; delete req.session.message;
    const message_type = req.session.messageType; delete req.session.messageType;
    res.render('admin-users', { title: 'Manage users', users: response.data, backendBaseUrl: BACKEND_API_URL, message, messageType: message_type });
  } catch (error) {
    console.error('[FRONTEND][ERROR] Fetching users for admin:', error.message);
    if (error.response && error.response.status === 401) {
        req.session.destroy(() => res.redirect('/login?message=Session expired. Please log in again.&messageType=error'));
        return;
    }
    res.render('admin-users', { title: 'Manage users', users: [], error: 'Failed to fetch users.', backendBaseUrl: BACKEND_API_URL });
  }
});

router.get('/admin/users/new', ensure_admin, (req, res) => {
    res.render('admin-edit-user', { title: 'Add new user', userToEdit: {}, action: '/admin/users/new', levels: ['consumer', 'producer', 'admin'], backendBaseUrl: BACKEND_API_URL });
});

router.post('/admin/users/new', ensure_admin, async (req, res) => {
    try {
        await axios_instance.post('/admin/users', req.body, getAuthConfig(req));
        req.session.message = 'User created successfully.';
        req.session.messageType = 'success';
        res.redirect('/admin/users');
    } catch (error) {
        const error_msg = error.response?.data?.message || 'Failed to create user.';
        console.error('[FRONTEND][ERROR] Creating user by admin:', error_msg);
        if (error.response && error.response.status === 401) {
            req.session.destroy(() => res.redirect('/login?message=Session expired. Please log in again.&messageType=error'));
            return;
        }
        res.render('admin-edit-user', { title: 'Add new user', userToEdit: req.body, action: '/admin/users/new', error: error_msg, levels: ['consumer', 'producer', 'admin'], backendBaseUrl: BACKEND_API_URL });
    }
});

router.get('/admin/users/edit/:id', ensure_admin, async (req, res) => {
  try {
    const response = await axios_instance.get(`/admin/users/${req.params.id}`, getAuthConfig(req));
    res.render('admin-edit-user', { title: 'Edit user', userToEdit: response.data, action: `/admin/users/edit/${req.params.id}`, levels: ['consumer', 'producer', 'admin'], backendBaseUrl: BACKEND_API_URL });
  } catch (error) {
    if (error.response && error.response.status === 401) {
        req.session.destroy(() => res.redirect('/login?message=Session expired. Please log in again.&messageType=error'));
        return;
    }
    req.session.message = 'Failed to fetch user for editing.';
    req.session.messageType = 'error';
    res.redirect('/admin/users');
  }
});

router.post('/admin/users/edit/:id', ensure_admin, async (req, res) => {
  try {
    await axios_instance.put(`/admin/users/${req.params.id}`, req.body, getAuthConfig(req));
    req.session.message = 'User updated successfully.';
    req.session.messageType = 'success';
    res.redirect('/admin/users');
  } catch (error) {
    const error_msg = error.response?.data?.message || 'Failed to update user.';
    if (error.response && error.response.status === 401) {
        req.session.destroy(() => res.redirect('/login?message=Session expired. Please log in again.&messageType=error'));
        return;
    }
    res.render('admin-edit-user', { title: 'Edit user', userToEdit: {...req.body, _id: req.params.id}, action: `/admin/users/edit/${req.params.id}`, error: error_msg, levels: ['consumer', 'producer', 'admin'], backendBaseUrl: BACKEND_API_URL });
  }
});

router.post('/admin/users/delete/:id', ensure_admin, async (req, res) => {
  try {
    await axios_instance.delete(`/admin/users/${req.params.id}`, getAuthConfig(req));
    req.session.message = 'User deleted successfully.';
    req.session.messageType = 'success';
  } catch (error) {
    if (error.response && error.response.status === 401) {
        req.session.destroy(() => res.redirect('/login?message=Session expired. Please log in again.&messageType=error'));
        return;
    }
    req.session.message = error.response?.data?.message || 'Failed to delete user.';
    req.session.messageType = 'error';
  }
  res.redirect('/admin/users');
});

router.get('/admin/news', ensure_admin, async (req, res) => {
  try {
    const response = await axios_instance.get('/admin/news', getAuthConfig(req));
    const message = req.session.message; delete req.session.message;
    const message_type = req.session.messageType; delete req.session.messageType;
    res.render('admin-news', { title: 'Manage news', newsItems: response.data, backendBaseUrl: BACKEND_API_URL, message, messageType: message_type });
  } catch (error) {
    if (error.response && error.response.status === 401) {
        req.session.destroy(() => res.redirect('/login?message=Session expired. Please log in again.&messageType=error'));
        return;
    }
    res.render('admin-news', { title: 'Manage news', newsItems: [], error: 'Failed to fetch news items.', backendBaseUrl: BACKEND_API_URL });
  }
});

router.get('/admin/news/new', ensure_admin, (req, res) => {
  res.render('admin-edit-news', { title: 'Create news item', newsItem: {}, action: '/admin/news/new', backendBaseUrl: BACKEND_API_URL });
});

router.post('/admin/news/new', ensure_admin, async (req, res) => {
  try {
    const news_data = { ...req.body, isVisible: req.body.isVisible === 'on' };
    await axios_instance.post('/admin/news', news_data, getAuthConfig(req));
    req.session.message = 'News item created successfully.';
    req.session.messageType = 'success';
    res.redirect('/admin/news');
  } catch (error) {
    if (error.response && error.response.status === 401) {
        req.session.destroy(() => res.redirect('/login?message=Session expired. Please log in again.&messageType=error'));
        return;
    }
    const error_msg = error.response?.data?.message || 'Failed to create news item.';
    res.render('admin-edit-news', { title: 'Create news item', newsItem: req.body, action: '/admin/news/new', error: error_msg, backendBaseUrl: BACKEND_API_URL });
  }
});

router.get('/admin/news/edit/:id', ensure_admin, async (req, res) => {
  try {
    const response = await axios_instance.get(`/admin/news/${req.params.id}`, getAuthConfig(req));
    res.render('admin-edit-news', { title: 'Edit News Item', newsItem: response.data, action: `/admin/news/edit/${req.params.id}`, backendBaseUrl: BACKEND_API_URL });
  } catch (error) {
    if (error.response && error.response.status === 401) {
        req.session.destroy(() => res.redirect('/login?message=Session expired. Please log in again.&messageType=error'));
        return;
    }
    req.session.message = 'Failed to fetch news item for editing.';
    req.session.messageType = 'error';
    res.redirect('/admin/news');
  }
});

router.post('/admin/news/edit/:id', ensure_admin, async (req, res) => {
  try {
    const news_data = { ...req.body, isVisible: req.body.isVisible === 'on' };
    await axios_instance.put(`/admin/news/${req.params.id}`, news_data, getAuthConfig(req));
    req.session.message = 'News item updated successfully.';
    req.session.messageType = 'success';
    res.redirect('/admin/news');
  } catch (error) {
    if (error.response && error.response.status === 401) {
        req.session.destroy(() => res.redirect('/login?message=Session expired. Please log in again.&messageType=error'));
        return;
    }
    const error_msg = error.response?.data?.message || 'Failed to update news item.';
    res.render('admin-edit-news', { title: 'Edit news item', newsItem: {...req.body, _id: req.params.id}, action: `/admin/news/edit/${req.params.id}`, error: error_msg, backendBaseUrl: BACKEND_API_URL });
  }
});

router.post('/admin/news/delete/:id', ensure_admin, async (req, res) => {
  try {
    await axios_instance.delete(`/admin/news/${req.params.id}`, getAuthConfig(req));
    req.session.message = 'News item deleted successfully.';
    req.session.messageType = 'success';
  } catch (error) {
    if (error.response && error.response.status === 401) {
        req.session.destroy(() => res.redirect('/login?message=Session expired. Please log in again.&messageType=error'));
        return;
    }
    req.session.message = 'Failed to delete news item.';
    req.session.messageType = 'error';
  }
  res.redirect('/admin/news');
});

router.post('/admin/news/toggle/:id', ensure_admin, async (req, res) => {
    try {
        await axios_instance.patch(`/admin/news/${req.params.id}/visibility`, {}, getAuthConfig(req));
        req.session.message = 'News item visibility toggled.';
        req.session.messageType = 'success';
    } catch (error) {
        if (error.response && error.response.status === 401) {
            req.session.destroy(() => res.redirect('/login?message=Session expired. Please log in again.&messageType=error'));
            return;
        }
        req.session.message = 'Failed to toggle news item visibility.';
        req.session.messageType = 'error';
    }
    res.redirect('/admin/news');
});

router.get('/admin/resources', ensure_admin, async (req, res) => {
  try {
    const response = await axios_instance.get('/admin/resources', getAuthConfig(req));
    const message = req.session.message; delete req.session.message;
    const message_type = req.session.messageType; delete req.session.messageType;
    res.render('admin-resources', { title: 'Manage resources', resources: response.data, backendBaseUrl: BACKEND_API_URL, message, messageType: message_type });
  } catch (error) {
    if (error.response && error.response.status === 401) {
        req.session.destroy(() => res.redirect('/login?message=Session expired. Please log in again.&messageType=error'));
        return;
    }
    console.error('[FRONTEND][ERROR] Fetching all resources for admin:', error.message);
    res.render('admin-resources', { title: 'Manage resources', resources: [], error: 'Failed to fetch resources.', backendBaseUrl: BACKEND_API_URL });
  }
});

router.get('/admin/statistics', ensure_admin, async (req, res) => {
  try {
    const response = await axios_instance.get('/admin/statistics', getAuthConfig(req));
    res.render('admin-stats', { title: 'Statistics', stats: response.data, backendBaseUrl: BACKEND_API_URL });
  } catch (error) {
    if (error.response && error.response.status === 401) {
        req.session.destroy(() => res.redirect('/login?message=Session expired. Please log in again.&messageType=error'));
        return;
    }
    console.error('[FRONTEND][ERROR] Fetching statistics for admin:', error.message);
    res.render('admin-stats', { title: 'Statistics', stats: null, error: 'Failed to fetch statistics.', backendBaseUrl: BACKEND_API_URL });
  }
});

module.exports = router;