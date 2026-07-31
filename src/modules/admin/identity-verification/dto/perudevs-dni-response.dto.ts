export type PeruDevsDniResult = {
  id: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  nombre_completo: string;
  genero: string;
  fecha_nacimiento: string;
  codigo_verificacion: string;
};

export type PeruDevsDniResponse = {
  estado: boolean;
  mensaje: string;
  resultado?: PeruDevsDniResult | null;
};
