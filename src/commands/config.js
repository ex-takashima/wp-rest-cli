import { Command } from 'commander';
import {
  listProfiles,
  getDefaultProfileName,
  setDefaultProfile,
  addProfile,
  removeProfile,
  setCredential,
  getConfigDir,
} from '../config.js';
import { prompt } from '../utils/prompt.js';
import { printOutput } from '../utils/output.js';

export function configCommand() {
  const cmd = new Command('config')
    .description('Manage WordPress site profiles and credentials');

  cmd
    .command('add <name>')
    .description('Add a new site profile')
    .requiredOption('--url <url>', 'WordPress site URL (e.g. https://example.com)')
    .requiredOption('--user <username>', 'WordPress username')
    .option('--password <password>', 'Application password (will prompt if omitted)')
    .action(async (name, opts) => {
      try {
        let password = opts.password;
        if (!password) {
          password = await prompt('Application Password: ', true);
          if (!password) {
            console.error('Error: Password is required.');
            process.exit(1);
          }
        }

        addProfile(name, opts.url, opts.user);
        setCredential(name, password);
        console.log(`Profile "${name}" added successfully.`);

        const defaultName = getDefaultProfileName();
        if (defaultName === name) {
          console.log(`Set as default profile.`);
        }
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  cmd
    .command('list')
    .description('List all configured profiles')
    .option('--format <format>', 'Output format: table or json', 'table')
    .action((opts) => {
      const profiles = listProfiles();
      const defaultName = getDefaultProfileName();

      const entries = Object.entries(profiles).map(([name, p]) => ({
        name,
        url: p.url,
        user: p.user,
        default: name === defaultName ? '*' : '',
      }));

      if (entries.length === 0) {
        console.log('No profiles configured. Run: wp-post config add <name>');
        return;
      }

      const columns = [
        { header: 'Name', value: r => r.name },
        { header: 'URL', value: r => r.url },
        { header: 'User', value: r => r.user },
        { header: 'Default', value: r => r.default },
      ];

      printOutput(entries, opts.format, columns);
    });

  cmd
    .command('use <name>')
    .description('Set default profile')
    .action((name) => {
      try {
        setDefaultProfile(name);
        console.log(`Default profile set to "${name}".`);
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  cmd
    .command('remove <name>')
    .description('Remove a profile and its credentials')
    .action((name) => {
      try {
        removeProfile(name);
        console.log(`Profile "${name}" removed.`);
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  cmd
    .command('path')
    .description('Show config directory path')
    .action(() => {
      console.log(getConfigDir());
    });

  return cmd;
}
