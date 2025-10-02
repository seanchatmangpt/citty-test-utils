# Examples Directory

This directory contains practical, working examples demonstrating key features of citty-test-utils.

## 📁 Available Examples

### 1. **analysis-auto-detection.mjs**
Demonstrates the new auto-detection feature for analysis commands.

**What it shows:**
- ✅ Auto-detection from `package.json` bin field
- ✅ Verbose mode to see detection process
- ✅ All analysis commands (discover, coverage, recommend)
- ✅ Override with explicit `--cli-path`
- ✅ Error handling when CLI not found

**Run it:**
```bash
node examples/analysis-auto-detection.mjs
```

## 🚀 Quick Start

All examples are standalone and can be run directly:

```bash
# Navigate to repository root
cd citty-test-utils

# Run any example
node examples/analysis-auto-detection.mjs
```

## 🎯 What You'll Learn

### Auto-Detection Feature (NEW in v0.5.1)

The analysis commands now automatically detect your CLI path:

**Before (required manual path):**
```bash
npx citty-test-utils analysis discover --cli-path src/cli.mjs
```

**After (auto-detects):**
```bash
cd my-project
npx citty-test-utils analysis discover
# ✅ Automatically finds CLI from package.json!
```

### Detection Strategy

1. **package.json bin field** (HIGH confidence)
   - Reads `bin` field from package.json
   - Most reliable method

2. **Common file patterns** (MEDIUM confidence)
   - Searches for: `src/cli.mjs`, `cli.mjs`, `bin/cli.mjs`, etc.
   - Useful when bin field is missing

3. **Parent directory search** (MEDIUM confidence)
   - Looks up to 5 parent directories
   - Helpful for nested project structures

4. **Default fallback with validation** (LOW confidence)
   - Falls back to `src/cli.mjs`
   - Shows helpful error if file doesn't exist

### Verbose Mode

See exactly how your CLI was detected:

```bash
npx citty-test-utils analysis discover --verbose
```

Output:
```
🔍 Starting smart CLI detection...
✅ Auto-detected CLI: /path/to/src/cli.mjs
   Detection method: package-json-bin
   Confidence: high
   Package: my-cli
   Bin name: my-cli
```

### Error Handling

When CLI cannot be detected:

```
❌ CLI file not found: src/cli.mjs
💡 Tip: Run from project root or use --cli-path <path>
📁 Looking for: src/cli.mjs, cli.mjs, or bin/cli.mjs
```

## 📊 Analysis Commands

All three analysis commands support auto-detection:

### discover
Extract complete CLI structure via AST parsing
```bash
npx citty-test-utils analysis discover
```

### coverage
Calculate test coverage with threshold enforcement
```bash
npx citty-test-utils analysis coverage --test-dir test --threshold 80
```

### recommend
Get actionable suggestions for improving coverage
```bash
npx citty-test-utils analysis recommend --priority high
```

## 🔧 Advanced Usage

### Override Auto-Detection

When you need precise control:
```bash
npx citty-test-utils analysis discover --cli-path custom/path/to/cli.mjs
```

### JSON Output

For programmatic use:
```bash
npx citty-test-utils analysis discover --format json
```

Parse the `cliDetection` object to see detection details:
```json
{
  "cliDetection": {
    "method": "package-json-bin",
    "confidence": "high",
    "packageName": "my-cli",
    "binName": "my-cli",
    "packageJson": {
      "name": "my-cli",
      "version": "1.0.0"
    }
  }
}
```

## 💡 Tips

1. **Always run from project root** for best auto-detection
2. **Use --verbose** to debug detection issues
3. **Check package.json** has a `bin` field for highest confidence
4. **Use --cli-path** override for non-standard setups

## 🐛 Troubleshooting

**Problem:** CLI not detected
- **Solution:** Ensure you're in project root with `package.json`

**Problem:** Wrong CLI detected
- **Solution:** Use `--cli-path` to specify exact path

**Problem:** Want to see detection process
- **Solution:** Add `--verbose` flag

## 📚 Related Documentation

- [Main README](../README.md) - Complete documentation
- [Playground Examples](../playground/analysis-examples.mjs) - More examples
- [API Documentation](../docs/api/README.md) - Full API reference

## 🎉 Contributing

Have a great example to share? Submit a PR with:
1. New example file in this directory
2. Entry in this README
3. Clear comments in the code

---

**Happy Testing!** 🚀
