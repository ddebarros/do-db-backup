#!/usr/bin/env node

const { Client } = require("pg");
const AWS = require("aws-sdk");
const fs = require("fs");
const path = require("path");
const { program } = require("commander");
const moment = require("moment");
require("dotenv").config();

// Configure AWS SDK for DigitalOcean Spaces
const spacesEndpoint = new AWS.Endpoint(
  process.env.SPACES_ENDPOINT || "nyc3.digitaloceanspaces.com"
);
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.SPACES_ACCESS_KEY_ID,
  secretAccessKey: process.env.SPACES_SECRET_ACCESS_KEY,
  region: process.env.SPACES_REGION || "nyc3",
});

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
};

// Spaces bucket configuration
const bucketName = process.env.SPACES_BUCKET_NAME;
const backupPrefix = process.env.BACKUP_PREFIX || "postgres-backups";

class DatabaseBackup {
  constructor() {
    this.timestamp = moment().format("YYYY-MM-DD_HH-mm-ss");
    this.backupFileName = `backup_${this.timestamp}.sql`;
    this.backupPath = path.join(__dirname, this.backupFileName);
  }

  async createBackup() {
    console.log("🚀 Starting PostgreSQL database backup...");
    console.log(`📅 Timestamp: ${this.timestamp}`);
    console.log(`🗄️  Database: ${dbConfig.database}`);
    console.log(`🏠 Host: ${dbConfig.host}:${dbConfig.port}`);

    try {
      // Create backup using pg_dump
      await this.runPgDump();

      // Upload to Spaces
      await this.uploadToSpaces();

      // Clean up local backup file
      this.cleanup();

      console.log("✅ Backup completed successfully!");
    } catch (error) {
      console.error("❌ Backup failed:", error.message);
      this.cleanup();
      process.exit(1);
    }
  }

  async runPgDump() {
    console.log("📦 Creating database dump...");

    return new Promise((resolve, reject) => {
      const { spawn } = require("child_process");

      const pgDump = spawn("pg_dump", [
        "-h",
        dbConfig.host,
        "-p",
        dbConfig.port.toString(),
        "-U",
        dbConfig.user,
        "-d",
        dbConfig.database,
        "-f",
        this.backupPath,
        "--verbose",
        "--no-password",
      ]);

      // Set environment variable for password
      pgDump.env.PGPASSWORD = dbConfig.password;

      let stdout = "";
      let stderr = "";

      pgDump.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      pgDump.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      pgDump.on("close", (code) => {
        if (code === 0) {
          console.log("✅ Database dump created successfully");
          resolve();
        } else {
          reject(new Error(`pg_dump failed with code ${code}: ${stderr}`));
        }
      });

      pgDump.on("error", (error) => {
        reject(new Error(`Failed to start pg_dump: ${error.message}`));
      });
    });
  }

  async uploadToSpaces() {
    console.log("☁️  Uploading backup to DigitalOcean Spaces...");

    const fileStream = fs.createReadStream(this.backupPath);
    const key = `${backupPrefix}/${this.backupFileName}`;

    const uploadParams = {
      Bucket: bucketName,
      Key: key,
      Body: fileStream,
      ContentType: "application/sql",
      Metadata: {
        "backup-timestamp": this.timestamp,
        "database-name": dbConfig.database,
        "database-host": dbConfig.host,
        "backup-type": "postgresql",
      },
    };

    try {
      const result = await s3.upload(uploadParams).promise();
      console.log(`✅ Backup uploaded successfully to: ${result.Location}`);
      console.log(
        `🔗 Spaces URL: https://${bucketName}.${spacesEndpoint.host}/${key}`
      );
    } catch (error) {
      throw new Error(`Failed to upload to Spaces: ${error.message}`);
    }
  }

  cleanup() {
    if (fs.existsSync(this.backupPath)) {
      fs.unlinkSync(this.backupPath);
      console.log("🧹 Local backup file cleaned up");
    }
  }

