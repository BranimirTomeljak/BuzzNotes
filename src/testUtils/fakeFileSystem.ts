// In-memory, Android-like stand-in for expo-file-system's File, Directory and Paths (Jest only).

interface Loc {
  prefix: string;
  segments: string[];
}

type Entry = { loc: Loc; bytes: Uint8Array } | { loc: Loc; bytes: null };

const DOCUMENT = 'file:///data/user/0/app/files';
const CACHE = 'file:///data/user/0/app/cache';
const entries = new Map<string, Entry>();

function decode(text: string): string {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

function encode(segment: string): string {
  return segment
    .replace(/%/g, '%25')
    .replace(/\?/g, '%3F')
    .replace(/#/g, '%23')
    .replace(/ /g, '%20');
}

// Like Android: drops ?query and #fragment, decodes %xx in the URI, then resolves . and .. segments.
function resolve(first: string, names: string[]): Loc {
  const bare = first.split(/[?#]/)[0];
  const match = /^([a-zA-Z][\w+.-]*:\/\/[^/]*)(.*)$/.exec(bare);
  const parts = [
    ...decode(match ? match[2] : bare).split('/'),
    ...names.flatMap((n) => n.split('/')),
  ];
  const segments: string[] = [];
  for (const part of parts) {
    if (part === '..') segments.pop();
    else if (part && part !== '.') segments.push(part);
  }
  return { prefix: match ? match[1] : 'file://', segments };
}

const keyOf = (loc: Loc) => `${loc.prefix}/${loc.segments.join('/')}`;
const uriOf = (loc: Loc) => `${loc.prefix}/${loc.segments.map(encode).join('/')}`;
const parentOf = (loc: Loc): Loc => ({ prefix: loc.prefix, segments: loc.segments.slice(0, -1) });
const isDir = (loc: Loc) => entries.get(keyOf(loc))?.bytes === null;
const isFile = (loc: Loc) => entries.get(keyOf(loc))?.bytes instanceof Uint8Array;

function readBytes(loc: Loc): Uint8Array {
  const entry = entries.get(keyOf(loc));
  if (!entry?.bytes) throw new Error(`File does not exist: ${uriOf(loc)}`);
  return entry.bytes;
}

function writeBytes(loc: Loc, bytes: Uint8Array): void {
  if (isDir(loc)) throw new Error(`Path is a directory: ${uriOf(loc)}`);
  if (!isDir(parentOf(loc))) throw new Error(`Parent directory does not exist: ${uriOf(loc)}`);
  entries.set(keyOf(loc), { loc, bytes });
}

function mkdirs(loc: Loc): void {
  for (let i = 1; i <= loc.segments.length; i++) {
    const dir = { prefix: loc.prefix, segments: loc.segments.slice(0, i) };
    if (isFile(dir)) throw new Error(`Path is a file: ${uriOf(dir)}`);
    entries.set(keyOf(dir), { loc: dir, bytes: null });
  }
}

function removeTree(loc: Loc): void {
  const key = keyOf(loc);
  if (!entries.has(key)) throw new Error(`Unable to delete, does not exist: ${uriOf(loc)}`);
  for (const other of [...entries.keys()]) {
    if (other === key || other.startsWith(`${key}/`)) entries.delete(other);
  }
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(text: string): Uint8Array {
  return Uint8Array.from(atob(text), (char) => char.charCodeAt(0));
}

export class File {
  static pickFileAsync: jest.Mock = jest.fn();
  private readonly loc: Loc;

  constructor(first: string | File | Directory, ...names: string[]) {
    this.loc = resolve(typeof first === 'string' ? first : first.uri, names);
    this.validatePath();
  }

  // Every constructor calls this, as the real one does, so tests can spy on it to catch any file use.
  validatePath(): void {}

  get uri(): string {
    return uriOf(this.loc);
  }

  get name(): string {
    return this.loc.segments[this.loc.segments.length - 1] ?? '';
  }

  get exists(): boolean {
    return isFile(this.loc);
  }

  create(): void {
    if (entries.has(keyOf(this.loc))) throw new Error(`File already exists: ${this.uri}`);
    writeBytes(this.loc, new Uint8Array());
  }

  write(content: string | Uint8Array, options?: { encoding?: 'utf8' | 'base64' }): void {
    if (typeof content !== 'string') writeBytes(this.loc, content.slice());
    else if (options?.encoding === 'base64') writeBytes(this.loc, fromBase64(content));
    else writeBytes(this.loc, new TextEncoder().encode(content));
  }

  async text(): Promise<string> {
    return new TextDecoder().decode(readBytes(this.loc));
  }

  async base64(): Promise<string> {
    return toBase64(readBytes(this.loc));
  }

  copy(destination: File | Directory): void {
    const bytes = readBytes(this.loc);
    if (destination instanceof Directory && !destination.exists) {
      throw new Error(`Destination does not exist: ${destination.uri}`);
    }
    const target =
      destination instanceof Directory
        ? resolve(destination.uri, [this.name])
        : resolve(destination.uri, []);
    if (entries.has(keyOf(target))) throw new Error(`Destination already exists: ${uriOf(target)}`);
    writeBytes(target, bytes.slice());
  }

  // Android deletes a directory recursively even through a File object.
  delete(): void {
    removeTree(this.loc);
  }
}

export class Directory {
  private readonly loc: Loc;

  constructor(first: string | File | Directory, ...names: string[]) {
    this.loc = resolve(typeof first === 'string' ? first : first.uri, names);
    this.validatePath();
  }

  // Every constructor calls this, as the real one does, so tests can spy on it to catch any file use.
  validatePath(): void {}

  get uri(): string {
    return `${uriOf(this.loc).replace(/\/$/, '')}/`;
  }

  get name(): string {
    return this.loc.segments[this.loc.segments.length - 1] ?? '';
  }

  get exists(): boolean {
    return isDir(this.loc);
  }

  create(options?: { intermediates?: boolean; idempotent?: boolean }): void {
    if (entries.has(keyOf(this.loc))) {
      if (options?.idempotent && this.exists) return;
      throw new Error(`Directory already exists: ${this.uri}`);
    }
    if (!options?.intermediates && !isDir(parentOf(this.loc))) {
      throw new Error(`Parent directory does not exist: ${this.uri}`);
    }
    mkdirs(this.loc);
  }

  list(): (File | Directory)[] {
    if (!this.exists) throw new Error(`Directory does not exist: ${this.uri}`);
    const depth = this.loc.segments.length + 1;
    return [...entries.values()]
      .filter(
        ({ loc }) => loc.segments.length === depth && keyOf(parentOf(loc)) === keyOf(this.loc),
      )
      .map(({ loc, bytes }) => {
        const name = loc.segments[depth - 1];
        return bytes === null ? new Directory(this, name) : new File(this, name);
      });
  }

  delete(): void {
    removeTree(this.loc);
  }
}

export class Paths {
  static get document(): Directory {
    return new Directory(DOCUMENT);
  }

  static get cache(): Directory {
    return new Directory(CACHE);
  }
}

export const fakeFs = {
  reset(): void {
    entries.clear();
    mkdirs(resolve(DOCUMENT, []));
    mkdirs(resolve(CACHE, []));
    File.pickFileAsync.mockReset();
  },

  seed(uri: string, content: string | Uint8Array): void {
    const loc = resolve(uri, []);
    mkdirs(parentOf(loc));
    writeBytes(loc, typeof content === 'string' ? new TextEncoder().encode(content) : content);
  },

  read(uri: string): string | undefined {
    const entry = entries.get(keyOf(resolve(uri, [])));
    return entry?.bytes ? new TextDecoder().decode(entry.bytes) : undefined;
  },

  // Returns the URIs of all files, or only those under `dirUri`, sorted.
  list(dirUri?: string): string[] {
    const base = dirUri === undefined ? '' : `${keyOf(resolve(dirUri, []))}/`;
    return [...entries.entries()]
      .filter(([key, entry]) => entry.bytes && key.startsWith(base))
      .map(([, entry]) => uriOf(entry.loc))
      .sort();
  },
};
