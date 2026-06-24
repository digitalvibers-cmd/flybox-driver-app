#!/usr/bin/env node
const path = require('path');
const projectRoot = path.resolve(__dirname, '..');
process.argv = [process.argv[0], path.join(projectRoot, 'node_modules/react-native/cli.js'), 'config'];
const { name } = require(path.join(projectRoot, 'node_modules/react-native/package.json'));
require(path.join(projectRoot, 'node_modules/@react-native-community/cli'))
  .run(name)
  .then(() => process.exit(0))
  .catch((e) => { console.error('rn-config-wrapper error:', e.message || e); process.exit(1); });
