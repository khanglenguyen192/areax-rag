import "server-only";
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getEnv } from "@/server/config/env";
import { AppError } from "@/server/errors/app-error";
import { logger } from "@/server/http/logger";

const REQUEST_TIMEOUT_MS = 10_000;
const PRESIGN_TTL_S = 10 * 60;
const DELETE_BATCH = 1000;

const globalState = globalThis as typeof globalThis & {
  __areaxS3?: S3Client;
  __areaxS3Public?: S3Client;
};

function buildClient(endpoint: string): S3Client {
  const env = getEnv();
  return new S3Client({
    endpoint,
    region: env.AWS_REGION,
    // Floci serves buckets under the path, not as sub-domains.
    forcePathStyle: true,
    credentials: { accessKeyId: env.AWS_ACCESS_KEY_ID, secretAccessKey: env.AWS_SECRET_ACCESS_KEY },
  });
}

const serverClient = () => (globalState.__areaxS3 ??= buildClient(getEnv().AWS_ENDPOINT_URL));

// Presigned URLs embed the host they were signed for, and the browser must be able to reach it.
const publicClient = () =>
  (globalState.__areaxS3Public ??= buildClient(
    getEnv().S3_PUBLIC_ENDPOINT ?? getEnv().AWS_ENDPOINT_URL,
  ));

async function send<T>(call: (signal: AbortSignal) => Promise<T>, what: string): Promise<T> {
  try {
    return await call(AbortSignal.timeout(REQUEST_TIMEOUT_MS));
  } catch (error) {
    if (error instanceof S3ServiceException && error.$metadata.httpStatusCode === 404) throw error;
    logger.error("S3 call failed", {
      what,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new AppError("UPSTREAM_ERROR");
  }
}

export const storage = {
  /** Returns a URL the browser can PUT the file to. The length is signed, so only a file of exactly that size is accepted. */
  presignUpload(key: string, sizeBytes: number): Promise<string> {
    return getSignedUrl(
      publicClient(),
      new PutObjectCommand({ Bucket: getEnv().S3_BUCKET, Key: key, ContentLength: sizeBytes }),
      { expiresIn: PRESIGN_TTL_S },
    );
  },

  /** Returns the stored size in bytes, or `null` when no object exists under the key. */
  async headSize(key: string): Promise<number | null> {
    try {
      const head = await send(
        (signal) =>
          serverClient().send(new HeadObjectCommand({ Bucket: getEnv().S3_BUCKET, Key: key }), {
            abortSignal: signal,
          }),
        "head",
      );
      return head.ContentLength ?? 0;
    } catch (error) {
      if (error instanceof S3ServiceException && error.$metadata.httpStatusCode === 404)
        return null;
      throw error;
    }
  },

  async deleteObject(key: string): Promise<void> {
    await send(
      (signal) =>
        serverClient().send(new DeleteObjectCommand({ Bucket: getEnv().S3_BUCKET, Key: key }), {
          abortSignal: signal,
        }),
      "delete",
    );
  },

  /** Deletes every object under a prefix, for example all files of a project. */
  async deletePrefix(prefix: string): Promise<void> {
    const bucket = getEnv().S3_BUCKET;
    let token: string | undefined;
    do {
      const page = await send(
        (signal) =>
          serverClient().send(
            new ListObjectsV2Command({
              Bucket: bucket,
              Prefix: prefix,
              ContinuationToken: token,
              MaxKeys: DELETE_BATCH,
            }),
            { abortSignal: signal },
          ),
        "list",
      );
      const objects = (page.Contents ?? []).flatMap((item) =>
        item.Key ? [{ Key: item.Key }] : [],
      );
      if (objects.length > 0) {
        await send(
          (signal) =>
            serverClient().send(
              new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: objects } }),
              { abortSignal: signal },
            ),
          "delete-many",
        );
      }
      token = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (token);
  },
};
