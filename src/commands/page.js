import { Command } from 'commander';
import { getResolvedProfile } from '../config.js';
import { WpApi } from '../api.js';
import { printOutput, stripHtml, truncate } from '../utils/output.js';
import { readFileSync } from 'node:fs';

const PAGE_COLUMNS = [
  { header: 'ID', value: r => r.id },
  { header: 'Title', value: r => truncate(stripHtml(r.title?.rendered || r.title), 50) },
  { header: 'Status', value: r => r.status },
  { header: 'Date', value: r => r.date?.slice(0, 10) || '' },
  { header: 'Link', value: r => r.link || '' },
];

const PAGE_DETAIL_COLUMNS = [
  { header: 'ID', value: r => r.id },
  { header: 'Title', value: r => stripHtml(r.title?.rendered || r.title) },
  { header: 'Status', value: r => r.status },
  { header: 'Parent', value: r => r.parent || 0 },
  { header: 'Order', value: r => r.menu_order || 0 },
  { header: 'Date', value: r => r.date || '' },
  { header: 'Modified', value: r => r.modified || '' },
  { header: 'Link', value: r => r.link || '' },
];

export function pageCommand() {
  const cmd = new Command('page')
    .description('Manage WordPress pages');

  cmd
    .command('list')
    .description('List pages')
    .option('--profile <name>', 'Profile to use')
    .option('--format <format>', 'Output format: table or json', 'table')
    .option('--status <status>', 'Filter by status', 'any')
    .option('--per-page <n>', 'Number of pages per page', '10')
    .option('--page <n>', 'Page number', '1')
    .option('--search <term>', 'Search term')
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

        const pages = await api.listPages(params);
        printOutput(pages, opts.format, PAGE_COLUMNS);
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  cmd
    .command('get <id>')
    .description('Get a single page')
    .option('--profile <name>', 'Profile to use')
    .option('--format <format>', 'Output format: table or json', 'table')
    .action(async (id, opts) => {
      try {
        const profile = getResolvedProfile(opts.profile);
        const api = new WpApi(profile);
        const page = await api.getPage(id);
        printOutput(page, opts.format, PAGE_DETAIL_COLUMNS);
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  cmd
    .command('create')
    .description('Create a new page')
    .requiredOption('--title <title>', 'Page title')
    .option('--content <content>', 'Page content (HTML)')
    .option('--content-file <path>', 'Read content from file')
    .option('--status <status>', 'Page status: draft, publish, pending, private', 'draft')
    .option('--parent <id>', 'Parent page ID')
    .option('--order <n>', 'Menu order')
    .option('--thumbnail <mediaId>', 'Featured image media ID')
    .option('--slug <slug>', 'Page slug')
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

        if (opts.parent) data.parent = Number(opts.parent);
        if (opts.order) data.menu_order = Number(opts.order);
        if (opts.thumbnail) data.featured_media = Number(opts.thumbnail);
        if (opts.slug) data.slug = opts.slug;

        const page = await api.createPage(data);
        console.log(`Page created successfully (ID: ${page.id})`);
        printOutput(page, opts.format, PAGE_DETAIL_COLUMNS);
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  cmd
    .command('update <id>')
    .description('Update an existing page')
    .option('--title <title>', 'Page title')
    .option('--content <content>', 'Page content (HTML)')
    .option('--content-file <path>', 'Read content from file')
    .option('--status <status>', 'Page status')
    .option('--parent <id>', 'Parent page ID')
    .option('--order <n>', 'Menu order')
    .option('--thumbnail <mediaId>', 'Featured image media ID')
    .option('--slug <slug>', 'Page slug')
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
        if (opts.parent) data.parent = Number(opts.parent);
        if (opts.order) data.menu_order = Number(opts.order);
        if (opts.thumbnail) data.featured_media = Number(opts.thumbnail);
        if (opts.slug) data.slug = opts.slug;

        if (Object.keys(data).length === 0) {
          console.error('Error: No fields to update.');
          process.exit(1);
        }

        const page = await api.updatePage(id, data);
        console.log(`Page updated successfully (ID: ${page.id})`);
        printOutput(page, opts.format, PAGE_DETAIL_COLUMNS);
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  cmd
    .command('delete <id>')
    .description('Delete a page')
    .option('--force', 'Permanently delete', false)
    .option('--profile <name>', 'Profile to use')
    .option('--format <format>', 'Output format: table or json', 'table')
    .action(async (id, opts) => {
      try {
        const profile = getResolvedProfile(opts.profile);
        const api = new WpApi(profile);
        const result = await api.deletePage(id, opts.force);
        console.log(`Page deleted (ID: ${id})${opts.force ? ' permanently' : ' (moved to trash)'}.`);
        if (result) printOutput(result, opts.format, PAGE_DETAIL_COLUMNS);
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  return cmd;
}
