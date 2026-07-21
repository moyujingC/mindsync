export function parseArgs(argv) {
  const args = {
    _: [],
    dryRun: false,
    all: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--dry-run') {
      args.dryRun = true;
    } else if (arg === '--no-comments') {
      args.includeComments = false;
    } else if (arg === '--all') {
      args.all = true;
    } else if (arg.startsWith('--')) {
      const key = toCamelCase(arg.slice(2));
      const next = argv[index + 1];
      if (!next || next.startsWith('--')) {
        args[key] = true;
      } else {
        args[key] = next;
        index += 1;
      }
    } else {
      args._.push(arg);
    }
  }

  return args;
}

function toCamelCase(value) {
  return value.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}
