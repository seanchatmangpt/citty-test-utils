#!/usr/bin/env node
console.log(`USAGE:
  cli <command> [options]

COMMANDS:
  infra server create <name> [options]    Create a new server
  infra server list [options]             List servers
`)

if (process.argv.includes('--help')) {
  process.exit(0)
}
