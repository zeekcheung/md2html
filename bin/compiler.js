#!/usr/bin/env node

import { cac } from "cac";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { compileDocs } from "../lib/core.js";

// Get the directory of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Read package.json content (go up one level from bin/ to root)
const packageJson = JSON.parse(readFileSync(path.resolve(__dirname, "../package.json"), "utf-8"));

const cli = cac("md2html");

// Define command and its options
cli
  .command("[input]", "Compile Markdown to HTML")
  .option("-i, --input <path>", "Input Markdown file", { default: "README.md" })
  .option("-o, --output <path>", "Output HTML file", { default: "README.html" })
  .option("-t, --title <string>", "HTML Document Title", { default: "Document" })
  .action(async (input, options) => {
    // If user provides a positional argument: md2html README.md, it overrides options.input
    const finalInput = input || options.input;
    const config = {
      input: finalInput,
      output: options.output,
      title: options.title,
    };

    try {
      console.log(`🔨 Compiling: ${config.input} -> ${config.output}`);
      const startTime = Date.now();

      await compileDocs(config);

      const duration = Date.now() - startTime;
      console.log(`\x1b[32m%s\x1b[0m`, `√ Documentation generated successfully in ${duration}ms!`);
      console.log(`\x1b[34m%s\x1b[0m`, `➜ Location: ${path.resolve(config.output)}`);
    } catch (error) {
      console.error(`\x1b[31m%s\x1b[0m`, `× Build failed:`, error.message);
      process.exit(1);
    }
  });

// Display help message when --help or -h is used
cli.help();

// Display version when --version or -v is used
cli.version(packageJson.version);

cli.parse();
