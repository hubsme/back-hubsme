export type PeruDevsRucResult = {
  id: string;
  razon_social: string;
  condicion: string;
  nombre_comercial: string;
  tipo: string;
  fecha_inscripcion: string;
  estado: string;
  direccion: string;
  sistema_emision: string;
  actividad_exterior: string;
  sistema_contabilidad: string;
  fecha_emision_electronica: string;
  fecha_ple: string;
  oficio: string;
  actividades_economicas: string[];
  comprobante_pago: string[];
  sistema_emision_electronica: string[];
  padrones: string[];
  departamento: string;
  provincia: string;
  distrito: string;
  representantes_legales: string[];
};

export type PeruDevsRucResponse = {
  estado: boolean;
  mensaje: string;
  resultado?: PeruDevsRucResult | null;
};
