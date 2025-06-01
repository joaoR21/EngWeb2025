const Resource = require('../models/resource');
const User = require('../models/user');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const jszip = require('jszip');
const crypto = require('crypto');

const filestore_path = path.join(__dirname, '..', 'filestore');

fs.mkdir(filestore_path, { recursive: true }).catch(err => {
    if (err.code !== 'EEXIST') console.error('[ERROR]: failed to create filestore directory:', err);
});

async function generateSHA256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function validateBAGITBag(zip) {
  const req_files = ['bagit.txt', 'manifest-sha256.txt', 'tagmanifest-sha256.txt', 'bag-info.txt'];
  const req_dirs = ['data/'];

  for (const name of req_files) {
    if (!zip.file(name)) throw new Error(`BagIt validation failed: missing file "${name}"`);
  }

  for (const name of req_dirs) {
    let dir_exists = zip.files[name] && zip.files[name].dir;
    if (!dir_exists) {
      dir_exists = Object.keys(zip.files).some(f => f.startsWith(name) && !zip.files[f].dir);
    }
    if (!dir_exists) throw new Error(`BAGIT validation failed: missing folder or files in "${name}"`);
  }
  
  const payload_content = await zip.file('manifest-sha256.txt').async('string');
  for (const line of payload_content.trim().split('\n').filter(Boolean)) {
    const parts = line.trim().match(/^([a-f0-9]+)\s+(.+)$/);
    if (!parts || parts.length < 3) continue;
    const expected_hash = parts[1];
    const filepath_ZIP = parts[2].trim();
    const file_entry = zip.file(filepath_ZIP);
    if (!file_entry) throw new Error(`BAGIT validation failed: data file "${filepath_ZIP}" listed in manifest-sha256.txt is missing from ZIP.`);
    const content = await file_entry.async('nodebuffer');
    const actual_hash = crypto.createHash('sha256').update(content).digest('hex');
    if (actual_hash !== expected_hash) throw new Error(`BAGIT validation failed: checksum mismatch for "${filepath_ZIP}". Expected ${expected_hash}, got ${actual_hash}`);
  }

  const tag_manifest_content = await zip.file('tagmanifest-sha256.txt').async('string');
  for (const line of tag_manifest_content.trim().split('\n').filter(Boolean)) {
    const parts = line.trim().match(/^([a-f0-9]+)\s+(.+)$/);
    if (!parts || parts.length < 3) continue;
    const expected_hash = parts[1];
    const tag_filepath = parts[2].trim();
    const tag_fileentry = zip.file(tag_filepath);
    if (!tag_fileentry) {
      if (tag_filepath === 'manifesto-SIP.json' && !(zip.file('manifesto-SIP.json') || zip.file('metadata/manifesto-SIP.json'))) continue;
      if (tag_filepath === 'metadata/manifesto-SIP.json' && !zip.file('metadata/manifesto-SIP.json')) continue;
      throw new Error(`BAGIT validation failed: tag file "${tag_filepath}" listed in tagmanifest-sha256.txt is missing from ZIP.`);
    }
    const content = await tag_fileentry.async('nodebuffer');
    const actual_hash = crypto.createHash('sha256').update(content).digest('hex');
    if (actual_hash !== expected_hash) throw new Error(`BAGIT validation failed: checksum mismatch for tag file "${tag_filepath}". Expected ${expected_hash}, got ${actual_hash}`);
  }
}

