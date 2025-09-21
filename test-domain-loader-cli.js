#!/usr/bin/env node
console.log(`COMMANDS:
  infra server create <name> [options]    Create a new server
  infra server list [options]             List servers
  dev project create <name> [options]     Create a new project
`)

if (process.argv.includes('--help')) {
  process.exit(0)
}
