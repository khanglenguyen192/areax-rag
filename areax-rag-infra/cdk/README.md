# CDK module (learning exercise)

The storage resources of `../cloudformation/storage.yml` written again with the **AWS CDK in TypeScript**. It exists **to learn CDK**. Nothing in this repository runs it: the real stack is still created from the CloudFormation template by `../scripts/deploy-cloudformation.sh`.

> **Do not run `cdk deploy` or `cdk bootstrap` against the VPS or the Floci instance.** The CloudFormation stack `areax-rag-storage` already owns these resources, and a CDK stack with the same resource names would clash with it (see "Differences" below).

## What is here

| Path | Purpose |
|---|---|
| `bin/app.ts` | Entry point: creates the CDK `App` and one `StorageStack` |
| `lib/storage-stack.ts` | The stack: documents bucket, vector bucket and chunk index |
| `cdk.json` | Tells the CDK CLI how to run the app (`ts-node bin/app.ts`) |
| `tsconfig.json`, `package.json` | TypeScript and dependency setup |

Ignored by git (`.gitignore` in this folder): `node_modules/`, `cdk.out/`, `dist/`, compiled `*.js` and `*.d.ts`, `cdk.context.json`.

## Concepts, with the code that shows them

| Concept | Where to look |
|---|---|
| **App, Stack, Construct**: an app contains stacks, a stack contains constructs, and each stack becomes one CloudFormation template | `bin/app.ts`, `StorageStack` |
| **L2 construct**: a high-level class with sensible defaults. One `s3.Bucket` expands to the bucket and its CORS and public access block settings | `DocumentsBucket` |
| **L1 construct** (`Cfn...`): a one-to-one wrapper of a CloudFormation resource, used when there is no L2 yet. S3 Vectors has none, so it uses `CfnVectorBucket` and `CfnIndex` | `VectorBucket`, `ChunkIndex` |
| **Removal policy**: `RETAIN` is the CDK way to write `DeletionPolicy: Retain` | `removalPolicy`, `applyRemovalPolicy` |
| **Explicit dependency** when two resources refer to each other by plain strings, so CDK cannot infer the order | `chunkIndex.addDependency(vectorBucket)` |
| **Context**: values passed with `-c key=value` instead of CloudFormation parameters | `corsAllowedOrigin` and `corsAllowedOriginDeployed` in `bin/app.ts` |
| **Outputs** | `CfnOutput` at the end of the stack |

## How it maps to the template

| `storage.yml` | CDK |
|---|---|
| `Parameters:` | Props of `StorageStackProps` with defaults in `DEFAULT_STORAGE_SETTINGS` |
| `AWS::S3::Bucket` `DocumentsBucket` | `new s3.Bucket(...)` |
| `AWS::S3Vectors::VectorBucket` | `new s3vectors.CfnVectorBucket(...)` |
| `AWS::S3Vectors::Index` | `new s3vectors.CfnIndex(...)` |
| `DeletionPolicy` / `UpdateReplacePolicy: Retain` | `RemovalPolicy.RETAIN` |
| `Outputs:` | `new cdk.CfnOutput(...)` |

## Differences from the template

- **Logical IDs differ.** CDK appends a hash to L2 resources (`DocumentsBucket9EC9DEB9`). Deploying this stack over the existing CloudFormation stack would try to replace resources instead of adopting them.
- **Bootstrap.** A real deploy needs `cdk bootstrap` (an assets bucket and roles) and the `BootstrapVersion` parameter that CDK adds to the template. Floci is an emulator, so this has not been tried against it.
- **Parameters.** The CloudFormation template avoids list parameters because Floci mishandles them. In CDK the values are ordinary TypeScript, so that problem does not exist; the synthesized template contains plain lists.

## Commands

Everything below works offline and creates nothing in AWS:

```bash
cd areax-rag-infra/cdk
npm install
npm run typecheck                 # compile check only
npx cdk synth                     # writes the CloudFormation template to cdk.out/
npx cdk synth -c corsAllowedOriginDeployed=http://example.test:3000   # a second CORS origin
```

`cdk synth` was run once while this module was written. The generated template contains the same three resources as `storage.yml`, all with `Retain`, the CORS origin, and an index of dimension 1536, cosine, with `text` as the non-filterable key. The real `cdk deploy` was never run.

## Where to go next

- Compare the output of `npx cdk synth` with `../cloudformation/storage.yml` line by line.
- Try adding a second origin to the CORS rule, or a tag, and run `npx cdk synth` again to see what changes.
- Read the [CDK Developer Guide](https://docs.aws.amazon.com/cdk/v2/guide/home.html) sections on constructs and stacks.