  async testConnection() {
    console.log("🔍 Testing database connection...");

    const client = new Client(dbConfig);

    try {
      await client.connect();
      const result = await client.query("SELECT version()");
      console.log("✅ Database connection successful");
      console.log(
        `📊 PostgreSQL version: ${result.rows[0].version.split(" ")[0]}`
      );
      await client.end();
      return true;
    } catch (error) {
      console.error("❌ Database connection failed:", error.message);
      await client.end();
      return false;
    }
  }

  async listBackups() {
    console.log("📋 Listing existing backups...");

    try {
      const result = await s3
        .listObjectsV2({
          Bucket: bucketName,
          Prefix: backupPrefix,
        })
        .promise();

      if (result.Contents.length === 0) {
        console.log("No backups found");
        return;
      }

      console.log(`Found ${result.Contents.length} backup(s):`);
      result.Contents.sort(
        (a, b) => new Date(b.LastModified) - new Date(a.LastModified)
      ).forEach((obj, index) => {
        const size = (obj.Size / 1024 / 1024).toFixed(2);
        const date = moment(obj.LastModified).format("YYYY-MM-DD HH:mm:ss");
        console.log(`${index + 1}. ${obj.Key} (${size} MB) - ${date}`);
      });
    } catch (error) {
      console.error("❌ Failed to list backups:", error.message);
    }
  }
}

// CLI Commands
program
  .version("1.0.0")
  .description("DigitalOcean PostgreSQL Database Backup Tool");

program
  .command("backup")
  .description("Create a new database backup")
  .action(async () => {
    const backup = new DatabaseBackup();
    await backup.createBackup();
  });

program
  .command("test")
  .description("Test database connection")
  .action(async () => {
    const backup = new DatabaseBackup();
    await backup.testConnection();
  });

program
  .command("list")
  .description("List existing backups")
  .action(async () => {
    const backup = new DatabaseBackup();
    await backup.listBackups();
  });

program
  .command("backup-with-test")
  .description("Test connection and create backup")
  .action(async () => {
    const backup = new DatabaseBackup();
    const isConnected = await backup.testConnection();

    if (isConnected) {
      await backup.createBackup();
    } else {
      console.error("❌ Cannot proceed with backup due to connection failure");
      process.exit(1);
    }
  });

program
  .command("wait")
  .description(
    "Wait for specified number of minutes then exit with success message"
  )
  .argument("[minutes]", "Number of minutes to wait (default: 5)")
  .action(async (minutes = 5) => {
    const waitMinutes = parseInt(minutes);

    if (isNaN(waitMinutes) || waitMinutes <= 0) {
      console.error(
        "❌ Invalid time specified. Please provide a positive number of minutes."
      );
      process.exit(1);
    }

    console.log(`⏰ Starting ${waitMinutes}-minute wait timer...`);
    console.log(
      `🕐 This command will wait for ${waitMinutes} minute(s) before completing`
    );

    const waitTime = waitMinutes * 60 * 1000; // Convert minutes to milliseconds
    const startTime = Date.now();

    // Show progress every 15 seconds
    const progressInterval = 15000; // 15 seconds in milliseconds

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.floor(waitTime / 1000 - elapsed);
      const elapsedMinutes = Math.floor(elapsed / 60);
      const remainingMinutes = Math.floor(remaining / 60);

      if (waitMinutes >= 2) {
        console.log(
          `⏳ Time elapsed: ${elapsedMinutes}m ${
            elapsed % 60
          }s, Remaining: ${remainingMinutes}m ${remaining % 60}s`
        );
      } else {
        console.log(`⏳ Time elapsed: ${elapsed}s, Remaining: ${remaining}s`);
      }
    }, progressInterval);

    try {
      await new Promise((resolve) => {
        setTimeout(() => {
          clearInterval(interval);
          resolve();
        }, waitTime);
      });

      console.log(
        `✅ Wait command completed successfully after ${waitMinutes} minute(s)!`
      );
      console.log("🎯 Task finished with success status");
    } catch (error) {
      console.error("❌ Wait command failed:", error.message);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse(process.argv);

// If no command specified, run backup
if (!process.argv.slice(2).length) {
  const backup = new DatabaseBackup();
  backup.createBackup();
}
