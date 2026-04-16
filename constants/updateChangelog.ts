export type ChangelogItemType = "fix" | "feature";

export interface ChangelogItem {
  type: ChangelogItemType;
  description: string;
}

// Agregar items ANTES de cada OTA deploy. Vaciar DESPUÉS del deploy.
// Ejemplo:
//   { type: 'feature', description: 'Nuevo temporizador de descanso' },
//   { type: 'fix', description: 'Corrección del contador de racha' },
export const CURRENT_CHANGELOG: ChangelogItem[] = [];
