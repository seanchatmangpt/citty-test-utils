# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2024-09-21

### Added

#### 🌟 Universal Contract Architecture
- **Framework-Agnostic Contract**: Separated testing logic from language-specific implementations
- **Cross-Language Adapters**: Support for Node.js, Python, Go, Rust, Deno, Java, C#, PHP, Ruby, Shell, PowerShell
- **Universal Runners**: Local, Docker, SSH, Podman, Deno, WASI execution environments
- **PTY Support**: Interactive CLI testing with pseudo-terminal support
- **Matrix Testing**: Cross-platform and cross-version testing with configurable axes
- **Network Policies**: Deterministic testing with none/offline/online network access control
- **File System Tracking**: Comprehensive artifact tracking for file creation, modification, and deletion
- **Deterministic Environment**: Fixed timezone (UTC), locale (C), and environment variables

#### 🔧 Advanced Testing Features
- **Comprehensive Assertions**: Exit codes, output matching, JSON validation, file system changes, duration checks
- **Scenario Packs**: Pre-built scenarios for help, version, invalid commands, JSON mode, idempotency, concurrency
- **Custom Scenarios**: Multi-step workflows with hooks, retries, timeouts, and concurrent execution
- **Report Generation**: JSON, JUnit XML, HTML, and TAP report formats
- **Performance Benchmarking**: Built-in performance testing and duration validation

#### 🎯 Universal CLI Testing Examples
- **Cross-Language Testing**: Test any CLI in any language with the same API
- **Environment Agnostic**: Run tests locally, in Docker, or over SSH
- **Interactive Testing**: PTY support for login flows and interactive commands
- **Matrix Testing**: Test across multiple versions, operating systems, and configurations
- **CI/CD Integration**: Generate reports in formats compatible with CI systems

### Changed

#### 📦 Package Configuration
- Updated version to 0.4.0
- Updated description to reflect universal contract architecture
- Added new keywords for universal CLI testing features
- Enhanced package.json with comprehensive feature descriptions

#### 📖 Documentation Overhaul
- **Universal Contract Focus**: Completely rewrote README to showcase universal contract architecture
- **Cross-Language Examples**: Added comprehensive examples for testing CLIs in different languages
- **Advanced Features**: Detailed coverage of PTY testing, matrix testing, and network policies
- **Use Cases**: Practical examples for multi-language CLI testing, cross-platform testing, and CI/CD integration
- **Benefits Section**: Clear value proposition for universal CLI testing

### Technical Implementation

#### 🏗️ Core Architecture
- **Universal Contract**: Framework-agnostic testing contract with JSDoc documentation
- **Adapter System**: Language-specific adapters for seamless CLI testing across frameworks
- **Runner Implementations**: Local and Docker runners with comprehensive feature support
- **Scenario System**: Flexible scenario builder with hooks, retries, and concurrent execution
- **Reporter System**: Multiple output formats for different CI/CD and reporting needs

#### 🔄 Backward Compatibility
- **Legacy Support**: Maintained existing Citty-specific functionality alongside universal contract
- **Migration Path**: Clear migration guide for existing users to adopt universal contract
- **Gradual Adoption**: Users can adopt universal contract incrementally without breaking existing tests

## [0.3.2] - 2024-09-21

### Changed

#### 📖 Documentation Overhaul
- **Noun-Verb Pattern Focus**: Completely rewrote README to prominently feature the noun-verb CLI pattern
- **Clear Command Structure**: Added comprehensive examples of all four nouns (`test`, `gen`, `runner`, `info`)
- **Intuitive Examples**: Showcased the natural language approach to CLI testing
- **Use Case Documentation**: Added practical examples for CLI development, template generation, and command execution

#### 📦 Package Configuration
- Updated version to 0.3.2
- Updated all version references to 0.3.2

### Added

#### 🎯 Enhanced Documentation
- **Four Nouns Section**: Detailed explanation of each noun and its verbs
- **Why Noun-Verb Section**: Explained the benefits of the intuitive pattern
- **Advanced Features**: Comprehensive coverage of cleanroom testing, template generation, and fluent assertions
- **Use Cases**: Practical examples for different scenarios
- **Benefits Section**: Clear value proposition

## [0.3.1] - 2024-09-21

### Added

#### 🎯 CLI Binary Support
- **`ctu` Command**: Added `ctu` as a direct executable command
- **Binary Aliases**: Both `ctu` and `citty-test-utils` now work as commands
- **Package Bin Configuration**: Proper npm bin configuration for global installation

### Changed

#### 📦 Package Configuration
- Updated version to 0.3.1
- Added `bin` field to package.json with both `ctu` and `citty-test-utils` aliases
- Updated all version references to 0.3.1

### Fixed

#### 🔧 CLI Version Consistency
- Fixed version display consistency across all CLI commands
- Updated info version command to show correct version number

## [0.3.0] - 2024-09-21

### Added

#### 🎯 Noun-Verb CLI Structure
- Complete CLI implementation with `ctu <noun> <verb>` pattern
- Main CLI entry point at `src/cli.mjs` with comprehensive command structure
- Organized command structure in `src/commands/` directory
- Support for `test`, `gen`, `runner`, and `info` nouns

#### 📝 Template Generation System
- **Project Generation**: `ctu gen project <name>` - Generate complete CLI projects
- **Test Generation**: `ctu gen test <name>` - Generate test files from templates
- **Scenario Generation**: `ctu gen scenario <name>` - Generate scenario files
- **CLI Generation**: `ctu gen cli <name>` - Generate CLI files
- **Config Generation**: `ctu gen config <name>` - Generate configuration files
- Nunjucks template system with `templates/` directory
- Support for both local and cleanroom file generation

