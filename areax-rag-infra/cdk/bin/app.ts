#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { DEFAULT_STORAGE_SETTINGS, StorageStack } from "../lib/storage-stack";

const app = new cdk.App();

// Override a setting with context, for example: cdk synth -c corsAllowedOrigin=http://example:3000
const corsAllowedOrigin =
  (app.node.tryGetContext("corsAllowedOrigin") as string | undefined) ??
  DEFAULT_STORAGE_SETTINGS.corsAllowedOrigin;

new StorageStack(app, "areax-rag-storage", {
  ...DEFAULT_STORAGE_SETTINGS,
  corsAllowedOrigin,
  description: "areax-rag storage: documents bucket (S3), vector bucket and chunk index (S3 Vectors).",
});
