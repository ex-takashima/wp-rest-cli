import { Command } from 'commander';
import { getResolvedProfile } from '../config.js';
import { WpApi } from '../api.js';
import { printOutput, stripHtml, truncate } from '../utils/output.js';
import { readFileSync } from 'node:fs';

const POST_COLUMNS = [
  { header: 'ID', value: r => r.id },
  { header: 'Title', value: r => truncate(stripHtml(r.title?.rendered || r.title), 50) },
  { header: 'Status', value: r => r.status },
  { header: 'Date', value: r => r.date?.slice(0, 10) || '' },
  { header: 'Link', value: r => r.link || '' },
];

const POST_DETAIL_COLUMNS = [
  { header: 'ID', value: r => r.id },
  { header: 'Title', value: r => stripHtml(r.title?.rendered || r.title) },
  { header: 'Status', value: r => r.status },
  { header: 'Date', value: r => r.date || '' },
  { header: 'Modified', value: r => r.modified || '' },
  { header: 'Link', value: r => r.link || '' },
  { header: 'Categories', value: r => (r.categories || []).join(', ') },
  { header: 'Tags', value: r => (r.tags || []).join(', ') },
  { header: 'Excerpt', value: r => truncate(stripHtml(r.excerpt?.rendered), 100) },
];

export function postCommand() {
  const cmd = new Command('post')
    .description('Manage WordPress posts');

  cmd
    .command('list')
    .description('List posts')
    .option('--profile <name>', 'Profile to use')
    .option('--format <format>', 'Output format: table or json', 'table')
    .option('--status <status>', 'Filter by status: publish, draft, pending, private', 'any')
    .option('--per-page <n>', 'Number of posts per page', '10')
    .option('--page <n>', 'Page number', '1')
    .option('--search <term>', 'Search term')
    .option('--category <id>', 'Filter by category ID')
    .option('--tag <id>', 'Filter by tag ID')
    .action(async (opts) => {
      try {
        const profile = getResolvedProfile(opts.profile);
        const api = new WpApi(profile);

        const params = {
          per_page: opts.perPage,
          page: opts.page,
          status: opts.status,
        };
        if (opts.search) params.search = opts.search;
        if (opts.category) params.categories = opts.category;
        if (opts.tag) params.tags = opts.tag;

        const posts = await api.listPosts(params);
        printOutput(posts, opts.format, POST_COLUMNS);
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  cmd
    .command('get <id>')
    .description('Get a single post')
    .option('--profile <name>', 'Profile to use')
    .option('--format <format>', 'Output format: table or json', 'table')
    .action(async (id, opts) => {
      try {
        const profile = getResolvedProfile(opts.profile);
        const api = new WpApi(profile);
        const post = await api.getPost(id);
        printOutput(post, opts.format, POST_DETAIL_COLUMNS);
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  cmd
    .command('create')
    .description('Create a new post')
    .requiredOption('--title <title>', 'Post title')
    .option('--content <content>', 'Post content (HTML)')
    .option('--content-file <path>', 'Read post content from file')
    .option('--status <status>', 'Post status: draft, publish, pending, private', 'draft')
    .option('--categories <ids>', 'Category IDs (comma-separated)')
    .option('--tags <ids>', 'Tag IDs (comma-separated)')
    .option('--thumbnail <mediaId>', 'Featured image media ID')
    .option('--excerpt <excerpt>', 'Post excerpt')
    .option('--slug <slug>', 'Post slug')
    .option('--profile <name>', 'Profile to use')
    .option('--format <format>', 'Output format: table or json', 'table')
    .action(async (opts) => {
      try {
        const profile = getResolvedProfile(opts.profile);
        const api = new WpApi(profile);

        const data = {
          title: opts.title,
          status: opts.status,
        };

        if (opts.contentFile) {
          data.content = readFileSync(opts.contentFile, 'utf8');
        } else if (opts.content) {
          data.content = opts.content;
        }

        if (opts.categories) data.categories = opts.categories.split(',').map(Number);
        if (opts.tags) data.tags = opts.tags.split(',').map(Number);
        if (opts.thumbnail) data.featured_media = Number(opts.thumbnail);
        if (opts.excerpt) data.excerpt = opts.excerpt;
        if (opts.slug) data.slug = opts.slug;

        const post = await api.createPost(data);
        console.log(`Post created successfully (ID: ${post.id})`);
        printOutput(post, opts.format, POST_DETAIL_COLUMNS);
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  cmd
    .command('update <id>')
    .description('Update an existing post')
    .option('--title <title>', 'Post title')
    .option('--content <content>', 'Post content (HTML)')
    .option('--content-file <path>', 'Read post content from file')
    .option('--status <status>', 'Post status')
    .option('--categories <ids>', 'Category IDs (comma-separated)')
    .option('--tags <ids>', 'Tag IDs (comma-separated)')
    .option('--thumbnail <mediaId>', 'Featured image media ID')
    .option('--excerpt <excerpt>', 'Post excerpt')
    .option('--slug <slug>', 'Post slug')
    .option('--profile <name>', 'Profile to use')
    .option('--format <format>', 'Output format: table or json', 'table')
    .action(async (id, opts) => {
      try {
        const profile = getResolvedProfile(opts.profile);
        const api = new WpApi(profile);

        const data = {};
        if (opts.title) data.title = opts.title;
        if (opts.status) data.status = opts.status;
        if (opts.contentFile) {
          data.content = readFileSync(opts.contentFile, 'utf8');
        } else if (opts.content) {
          data.content = opts.content;
        }
        if (opts.categories) data.categories = opts.categories.split(',').map(Number);
        if (opts.tags) data.tags = opts.tags.split(',').map(Number);
        if (opts.thumbnail) data.featured_media = Number(opts.thumbnail);
        if (opts.excerpt) data.excerpt = opts.excerpt;
        if (opts.slug) data.slug = opts.slug;

        if (Object.keys(data).length === 0) {
          console.error('Error: No fields to update. Specify at least one option.');
          process.exit(1);
        }

        const post = await api.updatePost(id, data);
        console.log(`Post updated successfully (ID: ${post.id})`);
        printOutput(post, opts.format, POST_DETAIL_COLUMNS);
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  cmd
    .command('delete <id>')
    .description('Delete a post')
    .option('--force', 'Skip trash and permanently delete', false)
    .option('--profile <name>', 'Profile to use')
    .option('--format <format>', 'Output format: table or json', 'table')
    .action(async (id, opts) => {
      try {
        const profile = getResolvedProfile(opts.profile);
        const api = new WpApi(profile);
        const result = await api.deletePost(id, opts.force);
        console.log(`Post deleted (ID: ${id})${opts.force ? ' permanently' : ' (moved to trash)'}.`);
        if (result) printOutput(result, opts.format, POST_DETAIL_COLUMNS);
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  return cmd;
}
