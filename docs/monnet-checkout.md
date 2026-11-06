# Checkout de reuniones con Monnet QR

El frontend crea el checkout en Monnet y muestra el QR al pulsar «Generar QR para pagar». El importe y la comisión se calculan en el backend con la tarifa del consultor; el cliente solo envía sus datos de pagador. Los códigos promocionales se aplican antes de generar una operación de pago.

## Endpoints

Todos los endpoints de checkout requieren el JWT de Hubsme. Crear, generar el QR y sincronizar requieren el dueño de la PYME. La lectura comprueba la pertenencia a la empresa o al consultor.

| Método | Ruta | Uso |
| --- | --- | --- |
| POST | `/admin/monnet/checkout` | Guardar importe, consultor y tres horarios propuestos. No crea todavía la reunión ni llama a Monnet. |
| GET | `/admin/monnet/checkout/:id` | Obtener resumen, estado, imagen del QR, enlace y vencimiento. |
| POST | `/admin/monnet/checkout/:id/payment` | Enviar los datos del pagador y generar una sola operación QR. |
| POST | `/admin/monnet/checkout/:id/payment/sync` | Consultar el estado en Monnet y completar la reunión si ya fue pagada. |
| POST | `/admin/monnet/webhook/payin` | Notificación pública autenticada mediante la firma de Monnet, sin JWT de Hubsme. |

Los contratos y ejemplos se encuentran en Swagger. Los endpoints de checkout anteriores bajo `/admin/mercado-pago/checkout` quedan como alias obsoletos hacia Monnet; ya no crean preferencias de Mercado Pago. La preparación requiere los mismos datos del pagador del endpoint nuevo.

## Configuración

Completar las variables `MONNET_PAYIN_*` de `.env.example`: entorno, comercio, clave, moneda, URLs de retorno, tiempo de expiración y timeout. `MONNET_PLATFORM_FEE_PERCENT` define la comisión contable de Hubsme y se inicializa conservando el porcentaje anterior en el `.env` local. No representa la tarifa del procesador.

Registrar con Monnet la URL pública del backend de pruebas:

`https://monnet-test.hubsme.net/admin/monnet/webhook/payin`

La URL de notificación se configura en Monnet. Las variables de retorno SUCCESS/ERROR son URLs de navegación del frontend y no sustituyen al webhook. Este cambio no implementa Payout ni modifica sus webhooks.

No se requiere cambio de esquema ni migración: el JSON `checkout.raw_payment` guarda `provider: monnet` y los datos de la operación, separados de los pagos históricos. No se guardan la clave ni `payinVerification`. La respuesta pública no expone el JSON interno.

## Confirmación y reintentos

- Una respuesta HTTP 200 al crear el QR no significa pago aprobado. Se exige `payinErrorCode: 0000` y una imagen o enlace válidos.
- Antes de llamar a Monnet se reserva una referencia única bajo bloqueo del checkout. Dos clics concurrentes no crean dos operaciones.
- Si hay timeout o respuesta ambigua, la operación queda incierta y no se vuelve a crear automáticamente. Se consulta con la misma referencia; no se cobra otra vez para «probar».
- El webhook valida SHA-512 usando la representación exacta del importe recibido y compara comercio, importe y moneda. Como la firma publicada no incluye el estado, Hubsme también consulta el estado real con la API autenticada de Monnet.
- Estados `5` (autorizado) y `9` (liquidado) permiten confirmar. Crear la reunión, marcarla `por_confirmar`, asociarla al checkout y registrar el pendiente del consultor se ejecutan en una transacción con bloqueo. Los reintentos recuperan la operación completa o vuelven a intentarla tras un rollback; no duplican la reunión.
- Una notificación pendiente o vencida tardía no degrada un checkout aprobado. Reembolsos posteriores requieren conciliación; no cancelan automáticamente reuniones o depósitos ya registrados.
- La sincronización del frontend consulta como máximo una vez cada diez segundos por checkout. El webhook fuerza la comprobación. El frontend permite verificar de nuevo manualmente y no necesita una redirección para confirmar.
- Los checkouts con preferencias de Mercado Pago ya emitidas conservan su proveedor y webhook histórico; no se reutilizan para generar un segundo cobro en Monnet.

El pendiente del consultor conserva la comisión de Hubsme. La comisión de Monnet queda desconocida hasta disponer de la conciliación del proveedor; no se inventa una tarifa ni se registra como cero en campos de Mercado Pago.

## Verificación

Pruebas automatizadas con Monnet y queries simuladas: permisos, importe calculado en servidor, creación concurrente, reutilización del QR, timeout, errores de negocio, firma, importe/moneda incorrectos, contraste del estado con Monnet, duplicados y recuperación tras fallo al registrar la reunión. No ejecutan pagos reales ni modifican la base de producción.

Para la prueba de certificación completa, generar un QR desde Swagger o el checkout, comprobar que el comercio tiene QR habilitado y confirmar con el mecanismo de certificación acordado con Monnet. La disponibilidad de Yape One Shot con credenciales de prueba no se deduce de un error `999`.

Referencias: [QR White Label](https://payinmonnetpayments.readme.io/reference/qr-white-label), [Payment Notification](https://payinmonnetpayments.readme.io/reference/payment-notification), [Get Status Transaction](https://payinmonnetpayments.readme.io/reference/consult-transaction-status), [Status Codes](https://payinmonnetpayments.readme.io/reference/status-codes).
