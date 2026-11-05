# CloudFormation: storage stack

Template: [`../cloudformation/storage.yml`](../cloudformation/storage.yml). Script: [`../scripts/deploy-cloudformation.sh`](../scripts/deploy-cloudformation.sh).

## Resources

| Logical ID | Type | Purpose |
|---|---|---|
| `DocumentsBucket` | `AWS::S3::Bucket` | Uploaded documents (with CORS for presigned browser uploads) |
| `VectorBucket` | `AWS::S3Vectors::VectorBucket` | Holds the chunk index |
| `ChunkIndex` | `AWS::S3Vectors::Index` | One shared index; every vector carries `project_id` and `document_id` metadata |

All three have `DeletionPolicy: Retain` and `UpdateReplacePolicy: Retain`, so deleting or replacing the stack never erases data.

## Parameters

| Parameter | Default | Notes |
|---|---|---|
| `DocumentsBucketName` | `areax-rag-documents` | |
| `VectorBucketName` | `areax-rag-vectors` | |
| `VectorIndexName` | `areax-rag-chunks` | |
| `VectorDimension` | `1536` | Matches `text-embedding-3-small`. Cannot be changed on an existing index |
| `DistanceMetric` | `cosine` | `cosine` or `euclidean`. Cannot be changed on an existing index |
| `NonFilterableMetadataKeys` | `text` | Keys stored but not filterable. `text` holds the chunk text (proposed design) |
| `CorsAllowedOrigins` | `http://localhost:3000` | Comma-separated list of browser origins |

## Outputs

`DocumentsBucketName`, `VectorBucketName`, `VectorIndexName`, `VectorDimension`. Print them with `./scripts/deploy-cloudformation.sh --outputs`. The application and services read the same names from their environment variables.

## Passing parameters

```bash
PARAMETERS="VectorDimension=1536 CorsAllowedOrigins=http://localhost:3000,http://localhost:3001" \
  ./scripts/deploy-cloudformation.sh
```

- `PARAMETERS` is a space-separated list of `Key=Value`. Values must not contain spaces. Commas are fine.
- **Pass the same `PARAMETERS` on every run.** On update, any parameter you leave out reverts to its default. Resetting the dimension or metric on an existing index would try to replace it. Keep your values in a small shell file that you `source` before running the script.

## Changing the embedding model

The index dimension is fixed at creation. If the embedding model changes to one with a different dimension:

1. Create a new index (new `VectorIndexName` and the new `VectorDimension`).
2. Re-index every document into it.
3. Switch the services to the new index name, then remove the old index.

Also store the embedding model name with the index so mixed models are never queried together.

## Design notes

- **One shared index** filtered by `project_id` (proposed). The alternative, one index per project, would have to be created at runtime and would live outside this stack.
- Chunk text is kept in the non-filterable `text` metadata key so a query returns passages without a second lookup. Non-filterable keys are fixed at index creation (proposed; confirm before the first real ingestion).
- Floci documents up to 10 non-filterable keys per index.

## Floci specifics

- Floci supports `AWS::S3::Bucket`, `AWS::S3Vectors::VectorBucket` and `AWS::S3Vectors::Index` in CloudFormation, but **skips unknown types silently**. Start Floci with `FLOCI_SERVICES_CLOUDFORMATION_ALLOW_STUB_UNSUPPORTED_RESOURCE_TYPES=false`.
- The script uses `create-stack` / `update-stack` / `wait`, which Floci documents. `aws cloudformation deploy` is not confirmed by the Floci docs; set `USE_DEPLOY=1` to try it.
- Deleting a stack fails if the vector bucket holds indexes that are not part of the stack.

## Status of verification

| Item | Status |
|---|---|
| Script syntax on macOS bash 3.2 | Checked |
| Script flow (create, update, no change, bad status, delete, local-endpoint guard) | Checked with a stub `aws` binary |
| Template parses as YAML | Checked |
| `shellcheck`, `cfn-lint` | Not installed here, not run |
| Template against a real Floci (property names for S3 Vectors, CORS, public access block) | **Not tested yet** |
