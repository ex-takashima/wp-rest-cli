import { createInterface } from 'node:readline';

/**
 * Prompt user for input (with optional hidden input for passwords)
 */
export function prompt(question, hidden = false) {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    if (hidden) {
      // Mask password input
      process.stdout.write(question);
      const stdin = process.stdin;
      const originalRawMode = stdin.isRaw;

      if (stdin.isTTY) {
        stdin.setRawMode(true);
      }

      let password = '';
      const onData = (ch) => {
        const c = ch.toString('utf8');
        switch (c) {
          case '\n':
          case '\r':
          case '\u0004': // Ctrl+D
            if (stdin.isTTY) stdin.setRawMode(originalRawMode);
            stdin.removeListener('data', onData);
            process.stdout.write('\n');
            rl.close();
            resolve(password);
            break;
          case '\u0003': // Ctrl+C
            rl.close();
            process.exit(1);
            break;
          case '\u007F': // Backspace
            if (password.length > 0) {
              password = password.slice(0, -1);
              process.stdout.write('\b \b');
            }
            break;
          default:
            password += c;
            process.stdout.write('*');
            break;
        }
      };

      stdin.on('data', onData);
      stdin.resume();
    } else {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
    }
  });
}
