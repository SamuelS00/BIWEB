import type { SemVer } from "./common";

/**
 * PluginManifest — envelope comum a todos os tipos de plugin.
 * Assinado (cosign/Sigstore) e verificado no registry e na instalação.
 */
export interface PluginManifest {
  name: string; // "acme.gantt" (namespace do publisher)
  version: SemVer;
  type: "visualization" | "connector" | "transformation" | "action" | "exporter" | "theme" | "integration";
  publisher: { id: string; verified: boolean };
  /** Faixa de compatibilidade com a API do host para este tipo de plugin. */
  engines: { platform: string; hostApi: string };
  entrypoint: PluginEntrypoint;
  /** Capabilities oferecidas (ex.: tipo de visualização, operações de transformação). */
  capabilities: string[];
  /**
   * Permissões solicitadas — negadas por padrão; aprovadas pelo admin do tenant na instalação.
   * Ex.: "network:api.acme.com", "data:read-widget", "ui:open-modal", "secrets:own".
   */
  permissions: string[];
  configSchema?: object;
  /**
   * Ferramentas que o plugin contribui ao assistente de IA (Fase 5+), sujeitas às mesmas
   * regras do Tool Registry: JSON Schema, sideEffect read|propose, permissão aprovada pelo admin.
   */
  assistantTools?: Array<{ name: string; description: string; inputSchema: object; sideEffect: "read" | "propose" }>;
  /** Edição mínima exigida (entitlements), ex.: "enterprise". */
  requiresEdition?: string;
  integrity: { digest: string; signature: string };
  license?: string;
}

export type PluginEntrypoint =
  | { kind: "esm"; url: string; sandbox: "in-page" | "iframe" } // frontend (viz, actions, themes)
  | { kind: "wasm-component"; module: string; world: string } // backend sandboxed (UDFs, transforms, conectores leves)
  | { kind: "container"; image: string; protocol: "connector-v1" | "exporter-v1" } // out-of-process
  | { kind: "declarative"; spec: string } // YAML (conector HTTP, tema)
  | { kind: "webhook"; url: string }; // actions/integrações
