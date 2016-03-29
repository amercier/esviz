#!/usr/bin/env node

import { readFileSync } from 'fs';
import { join, resolve } from 'path';

import { all, promisify } from 'bluebird';
import Handlebars from 'handlebars';
import { html } from 'web-resource-inliner';
import { parseDirectory } from './ast';

const phtml = promisify(html);

const assetsDir = resolve(join(__dirname, '..', 'assets'));
const index = join(assetsDir, 'index.hbs');
const inlinerOptions = {
  fileContent: readFileSync(index).toString(),
  relativeTo: assetsDir,
};

Handlebars.registerHelper('json', context => JSON.stringify(context, null, 2));

all([
  phtml(inlinerOptions),
  parseDirectory(process.argv[process.argv.length - 1]),
])
.then(([template, data]) => Handlebars.compile(template)({ data }))
.then(output => {
  process.stdout.write(output);
});
