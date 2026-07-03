export const CONSULTANT_DIAGNOSTIC_AREAS = [
  'Estratégica',
  'Financiera',
  'Comercial / Ventas',
  'Marketing',
  'Servicio al cliente',
  'Operaciones',
  'Organizacional / RRHH',
  'Tecnología',
  'Legal',
  'Laboral',
  'Tributario / Contable',
] as const;

export type ConsultantDiagnosticArea = (typeof CONSULTANT_DIAGNOSTIC_AREAS)[number];