#### 🔧 Custom Runner System
- **Command Execution**: `ctu runner execute <command>` - Execute external commands
- **Environment Support**: Local and cleanroom execution environments
- **Timeout Configuration**: Configurable command timeouts
- **Working Directory**: Custom working directory support
- **JSON Output**: Structured output format support

#### 📊 Info System
- **Version Info**: `ctu info version` - Get version and CLI information
- **Features Info**: `ctu info features` - List available features
- **Config Info**: `ctu info config` - Display configuration information
- **All Info**: `ctu info all` - Comprehensive information display
- JSON output support for all info commands

#### 🧪 Test Commands
- **Test Runner**: `ctu test run [scenario]` - Run test scenarios
- **Test Help**: `ctu test help` - Display test command help
- **Test Version**: `ctu test version` - Test version command functionality
- **Test Error**: `ctu test error <type>` - Test error scenarios
- Integration with existing scenario DSL system

#### 🐳 Enhanced Cleanroom Isolation
- Perfect file system isolation between local and cleanroom environments
- Files generated in cleanroom stay within Docker container
- Comprehensive validation of cleanroom vs local behavior
- Cross-environment consistency testing

#### 📸 Comprehensive Snapshot Testing
- Complete snapshot coverage for all CLI outputs
- Snapshot tests for main CLI commands, info commands, gen commands, runner commands, and test commands
- Cross-environment snapshot consistency validation
- JSON output snapshot testing

#### 🔍 Focused Integration Testing
- Modular integration test structure replacing monolithic test files
- Separate test files for different command categories:
  - `main-cli.test.mjs` - Main CLI commands
  - `info-commands.test.mjs` - Info noun commands
  - `gen-commands.test.mjs` - Gen noun commands
  - `runner-commands.test.mjs` - Runner noun commands
  - `test-commands.test.mjs` - Test noun commands
  - `error-handling.test.mjs` - Error handling and edge cases
  - `gen-cleanroom-validation.test.mjs` - Cleanroom isolation validation
- Comprehensive test coverage with 70+ passing tests

### Changed

#### 📁 Directory Structure Reorganization
- Reorganized `src/` directory from flat structure to hierarchical organization
- Created `src/core/` for core testing framework components
- Created `src/enterprise/` for enterprise-level features
- Organized commands in `src/commands/` with noun-verb structure
- Moved templates to `templates/` directory

#### 🔧 Core Framework Improvements
- Enhanced local runner with better CLI path resolution
- Improved cleanroom runner with proper environment variable handling
- Updated fluent assertions with better error messages
- Enhanced scenario DSL with improved error handling

#### 📦 Package Configuration
- Updated package.json with new keywords and description
- Added new dependencies: `nunjucks` for template generation
- Updated file inclusion for npm publish
- Enhanced TypeScript definitions

### Fixed

#### 🐛 Import Path Issues
- Fixed all import paths after directory reorganization
- Resolved conflicting exports and duplicate class declarations
- Fixed module resolution issues in test files

#### 🔧 CLI Execution Issues
- Fixed CLI path resolution in local and cleanroom runners
- Resolved spawn process exit code capture issues
- Fixed timeout handling in process execution
- Improved error handling and stderr capture

#### 🧪 Test Framework Issues
- Fixed Vitest global availability issues in enterprise modules
- Resolved domain discovery interference with test output
- Fixed file conflict issues in test execution
- Improved test isolation and cleanup

### Security

#### 🔒 Environment Isolation
- Enhanced cleanroom environment isolation
- Improved file system security boundaries
- Better handling of environment variables in containers

## [0.2.4] - 2024-09-20

### Added
- Initial release with core testing framework
- Local and cleanroom runners
- Fluent assertions system
- Scenario DSL
- Pre-built scenarios pack
- Playground project with comprehensive examples

### Features
- Docker cleanroom testing with testcontainers
- Fluent assertion API with detailed error messages
- Multi-step scenario testing with retry mechanisms
- Cross-environment testing capabilities
- TypeScript support with complete type definitions
- Comprehensive test utilities and helpers

## [0.2.3] - 2024-09-20

### Added
- Initial npm package release
- Basic testing utilities for GitVan CLI
- Docker cleanroom support
- Fluent assertions
- Snapshot testing capabilities

---

## Migration Guide

### From 0.2.x to 0.3.0

#### New CLI Structure
The new version includes a complete CLI with noun-verb structure. You can now use:

```bash
# Old way (programmatic only)
import { runLocalCitty } from 'citty-test-utils'

# New way (CLI + programmatic)
npx citty-test-utils info version
npx citty-test-utils gen project my-cli
npx citty-test-utils runner execute "node --version"
```

#### Template Generation
New template generation capabilities:

```bash
# Generate complete projects
npx citty-test-utils gen project my-cli

# Generate individual templates
npx citty-test-utils gen test my-test
npx citty-test-utils gen scenario my-scenario
npx citty-test-utils gen cli my-cli
```

#### Enhanced Testing
The testing framework now includes comprehensive integration tests and snapshot testing. All existing programmatic APIs remain compatible.

#### Directory Structure
The internal directory structure has been reorganized, but all public APIs remain the same. Import paths and usage patterns are unchanged.

---

## Contributing

Contributions are welcome! Please see the project repository for contribution guidelines.

## License

MIT License - see [LICENSE](LICENSE) file for details.