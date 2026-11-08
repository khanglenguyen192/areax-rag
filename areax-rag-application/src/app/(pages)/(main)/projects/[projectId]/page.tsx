import { ProjectView } from "@/features/project/ProjectView";

type ProjectPageProps = {
  readonly params: Promise<{ projectId: string }>;
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params;
  return <ProjectView projectId={projectId} />;
}
