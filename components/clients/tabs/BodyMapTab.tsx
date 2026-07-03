"use client";

import { BodyMapEditor } from "@/components/clients/BodyMapEditor";

interface Props {
  client: Record<string, unknown>;
  bodyMapInjuries?: Record<string, unknown>[];
}

export function ClientBodyMapTab({ client, bodyMapInjuries = [] }: Props) {
  return (
    <BodyMapEditor
      clientId={String(client.id)}
      orgId={String(client.organisation_id)}
      solutionType={String(client.solution_type ?? "")}
      initialInjuries={bodyMapInjuries as never}
    />
  );
}
