interface ZoomControlsProps {
  canZoomIn: boolean;
  canZoomOut: boolean;
  /** Hay una cámara libre: solo entonces tiene sentido reencuadrar. */
  customized: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

interface ZoomButtonProps { label: string; title: string; enabled: boolean; onAction: () => void; children: string }

/** `aria-disabled` en lugar de `disabled`: el botón conserva el foco al llegar al tope y no suelta al usuario de teclado al body. */
function ZoomButton({ label, title, enabled, onAction, children }: ZoomButtonProps) {
  return <button type="button" aria-label={label} title={title} aria-disabled={enabled ? undefined : true}
    onClick={enabled ? onAction : undefined}>{children}</button>;
}

/** Botones de acercamiento: hermanos del atlas (no hijos) para que pulsarlos no inicie un arrastre. */
export function MapZoomControls({ canZoomIn, canZoomOut, customized, onZoomIn, onZoomOut, onReset }: ZoomControlsProps) {
  return <div className="map-zoom" role="group" aria-label="Acercamiento del mapa">
    <ZoomButton label="Acercar el mapa" title="Acercar" enabled={canZoomIn} onAction={onZoomIn}>+</ZoomButton>
    <ZoomButton label="Alejar el mapa" title="Alejar" enabled={canZoomOut} onAction={onZoomOut}>−</ZoomButton>
    <ZoomButton label="Reencuadrar el mapa" title="Volver al encuadre" enabled={customized} onAction={onReset}>⟲</ZoomButton>
  </div>;
}
