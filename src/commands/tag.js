import { Command } from 'commander';
import { getResolvedProfile } from '../config.js';
import { WpApi } from '../api.js';
import { printOutput } from '../utils/output.js';

const TAG_COLUMNS = [
  { header: 'ID', value: r => r.id },
  { header: 'Name', value: r => r.name },
  { header: 'Slug', value: r => r.slug },
  { header: 'Count', value: r => r.count },
];

export function tagCommand() {
  const cmd = new Command('tag')
    .description('Manage WordPress tags');

  cmd
    .command('list')
    .description('List tags')
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

        const tags = await api.listTags(params);
        printOutput(tags, opts.format, TAG_COLUMNS);
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  cmd
    .command('create')
    .description('Create a new tag')
    .requiredOption('--name <name>', 'Tag name')
    .option('--slug <slug>', 'Tag slug')
    .option('--description <desc>', 'Tag description')
    .option('--profile <name>', 'Profile to use')
    .option('--format <format>', 'Output format: table or json', 'table')
    .action(async (opts) => {
      try {
        const profile = getResolvedProfile(opts.profile);
        const api = new WpApi(profile);

        const data = { name: opts.name };
        if (opts.slug) data.slug = opts.slug;
        if (opts.description) data.description = opts.description;

        const tag = await api.createTag(data);
        console.log(`Tag created (ID: ${tag.id})`);
        printOutput(tag, opts.format, TAG_COLUMNS);
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  cmd
    .command('delete <id>')
    .description('Delete a tag')
    .option('--profile <name>', 'Profile to use')
    .action(async (id, opts) => {
      try {
        const profile = getResolvedProfile(opts.profile);
        const api = new WpApi(profile);
        await api.deleteTag(id);
        console.log(`Tag deleted (ID: ${id}).`);
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  return cmd;
}
