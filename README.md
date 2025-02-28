# Snowflake Account Aliaser

A Chrome extension that allows you to replace cryptic Snowflake account names with friendly aliases.

## Features

- Automatically replaces account names on the Snowflake login page
- Custom aliases for each account
- Persistent storage of aliases across sessions
- Simple and intuitive user interface

## Installation

### From Source (Developer Mode)

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" using the toggle in the top-right corner
4. Click "Load unpacked" and select the directory containing the extension files
5. The extension should now appear in your toolbar

## Usage

1. Navigate to the Snowflake login page
2. Click on the extension icon in the Chrome toolbar
3. For each account, enter a friendly alias in the input field
4. Click "Save Aliases" to apply the changes
5. The account names on the page will be replaced with your aliases

## Converting the SVG to PNG Icons

The extension requires PNG icons in 16x16, 48x48, and 128x128 sizes. You can convert the included SVG to PNG using various online tools or software like Inkscape or GIMP.

Example commands using Inkscape CLI:
```
inkscape -w 16 -h 16 icon.svg -o images/icon16.png
inkscape -w 48 -h 48 icon.svg -o images/icon48.png
inkscape -w 128 -h 128 icon.svg -o images/icon128.png
```

## Support

For issues, feature requests, or contributions, please submit them through the project's GitHub repository.