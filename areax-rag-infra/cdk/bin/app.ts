#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { DEFAULT_STORAGE_SETTINGS, StorageStack } from "../lib/storage-stack";

const app = new cdk.App();

// Override with context, for example:
//   cdk synth -c corsAllowedOriginDeployed=http://example.test:3000
// The second origin is optional, like CorsAllowedOriginDeployed in cloudformation/storage.yml.
const local = (app.node.tryGetContext("corsAllowedOrigin") as string | undefined) ?? DEFAULT_STORAGE_SETTINGS.corsAllowedOrigins[0];
const deployed = app.node.tryGetContext("corsAllowedOriginDeployed") as string | undefined;
const corsAllowedOrigins = deployed ? [local, deployed] : [local];

new StorageStack(app, "areax-rag-storage", {
  ...DEFAULT_STORAGE_SETTINGS,
  corsAllowedOrigins,
  description: "areax-rag storage: documents bucket (S3), vector bucket and chunk index (S3 Vectors).",
});
