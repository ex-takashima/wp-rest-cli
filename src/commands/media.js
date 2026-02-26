import { Command } from 'commander';
import { getResolvedProfile } from '../config.js';
import { WpApi } from '../api.js';
import { printOutput, truncate } from '../utils/output.js';

const MEDIA_COLUMNS = [
  { header: 'ID', value: r => r.id },
  { header: 'Title', value: r => truncate(r.title?.rendered || r.title || '', 40) },
  { header: 'Type', value: r => r.mime_type || '' },
  { header: 'Date', value: r => r.date?.slice(0, 10) || '' },
  { header: 'URL', value: r => r.source_url || '' },
];

const MEDIA_DETAIL_COLUMNS = [
  { header: 'ID', value: r => r.id },
  { header: 'Title', value: r => r.title?.rendered || r.title || '' },
  { header: 'Type', value: r => r.mime_type || '' },
  { header: 'Date', value: r => r.date || '' },
  { header: 'File', value: r => r.media_details?.file || '' },
  { header: 'Width', value: r => r.media_details?.width || '' },
  { header: 'Height', value: r => r.media_details?.height || '' },
  { header: 'URL', value: r => r.source_url || '' },
];

export function mediaCommand() {
  const cmd = new Command('media')
    .description('Manage WordPress media (images, files)');

  cmd
    .command('list')
    .description('List media items')
    .option('--profile <name>', 'Profile to use')
    .option('--format <format>', 'Output format: table or json', 'table')
    .option('--per-page <n>', 'Items per page', '10')
    .option('--page <n>', 'Page number', '1')
    .option('--search <term>', 'Search term')
    .option('--mime-type <type>', 'Filter by MIME type (e.g. image/jpeg)')
    .action(async (opts) => {
      try {
        const profile = getResolvedProfile(opts.profile);
        const api = new WpApi(profile);

        const params = {
          per_page: opts.perPage,
          page: opts.page,
        };
        if (opts.search) params.search = opts.search;
        if (opts.mimeType) params.mime_type = opts.mimeType;

        const media = await api.listMedia(params);
        printOutput(media, opts.format, MEDIA_COLUMNS);
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exitCode = 1;
      }
    });

  cmd
    .command('upload <file>')
    .description('Upload a media file')
    .option('--title <title>', 'Media title')
    .option('--profile <name>', 'Profile to use')
    .option('--format <format>', 'Output format: table or json', 'table')
    .action(async (file, opts) => {
      try {
        const profile = getResolvedProfile(opts.profile);
        const api = new WpApi(profile);
        const media = await api.uploadMedia(file, opts.title);
        console.log(`Media uploaded successfully (ID: ${media.id})`);
        printOutput(media, opts.format, MEDIA_DETAIL_COLUMNS);
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exitCode = 1;
      }
    });

  cmd
    .command('delete <id>')
    .description('Delete a media item')
    .option('--force', 'Permanently delete (required for media)', true)
    .option('--profile <name>', 'Profile to use')
    .action(async (id, opts) => {
      try {
        const profile = getResolvedProfile(opts.profile);
        const api = new WpApi(profile);
        await api.deleteMedia(id, opts.force);
        console.log(`Media deleted permanently (ID: ${id}).`);
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exitCode = 1;
      }
    });

  return cmd;
}
