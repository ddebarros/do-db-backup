#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvironment() {
  log("\n🔍 Validating Configuration...", "blue");

  const requiredVars = [
    "DB_HOST",
    "DB_NAME",
    "DB_USER",
    "DB_PASSWORD",
    "SPACES_ACCESS_KEY_ID",
    "SPACES_SECRET_ACCESS_KEY",
    "SPACES_BUCKET_NAME",
  ];

  const optionalVars = [
    "DB_PORT",
    "DB_SSL",
    "SPACES_ENDPOINT",
    "SPACES_REGION",
    "BACKUP_PREFIX",
  ];

  let allRequiredPresent = true;
  let missingVars = [];

  // Check required variables
  log("\n📋 Required Environment Variables:", "cyan");
  requiredVars.forEach((varName) => {
    if (process.env[varName]) {
      log(
        `  ✅ ${varName}: ${
          varName.includes("PASSWORD") ? "***" : process.env[varName]
        }`,
        "green"
      );
    } else {
      log(`  ❌ ${varName}: Missing`, "red");
      allRequiredPresent = false;
      missingVars.push(varName);
    }
  });

  // Check optional variables
  log("\n📋 Optional Environment Variables:", "cyan");
  optionalVars.forEach((varName) => {
    if (process.env[varName]) {
      log(`  ✅ ${varName}: ${process.env[varName]}`, "green");
    } else {
      log(`  ⚠️  ${varName}: Using default value`, "yellow");
    }
  });

  // Check .env file
  log("\n📁 Configuration Files:", "cyan");
  const envPath = path.join(__dirname, ".env");
  if (fs.existsSync(envPath)) {
    log("  ✅ .env file exists", "green");
  } else {
    log("  ❌ .env file not found", "red");
    log("     Please copy env.example to .env and configure it", "yellow");
  }

  // Show current configuration
  log("\n⚙️  Current Configuration:", "cyan");
  log(
    `  Database Host: ${process.env.DB_HOST || "Not set"}`,
    process.env.DB_HOST ? "green" : "red"
  );
  log(`  Database Port: ${process.env.DB_PORT || "5432 (default)"}`, "green");
  log(
    `  Database Name: ${process.env.DB_NAME || "Not set"}`,
    process.env.DB_NAME ? "green" : "red"
  );
  log(
    `  Database User: ${process.env.DB_USER || "Not set"}`,
    process.env.DB_USER ? "green" : "red"
  );
  log(`  Database SSL: ${process.env.DB_SSL || "false (default)"}`, "green");
  log(
    `  Spaces Endpoint: ${
      process.env.SPACES_ENDPOINT || "nyc3.digitaloceanspaces.com (default)"
    }`,
    "green"
  );
  log(
    `  Spaces Region: ${process.env.SPACES_REGION || "nyc3 (default)"}`,
    "green"
  );
  log(
    `  Spaces Bucket: ${process.env.SPACES_BUCKET_NAME || "Not set"}`,
    process.env.SPACES_BUCKET_NAME ? "green" : "red"
  );
  log(
    `  Backup Prefix: ${
      process.env.BACKUP_PREFIX || "postgres-backups (default)"
    }`,
    "green"
  );

  // Summary
  log("\n📊 Configuration Summary:", "magenta");
  if (allRequiredPresent) {
    log("  ✅ All required configuration is present!", "green");
    log("  🚀 You can now run the backup script", "green");
  } else {
    log("  ❌ Configuration is incomplete", "red");
    log(`  📝 Missing variables: ${missingVars.join(", ")}`, "red");
    log("  🔧 Please update your .env file and try again", "yellow");
  }

  return allRequiredPresent;
}

function checkDependencies() {
  log("\n📦 Checking Dependencies...", "blue");

  const packagePath = path.join(__dirname, "package.json");
  if (!fs.existsSync(packagePath)) {
    log("  ❌ package.json not found", "red");
    return false;
  }

  const nodeModulesPath = path.join(__dirname, "node_modules");
  if (!fs.existsSync(nodeModulesPath)) {
    log("  ⚠️  node_modules not found", "yellow");
    log("     Run: npm install", "yellow");
    return false;
  }

  log("  ✅ Node.js dependencies are installed", "green");
  return true;
}

function checkPostgresClient() {
  log("\n🗄️  Checking PostgreSQL Client...", "blue");

  const { spawn } = require("child_process");

  return new Promise((resolve) => {
    const pgDump = spawn("pg_dump", ["--version"]);

    pgDump.on("close", (code) => {
      if (code === 0) {
        log("  ✅ pg_dump is available", "green");
        resolve(true);
      } else {
        log("  ❌ pg_dump is not available", "red");
        log("     Please install PostgreSQL client tools", "yellow");
        log("     On macOS: brew install postgresql", "yellow");
        log("     On Ubuntu: sudo apt-get install postgresql-client", "yellow");
        resolve(false);
      }
    });

    pgDump.on("error", () => {
      log("  ❌ pg_dump is not available", "red");
      log("     Please install PostgreSQL client tools", "yellow");
      resolve(false);
    });
  });
}

async function main() {
  log("🚀 DigitalOcean PostgreSQL Backup - Configuration Validator", "magenta");
  log("=".repeat(60), "blue");

  const configValid = checkEnvironment();
  const depsInstalled = checkDependencies();
  const pgClientAvailable = await checkPostgresClient();

  log("\n" + "=".repeat(60), "blue");
  log("🎯 Final Status:", "magenta");

  if (configValid && depsInstalled && pgClientAvailable) {
    log("  🎉 Everything is ready!", "green");
    log("  💡 Next steps:", "cyan");
    log("     1. Test database connection: ./backup.sh test", "cyan");
    log("     2. Create your first backup: ./backup.sh backup", "cyan");
    log("     3. List existing backups: ./backup.sh list", "cyan");
  } else {
    log("  ⚠️  Some issues need to be resolved", "yellow");
    if (!configValid) {
      log("     - Fix missing environment variables", "red");
    }
    if (!depsInstalled) {
      log("     - Run: npm install", "red");
    }
    if (!pgClientAvailable) {
      log("     - Install PostgreSQL client tools", "red");
    }
  }

  log("\n📚 For help, see README.md or run: ./backup.sh help", "cyan");
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkEnvironment, checkDependencies, checkPostgresClient };
