import { Command } from 'commander';
import { configCommand } from './commands/config.js';
import { postCommand } from './commands/post.js';
import { pageCommand } from './commands/page.js';
import { mediaCommand } from './commands/media.js';
import { categoryCommand } from './commands/category.js';
import { tagCommand } from './commands/tag.js';

export function createCli() {
  const program = new Command();

  program
    .name('wp-rest')
    .description('WordPress REST API CLI - manage posts, pages, media, categories, and tags')
    .version('1.1.0');

  program.addCommand(configCommand());
  program.addCommand(postCommand());
  program.addCommand(pageCommand());
  program.addCommand(mediaCommand());
  program.addCommand(categoryCommand());
  program.addCommand(tagCommand());

  return program;
}