exports.ingest_resource = async (sIP_object, ownerID, user_level) => {
  if (!user_level || (user_level !== 'producer' && user_level !== 'admin')) {
      const err = new Error('FORBIDDEN: You do not have permission to create resources.');
      err.status = 403;
      if (sIP_object && sIP_object.path) {
          await fs.unlink(sIP_object.path).catch(e => console.warn("Error unlinking SIP on permission denial:", e.message));
      }
      throw err;
  }

  if (!ownerID) {
      const err = new Error('ownerID is required to ingest a resource.');
      err.status = 400;
      if (sIP_object && sIP_object.path) {
          await fs.unlink(sIP_object.path).catch(e => console.warn("Error unlinking SIP on ownerID error:", e.message));
      }
      throw err;
  }
  
  const tempSIP_path = sIP_object.path;
  let manifest_data = {};
  let extracted_fileobjects_metadata = [];
  const resourceID = new mongoose.Types.ObjectId();
  const resource_dir_path = path.join(filestore_path, resourceID.toString());
  const temp_extracted_paths = [];

  try {
    const zip_data = await fs.readFile(tempSIP_path);
    const zip = await jszip.loadAsync(zip_data);
    await validateBAGITBag(zip);

    let manifest_fileentry = zip.file('manifesto-SIP.json') || zip.file('metadata/manifesto-SIP.json');
    if (!manifest_fileentry) {
        throw new Error('SIP manifest file (manifesto-SIP.json or metadata/manifesto-SIP.json) not found in the ZIP.');
    }
    const manifest_content = await manifest_fileentry.async('string');
    manifest_data = JSON.parse(manifest_content);
    
    const files_from_manifest = manifest_data.files || [];
    await fs.mkdir(resource_dir_path, { recursive: true });

    for (const file_info_manifest of files_from_manifest) {
      const zip_entry = zip.file(file_info_manifest.pathInZip);
      if (!zip_entry) {
          throw new Error(`File "${file_info_manifest.pathInZip}" (original name: "${file_info_manifest.originalName}") listed in SIP manifest not found in ZIP.`);
      }
      const file_content_buffer = await zip_entry.async('nodebuffer');
      const unique_storagename = `${uuidv4()}-${file_info_manifest.originalName}`;
      const new_filepath_filestore = path.join(resource_dir_path, unique_storagename);
      
      await fs.writeFile(new_filepath_filestore, file_content_buffer);
      temp_extracted_paths.push(new_filepath_filestore);

      const actual_checksum = file_info_manifest.checksum || await generateSHA256(file_content_buffer);
      if (file_info_manifest.checksum && file_info_manifest.checksum !== actual_checksum) {
          console.warn(`[WARNING]: checksum mismatch for ${file_info_manifest.originalName}. manifest: ${file_info_manifest.checksum}, actual: ${actual_checksum}. Using actual checksum.`);
      }

      extracted_fileobjects_metadata.push({
        originalName: file_info_manifest.originalName,
        storageName: unique_storagename,
        path: path.relative(filestore_path, new_filepath_filestore),
        mimetype: file_info_manifest.mimetype || 'application/octet-stream',
        size: file_info_manifest.size || file_content_buffer.length,
        checksum: actual_checksum
      });
    }

    const submitterUser = await User.findById(ownerID);

    const resourceToSave = new Resource({
      _id: resourceID,
      title: manifest_data.title || 'untitled resource',
      resourceType: manifest_data.resourceType || 'unknown',
      creationDate: manifest_data.creationDate ? new Date(manifest_data.creationDate) : new Date(),
      submissionDate: new Date(),
      producer: manifest_data.producer,
      ownerID: new mongoose.Types.ObjectId(ownerID),
      isPublic: manifest_data.isPublic !== undefined ? manifest_data.isPublic : false,
      description: manifest_data.description,
      tags: manifest_data.tags || [],
      associatedFiles: extracted_fileobjects_metadata,
      customFields: manifest_data.customFields || {}
    });

    const saved = await resourceToSave.save();
    console.log(`[SUCCESS]: resource ${saved._id} ingested by user ${ownerID}.`);
    return saved;

  } catch (error) {
    console.error("[ERROR]: ingesting resource:", error.message, error.stack);
    for (const extracted_path of temp_extracted_paths) {
        await fs.unlink(extracted_path).catch(e => console.warn(`Error unlinking extracted file ${extracted_path} on error:`, e.message));
    }
    await fs.rmdir(resource_dir_path).catch(e => {
        if (e.code !== 'ENOENT') console.warn(`ERROR removing resource directory ${resource_dir_path} on error:`, e.message);
    });
    throw error;
  }
};

exports.listResources = async (queryParams = {}, requestingUserID = null, isProfileOrAdminView = false) => {
  try {
    let filter = {};
    const { forAdmin, customFields, resourceType, ...otherQueryParams } = queryParams;

    if (forAdmin && requestingUserID) {
        filter = { ...otherQueryParams };
    } else if (isProfileOrAdminView && requestingUserID) {
        filter.ownerID = new mongoose.Types.ObjectId(requestingUserID);
        filter = { ...filter, ...otherQueryParams };
    } else {
        filter.isPublic = true;
        filter = { ...filter, ...otherQueryParams };
    }

    if (resourceType) {
        filter.resourceType = resourceType;
    }
    
    if (customFields && typeof customFields === 'object') {
        for (const key in customFields) {
            if (Object.hasOwnProperty.call(customFields, key)) {
                const fieldName = `customFields.${key.replace(/_gte|_lte|_gt|_lt$/, '')}`;
                const value = customFields[key];

                if (value === '' || value === null || value === undefined) continue;

                if (key.endsWith('_gte')) {
                    if (!filter[fieldName]) filter[fieldName] = {};
                    filter[fieldName].$gte = parseFloat(value);
                } else if (key.endsWith('_lte')) {
                    if (!filter[fieldName]) filter[fieldName] = {};
                    filter[fieldName].$lte = parseFloat(value);
                } else if (key.endsWith('_gt')) {
                    if (!filter[fieldName]) filter[fieldName] = {};
                    filter[fieldName].$gt = parseFloat(value);
                } else if (key.endsWith('_lt')) {
                    if (!filter[fieldName]) filter[fieldName] = {};
                    filter[fieldName].$lt = parseFloat(value);
                } else {
                    filter[`customFields.${key}`] = value;
                }
            }
        }
    }

    const resources = await Resource.find(filter)
                                        .sort({ submissionDate: -1 })
                                        .populate('ownerID', 'username');
    return resources;
  } catch (error) {
    console.error("[ERROR]: while listing resources:", error.message, error.stack);
    throw error;
  }
};

