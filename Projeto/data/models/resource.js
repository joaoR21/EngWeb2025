const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const file_schema = new Schema({
  originalName: { type: String, required: true },
  storageName: { type: String, required: true, unique: true },
  path: { type: String, required: true },
  mimetype: { type: String, required: true },
  size: { type: Number, required: true },
  checksum: { type: String }
}, { _id: false });

const resource_schema = new Schema({
  title: { type: String, required: true, trim: true },
  resourceType: { type: String, required: true, index: true },
  creationDate: { type: Date },
  submissionDate: { type: Date, default: Date.now, index: true },
  producer: { type: String },
  ownerID: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  isPublic: { type: Boolean, default: false, index: true },
  description: { type: String, trim: true },
  tags: [{ type: String, trim: true, index: true }],
  associatedFiles: [file_schema],
  customFields: {
    type: Map,
    of: Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

resource_schema.methods.getCustomFieldsObject = function() {
  if (this.customFields && this.customFields instanceof Map) {
    return Object.fromEntries(this.customFields);
  }
  return {};
};

resource_schema.set('toJSON', {
  getters: true,
  transform: (doc, ret, options) => {
    if (ret.customFields && ret.customFields instanceof Map) {
      ret.customFields = Object.fromEntries(ret.customFields);
    }
    return ret;
  }
});

resource_schema.set('toObject', {
  getters: true,
  transform: (doc, ret, options) => {
    if (ret.customFields && ret.customFields instanceof Map) {
      ret.customFields = Object.fromEntries(ret.customFields);
    }
    return ret;
  }
});

const Resource = mongoose.model('Resource', resource_schema);
module.exports = Resource;
