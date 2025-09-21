#!/usr/bin/env node
// Test CLI for domain discovery

console.log(`USAGE:
  test-cli <command> [options]

COMMANDS:
  infra server create <name> [options]    Create a new server
  infra server list [options]             List servers
  infra server show <id> [options]        Show server details
  infra server update <id> [options]      Update server
  infra server delete <id> [options]      Delete server
  infra network create <name> [options]    Create a new network
  infra network list [options]            List networks
  dev project create <name> [options]     Create a new project
  dev project list [options]              List projects
  dev app create <name> [options]          Create a new app
  dev app list [options]                  List apps
  security user create <name> [options]   Create a new user
  security user list [options]            List users
`)

if (process.argv.includes('--help')) {
  process.exit(0)
}