exports.getResourceByID = async (resourceID) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(resourceID)) {
        return null;
    }
    const resource = await Resource.findById(resourceID).populate('ownerID', 'username');
    return resource;
  } catch (error) {
    console.error(`[ERROR]: finding resource ${resourceID}:`, error.message, error.stack);
    throw error;
  }
};

exports.getAssociatedFileDetails = async (resourceID, storage_name) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(resourceID)) {
            return null;
        }
        const resource = await Resource.findById(resourceID);
        if (!resource) {
            return null;
        }
        const file_info = resource.associatedFiles.find(f => f.storageName === storage_name);
        if (!file_info) {
            return null;
        }
        const file_path_absolute = path.join(filestore_path, file_info.path);
        return {
            filePath: file_path_absolute,
            originalName: file_info.originalName,
            mimetype: file_info.mimetype,
        };
    } catch (error) {
        console.error(`[ERROR]: getting file details for resource ${resourceID}, file ${storage_name}:`, error.message, error.stack);
        throw error;
    }
};

exports.generateDIPForResource = async (resourceID) => {
  if (!mongoose.Types.ObjectId.isValid(resourceID)) {
    return null;
  }
  const resource = await Resource.findById(resourceID).populate('ownerID', 'username');
  if (!resource) {
    return null;
  }

  const zip = new jszip();
  const DIP_manifest = {
    _id: resource._id.toString(),
    title: resource.title,
    resourceType: resource.resourceType,
    creationDate: resource.creationDate ? resource.creationDate.toISOString() : new Date().toISOString(),
    submissionDate: resource.submissionDate ? resource.submissionDate.toISOString() : new Date().toISOString(),
    producer: resource.producer,
    ownerID: resource.ownerID ? resource.ownerID.username : 'unknown owner',
    isPublic: resource.isPublic,
    description: resource.description,
    tags: resource.tags,
    customFields: resource.customFields ? Object.fromEntries(resource.customFields) : {},
    files: []
  };
  const data_dir = zip.folder('data');
  const payload_manifestL = [];
  let payload_bytes = 0;

  for (const file_info of resource.associatedFiles) {
    const filepath_filestore_absolute = path.join(filestore_path, file_info.path);
    try {
      const file_content = await fs.readFile(filepath_filestore_absolute);
      data_dir.file(file_info.originalName, file_content);

      const hash = file_info.checksum || await generateSHA256(file_content);
      payload_manifestL.push(`${hash}  data/${file_info.originalName}`);
      payload_bytes += file_info.size;

      DIP_manifest.files.push({
        pathInZip: `data/${file_info.originalName}`,
        originalName: file_info.originalName,
        mimetype: file_info.mimetype,
        size: file_info.size,
        checksum: hash
      });
    } catch (err) {
      console.error(`[ERROR]: reading file ${file_info.originalName} for resource ${resourceID}:`, err.message);
    }
  }

  zip.file('manifesto-DIP.json', JSON.stringify(DIP_manifest, null, 2));
  zip.file('bagit.txt', 'BagIt-Version: 0.97\nTag-File-Character-Encoding: UTF-8');
  zip.file('manifest-sha256.txt', payload_manifestL.join('\n'));

  const bag_info_content = [
    `Source-Organization: ${resource.producer || 'unknown producer'} (exported from DIGITAL ME)`,
    `Bagging-Date: ${new Date().toISOString().slice(0,10)}`,
    `Payload-Oxum: ${payload_bytes}.${DIP_manifest.files.length}`,
    `Bag-Software-Agent: DIGITAL ME app v1.0 (DIP Exporter)`,
    `External-Identifier: ${resource._id.toString()}`
  ].join('\n');
  zip.file('bag-info.txt', bag_info_content);

  const tag_files_to_manifest = ['bagit.txt', 'manifest-sha256.txt', 'bag-info.txt', 'manifesto-DIP.json'];
  const tag_Lines = [];
  for (const tag_filename of tag_files_to_manifest) {
    const tag_filecontent_entry = zip.file(tag_filename);
    if (tag_filecontent_entry) {
        const tag_filecontent_buffer = await tag_filecontent_entry.async('nodebuffer');
        const tag_filehash = await generateSHA256(tag_filecontent_buffer);
        tag_Lines.push(`${tag_filehash}  ${tag_filename}`);
    } else {
        console.warn(`[WARNING]: tag file ${tag_filename} not found in ZIP for tagmanifest generation.`);
    }
  }
  zip.file('tagmanifest-sha256.txt', tag_Lines.join('\n'));

  const DIPZip_buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  const sanitized_title = resource.title.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
  const DIP_filename = `DIP_${sanitized_title || resource._id}.zip`;

  return {
    fileName: DIP_filename,
    data: DIPZip_buffer
  };
};

