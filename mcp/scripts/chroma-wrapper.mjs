/**
 * Lightweight in-memory ChromaDB stub used when external services are unavailable.
 * Provides the subset of methods expected by MemoryStore.
 */

const collections = new Map();

function ensureCollection(name) {
  if (!collections.has(name)) {
    collections.set(name, { ids: [], documents: [], metadatas: [] });
  }
  return collections.get(name);
}

export const chroma = {
  async getCollection(name) {
    if (!collections.has(name)) {
      return { success: false, error: `Collection ${name} does not exist` };
    }
    return { success: true, collection: name };
  },

  async createCollection(name, _options = {}) {
    ensureCollection(name);
    return { success: true };
  },

  async addDocuments(name, ids, documents, metadatas) {
    const collection = ensureCollection(name);
    ids.forEach((id, idx) => {
      const existingIndex = collection.ids.indexOf(id);
      if (existingIndex !== -1) {
        collection.ids.splice(existingIndex, 1);
        collection.documents.splice(existingIndex, 1);
        collection.metadatas.splice(existingIndex, 1);
      }
      collection.ids.push(id);
      collection.documents.push(documents[idx]);
      collection.metadatas.push(metadatas[idx]);
    });
    return { success: true };
  },

  async peek(name, limit = 300) {
    const collection = ensureCollection(name);
    return {
      ids: collection.ids.slice(0, limit),
      documents: collection.documents.slice(0, limit),
      metadatas: collection.metadatas.slice(0, limit)
    };
  }
};

export default chroma;
