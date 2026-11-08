# Diagrams

[draw.io](https://app.diagrams.net) files. Open them in draw.io (web, desktop, or the VS Code extension). No image exports are kept in the repository.

| Diagram | File |
|---|---|
| System architecture: application, Kafka, Python services, Postgres, Floci, external APIs, and the numbered request flows | [`architecture.drawio`](architecture.drawio) |
| Deployment pipeline: `deployment/prod` push, GitHub Actions build and deploy, Docker Hub, the VPS, health check and rollback | [`deployment-pipeline.drawio`](deployment-pipeline.drawio) |

When the design changes, update the diagram in the same change.

The diagrams show the **target** design. The Python services and the server side of the application are not implemented yet, and the pipeline has not run yet (see [`../deployment.md`](../deployment.md)).