exports.updateResource = async (resourceID, updated_data, requestingUserID, requestingUserLevel = 'consumer') => {
  if (!mongoose.Types.ObjectId.isValid(resourceID)) {
    return null;
  }
  if (!requestingUserID) {
      const err = new Error("Requesting user ID is required for update operation.");
      err.status = 401;
      throw err;
  }

  try {
    const resource = await Resource.findById(resourceID);
    if (!resource) {
      return null;
    }

    const is_owner = resource.ownerID.toString() === requestingUserID.toString();
    const is_admin = requestingUserLevel === 'admin';

    if (!is_owner && !is_admin) {
      const err = new Error('FORBIDDEN: You do not have permission to update this resource.');
      err.status = 403;
      throw err;
    }

    const allowed_updates = ['title', 'resourceType', 'creationDate', 'producer', 'isPublic', 'description', 'tags', 'customFields'];
    const update_payload = {};

    for (const key of allowed_updates) {
        if (updated_data.hasOwnProperty(key)) {
            if (key === 'creationDate' && updated_data.creationDate) {
                update_payload[key] = new Date(updated_data.creationDate);
            } else if (key === 'customFields') {
                if (typeof updated_data.customFields === 'object' && updated_data.customFields !== null) {
                    update_payload[key] = updated_data.customFields;
                } else {
                    console.warn(`[WARN]: custom fields in update for ${resourceID} was not a valid object, skipping update for this field.`);
                }
            }
             else {
                update_payload[key] = updated_data[key];
            }
        }
    }


    if (Object.keys(update_payload).length === 0) {
        return resource;
    }

    const updatedResource = await Resource.findByIdAndUpdate(
      resourceID,
      { $set: update_payload },
      { new: true, runValidators: true }
    ).populate('ownerID', 'username');

    return updatedResource;
  } catch (error) {
    console.error(`[ERROR]: updating resource ${resourceID}:`, error.message, error.stack);
    throw error;
  }
};

exports.deleteResource = async (resourceID, requestingUserID, requestingUserLevel = 'consumer') => {
  if (!mongoose.Types.ObjectId.isValid(resourceID)) {
    return null;
  }
   if (!requestingUserID) {
      const err = new Error("Requesting user ID is required for delete operation.");
      err.status = 401;
      throw err;
  }

  try {
    const resource = await Resource.findById(resourceID);
    if (!resource) {
      return null;
    }

    const is_owner = resource.ownerID.toString() === requestingUserID.toString();
    const is_admin = requestingUserLevel === 'admin';

    if (!is_owner && !is_admin) {
      const err = new Error('FORBIDDEN: You do not have permission to delete this resource.');
      err.status = 403;
      throw err;
    }

    const folder_path = path.join(filestore_path, resource._id.toString());

    await Resource.findByIdAndDelete(resourceID);

    try {
      await fs.access(folder_path);
      await fs.rm(folder_path, { recursive: true, force: true });
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.warn(`[WARNING]: Could not remove folder ${folder_path} (it may not exist or an error occurred):`, error.message);
      }
    }

    console.log(`Successfully deleted resource ${resourceID} and its files.`);
    return { message:'Resource and associated files deleted successfully.', deletedResourceId: resourceID };

  } catch (error) {
    console.error(`[ERROR]: deleting resource ${resourceID}:`, error.message, error.stack);
    throw error;
  }
};
