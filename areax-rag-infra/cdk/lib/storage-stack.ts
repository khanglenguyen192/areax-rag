import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3vectors from "aws-cdk-lib/aws-s3vectors";
import type { Construct } from "constructs";

/** Settings of the storage stack. The defaults mirror the parameters of `cloudformation/storage.yml`. */
export interface StorageStackProps extends cdk.StackProps {
  readonly documentsBucketName: string;
  readonly vectorBucketName: string;
  readonly vectorIndexName: string;
  /** Embedding dimension; 1536 matches text-embedding-3-small. Cannot change on an existing index. */
  readonly vectorDimension: number;
  readonly distanceMetric: "cosine" | "euclidean";
  /** Browser origins allowed to upload with a presigned URL (the local app, and optionally the deployed one). */
  readonly corsAllowedOrigins: readonly string[];
}

export const DEFAULT_STORAGE_SETTINGS = {
  documentsBucketName: "areax-rag-documents",
  vectorBucketName: "areax-rag-vectors",
  vectorIndexName: "areax-rag-chunks",
  vectorDimension: 1536,
  distanceMetric: "cosine",
  corsAllowedOrigins: ["http://localhost:3000"],
} as const satisfies Omit<StorageStackProps, keyof cdk.StackProps>;

/**
 * The same three resources as `cloudformation/storage.yml`: a documents bucket, a vector bucket
 * and one shared chunk index.
 */
export class StorageStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    // L2 construct: one call expands to the bucket plus its public access block and CORS rules.
    // RETAIN keeps the user's files if the stack is deleted, like DeletionPolicy: Retain.
    const documents = new s3.Bucket(this, "DocumentsBucket", {
      bucketName: props.documentsBucketName,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      cors: [
        {
          allowedOrigins: [...props.corsAllowedOrigins],
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.HEAD],
          allowedHeaders: ["*"],
          exposedHeaders: ["ETag"],
          maxAge: 3000,
        },
      ],
    });

    // S3 Vectors has no L2 construct yet, so this uses the L1 "Cfn" constructs: they map
    // one-to-one to the CloudFormation resource types and properties.
    const vectorBucket = new s3vectors.CfnVectorBucket(this, "VectorBucket", {
      vectorBucketName: props.vectorBucketName,
    });
    vectorBucket.applyRemovalPolicy(cdk.RemovalPolicy.RETAIN);

    const chunkIndex = new s3vectors.CfnIndex(this, "ChunkIndex", {
      vectorBucketName: props.vectorBucketName,
      indexName: props.vectorIndexName,
      dataType: "float32",
      dimension: props.vectorDimension,
      distanceMetric: props.distanceMetric,
      // "text" holds the chunk text so a query can return passages without a second lookup.
      metadataConfiguration: { nonFilterableMetadataKeys: ["text"] },
    });
    chunkIndex.applyRemovalPolicy(cdk.RemovalPolicy.RETAIN);
    // The vector bucket name is a plain string here, so CDK cannot see the dependency by itself.
    chunkIndex.addDependency(vectorBucket);

    new cdk.CfnOutput(this, "DocumentsBucketName", { value: documents.bucketName });
    new cdk.CfnOutput(this, "VectorBucketName", { value: props.vectorBucketName });
    new cdk.CfnOutput(this, "VectorIndexName", { value: props.vectorIndexName });
    new cdk.CfnOutput(this, "VectorDimension", { value: String(props.vectorDimension) });
  }
}
