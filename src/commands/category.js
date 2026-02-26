import { Command } from 'commander';
import { getResolvedProfile } from '../config.js';
import { WpApi } from '../api.js';
import { printOutput } from '../utils/output.js';

const CATEGORY_COLUMNS = [
  { header: 'ID', value: r => r.id },
  { header: 'Name', value: r => r.name },
  { header: 'Slug', value: r => r.slug },
  { header: 'Parent', value: r => r.parent || '' },
  { header: 'Count', value: r => r.count },
];

export function categoryCommand() {
  const cmd = new Command('category')
    .description('Manage WordPress categories');

  cmd
    .command('list')
    .description('List categories')
    .option('--profile <name>', 'Profile to use')
    .option('--format <format>', 'Output format: table or json', 'table')
    .option('--per-page <n>', 'Items per page', '100')
    .option('--search <term>', 'Search term')
    .action(async (opts) => {
      try {
        const profile = getResolvedProfile(opts.profile);
        const api = new WpApi(profile);

        const params = { per_page: opts.perPage };
        if (opts.search) params.search = opts.search;

        const categories = await api.listCategories(params);
        printOutput(categories, opts.format, CATEGORY_COLUMNS);
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  cmd
    .command('create')
    .description('Create a new category')
    .requiredOption('--name <name>', 'Category name')
    .option('--slug <slug>', 'Category slug')
    .option('--description <desc>', 'Category description')
    .option('--parent <id>', 'Parent category ID')
    .option('--profile <name>', 'Profile to use')
    .option('--format <format>', 'Output format: table or json', 'table')
    .action(async (opts) => {
      try {
        const profile = getResolvedProfile(opts.profile);
        const api = new WpApi(profile);

        const data = { name: opts.name };
        if (opts.slug) data.slug = opts.slug;
        if (opts.description) data.description = opts.description;
        if (opts.parent) data.parent = Number(opts.parent);

        const category = await api.createCategory(data);
        console.log(`Category created (ID: ${category.id})`);
        printOutput(category, opts.format, CATEGORY_COLUMNS);
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  cmd
    .command('delete <id>')
    .description('Delete a category')
    .option('--profile <name>', 'Profile to use')
    .action(async (id, opts) => {
      try {
        const profile = getResolvedProfile(opts.profile);
        const api = new WpApi(profile);
        await api.deleteCategory(id);
        console.log(`Category deleted (ID: ${id}).`);
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  return cmd;
}
