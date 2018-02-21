/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 *
 * @flow
 * @format
 */

import nuclideUri from 'nuclide-commons/nuclideUri';
import fsPromise from 'nuclide-commons/fsPromise';
import {runCommand} from 'nuclide-commons/process';

const HEADER_EXTENSIONS = new Set(['.h', '.hh', '.hpp', '.hxx', '.h++']);
const SOURCE_EXTENSIONS = new Set([
  '.c',
  '.cc',
  '.cpp',
  '.cxx',
  '.c++',
  '.m',
  '.mm',
]);

export function isHeaderFile(filename: string): boolean {
  return HEADER_EXTENSIONS.has(nuclideUri.extname(filename));
}

export function isSourceFile(filename: string): boolean {
  return SOURCE_EXTENSIONS.has(nuclideUri.extname(filename));
}

export function commonPrefix(a: string, b: string): number {
  let len = 0;
  while (len < a.length && len < b.length && a[len] === b[len]) {
    len++;
  }
  return len;
}

// The file may be new. Look for a nearby BUCK or TARGETS file.
export async function guessBuildFile(file: string): Promise<?string> {
  const dir = nuclideUri.dirname(file);
  let bestMatch = null;
  await Promise.all(
    ['BUCK', 'TARGETS', 'compile_commands.json'].map(async name => {
      const nearestDir = await fsPromise.findNearestFile(name, dir);
      if (nearestDir != null) {
        const match = nuclideUri.join(nearestDir, name);
        // Return the closest (most specific) match.
        if (bestMatch == null || match.length > bestMatch.length) {
          bestMatch = match;
        }
      }
    }),
  );
  return bestMatch;
}

// Strip off the extension and conventional suffixes like "Internal" and "-inl".
export function getFileBasename(file: string): string {
  let basename = nuclideUri.basename(file);
  const ext = basename.lastIndexOf('.');
  if (ext !== -1) {
    basename = basename.substr(0, ext);
  }
  return basename.replace(/(Internal|-inl)$/, '');
}

// Get memory usage for an array of process id's as a map.
export async function memoryUsagePerPid(
  pids: Array<number>,
): Promise<Map<number, number>> {
  const usage = new Map();
  if (pids.length >= 1) {
    try {
      const stdout = await runCommand('ps', [
        '-p',
        pids.join(','),
        '-o',
        'pid=',
        '-o',
        'rss=',
      ]).toPromise();
      stdout.split('\n').forEach(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length === 2) {
          const [pid, rss] = parts.map(x => parseInt(x, 10));
          usage.set(pid, rss);
        }
      });
    } catch (err) {
      // Ignore errors.
    }
  }
  return usage;
}
