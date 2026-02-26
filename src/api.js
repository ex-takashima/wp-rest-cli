import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { lookup } from 'node:dns/promises';

/**
 * WordPress REST API client
 */
export class WpApi {
  constructor(profile) {
    this.baseUrl = profile.url;
    this.auth = Buffer.from(`${profile.user}:${profile.password}`).toString('base64');
  }

  get headers() {
    return {
      'Authorization': `Basic ${this.auth}`,
      'Content-Type': 'application/json',
    };
  }

  async request(method, endpoint, body = null, customHeaders = null) {
    const url = `${this.baseUrl}/wp-json/wp/v2${endpoint}`;
    const options = {
      method,
      headers: customHeaders || this.headers,
    };

    if (body && !(body instanceof Buffer)) {
      options.body = JSON.stringify(body);
    } else if (body instanceof Buffer) {
      options.body = body;
    }

    const res = await fetch(url, options);

    if (!res.ok) {
      let errorMessage;
      try {
        const err = await res.json();
        errorMessage = err.message || res.statusText;
      } catch {
        errorMessage = res.statusText;
      }
      throw new Error(`API Error (${res.status}): ${errorMessage}`);
    }

    // DELETE may return empty body
    const text = await res.text();
    if (!text) return null;

    const data = JSON.parse(text);

    // Attach pagination headers
    data._total = res.headers.get('X-WP-Total');
    data._totalPages = res.headers.get('X-WP-TotalPages');

    return data;
  }

  // --- Posts ---

  async listPosts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request('GET', `/posts?${query}`);
  }

  async getPost(id) {
    return this.request('GET', `/posts/${id}`);
  }

  async createPost(data) {
    return this.request('POST', '/posts', data);
  }

  async updatePost(id, data) {
    return this.request('PUT', `/posts/${id}`, data);
  }

  async deletePost(id, force = false) {
    return this.request('DELETE', `/posts/${id}?force=${force}`);
  }

  // --- Pages ---

  async listPages(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request('GET', `/pages?${query}`);
  }

  async getPage(id) {
    return this.request('GET', `/pages/${id}`);
  }

  async createPage(data) {
    return this.request('POST', '/pages', data);
  }

  async updatePage(id, data) {
    return this.request('PUT', `/pages/${id}`, data);
  }

  async deletePage(id, force = false) {
    return this.request('DELETE', `/pages/${id}?force=${force}`);
  }

  // --- Media ---

  async listMedia(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request('GET', `/media?${query}`);
  }

  async uploadMedia(filePath, title = null) {
    const fileBuffer = readFileSync(filePath);
    const fileName = basename(filePath);

    const headers = {
      'Authorization': `Basic ${this.auth}`,
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
    };

    const result = await this.request('POST', '/media', fileBuffer, headers);
    if (title && result && result.id) {
      return this.request('PUT', `/media/${result.id}`, { title });
    }
    return result;
  }

  async deleteMedia(id, force = true) {
    return this.request('DELETE', `/media/${id}?force=${force}`);
  }

  // --- Categories ---

  async listCategories(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request('GET', `/categories?${query}`);
  }

  async createCategory(data) {
    return this.request('POST', '/categories', data);
  }

  async deleteCategory(id, force = true) {
    return this.request('DELETE', `/categories/${id}?force=${force}`);
  }

  // --- Tags ---

  async listTags(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request('GET', `/tags?${query}`);
  }

  async createTag(data) {
    return this.request('POST', '/tags', data);
  }

  async deleteTag(id, force = true) {
    return this.request('DELETE', `/tags/${id}?force=${force}`);
  }
}
