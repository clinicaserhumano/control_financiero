// Logo naranja de la clínica, arriba a la izquierda de cualquier documento
// imprimible. <img> plano (no next/image) para que se imprima igual siempre,
// sin placeholders ni carga diferida.
export default function PrintLogo() {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/logo-color.png" alt="Ser Humano" className="logo-print" />;
}
