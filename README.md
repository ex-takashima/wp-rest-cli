# wp-rest-cli

WordPress REST API CLI tool — manage posts, pages, media, categories, and tags from the command line.

## Install

```bash
npm install -g wp-rest-cli
```

## Setup

Configure your WordPress site URL and authentication:

```bash
wp-rest config set-url https://your-site.com
wp-rest config set-auth username password
```

## Usage

```bash
# Posts
wp-rest post list
wp-rest post get <id>
wp-rest post create --title "Hello" --content "World"
wp-rest post update <id> --title "Updated"
wp-rest post delete <id>

# Pages
wp-rest page list
wp-rest page get <id>
wp-rest page create --title "About" --content "About us"

# Media
wp-rest media list
wp-rest media upload <file>

# Categories
wp-rest category list
wp-rest category create --name "Tech"

# Tags
wp-rest tag list
wp-rest tag create --name "javascript"
```

## Requirements

- Node.js >= 18.0.0
- WordPress site with REST API enabled
- Application Passwords or Basic Auth plugin

## License

MIT
