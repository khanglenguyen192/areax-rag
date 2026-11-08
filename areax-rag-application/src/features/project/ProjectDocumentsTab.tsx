"use client";

import { Spinner } from "@/components/atoms";
import { ErrorMessage } from "@/components/molecules";
import { DocumentPanel } from "@/components/organisms";
import { useT } from "@/hooks/common/useT";
import { useProjectDocuments } from "@/hooks/documents/useProjectDocuments";
import { describeError } from "@/lib/describe-error";

type ProjectDocumentsTabProps = {
  readonly projectId: string;
};

/** Connects the document list hook to the presentational panel. */
export function ProjectDocumentsTab({ projectId }: ProjectDocumentsTabProps) {
  const t = useT();
  const documents = useProjectDocuments(projectId);

  if (documents.isLoading) return <Spinner label={t("common.loading")} isCentered />;
  if (!documents.data) {
    return <ErrorMessage message={t("documents.error")} onRetry={() => void documents.refetch()} />;
  }

  const failure = documents.uploadError ?? documents.removeError;

  return (
    <DocumentPanel
      documents={documents.data}
      isUploading={documents.isUploading}
      isAddingYoutube={documents.isAddingYoutube}
      actionError={failure ? describeError(failure, t) : undefined}
      youtubeError={documents.youtubeError ? describeError(documents.youtubeError, t) : undefined}
      onUpload={(file) => void documents.upload(file)}
      onAddYoutube={async (url) => {
        documents.resetYoutubeError();
        return (await documents.addYoutube(url)) === true;
      }}
      onDelete={async (documentId) => {
        await documents.remove(documentId);
      }}
    />
  );
}
