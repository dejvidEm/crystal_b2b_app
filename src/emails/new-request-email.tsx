import type { ReactElement } from "react";
import {
  formatDateSk,
  formatDateTimeSk,
  formatTimeSk,
  getPackageLabel,
  getPriorityLabel,
  getStatusLabel,
  getVehicleCategoryLabel,
  getVehicleDisplayName,
  getVehiclePrimaryId,
} from "@/lib/utils";
import type { ServiceRequestDetail } from "@/types";

type NewRequestEmailProps = {
  request: ServiceRequestDetail;
  detailUrl: string;
  submitterName?: string | null;
};

const styles = {
  body: {
    margin: 0,
    padding: 0,
    backgroundColor: "#0f1115",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    color: "#e8eaed",
  },
  wrapper: {
    maxWidth: "640px",
    margin: "0 auto",
    padding: "32px 16px",
  },
  card: {
    backgroundColor: "#171a21",
    border: "1px solid #2a303c",
    borderRadius: "12px",
    padding: "28px 24px",
  },
  brand: {
    fontSize: "12px",
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "#7dd3fc",
    margin: "0 0 8px",
  },
  title: {
    fontSize: "22px",
    fontWeight: 700,
    margin: "0 0 8px",
    color: "#f3f4f6",
  },
  subtitle: {
    fontSize: "14px",
    color: "#9aa3b2",
    margin: "0 0 24px",
    lineHeight: 1.5,
  },
  sectionTitle: {
    fontSize: "13px",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    color: "#7dd3fc",
    margin: "24px 0 12px",
  },
  row: {
    marginBottom: "10px",
  },
  label: {
    display: "block",
    fontSize: "12px",
    color: "#9aa3b2",
    marginBottom: "2px",
  },
  value: {
    display: "block",
    fontSize: "14px",
    color: "#f3f4f6",
    fontWeight: 500,
  },
  vehicle: {
    border: "1px solid #2a303c",
    borderRadius: "10px",
    padding: "14px",
    marginBottom: "10px",
    backgroundColor: "#12151b",
  },
  vehicleTitle: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#f3f4f6",
    margin: "0 0 6px",
  },
  vehicleMeta: {
    fontSize: "13px",
    color: "#9aa3b2",
    margin: "0 0 4px",
    lineHeight: 1.45,
  },
  note: {
    whiteSpace: "pre-wrap" as const,
    fontSize: "14px",
    color: "#e8eaed",
    backgroundColor: "#12151b",
    border: "1px solid #2a303c",
    borderRadius: "10px",
    padding: "12px 14px",
    margin: 0,
  },
  buttonWrap: {
    marginTop: "28px",
    textAlign: "center" as const,
  },
  button: {
    display: "inline-block",
    backgroundColor: "#38bdf8",
    color: "#0f1115",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: "14px",
    padding: "12px 20px",
    borderRadius: "10px",
  },
  footer: {
    marginTop: "20px",
    fontSize: "12px",
    color: "#6b7280",
    lineHeight: 1.5,
    wordBreak: "break-all" as const,
  },
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.row}>
      <span style={styles.label}>{label}</span>
      <span style={styles.value}>{value || "—"}</span>
    </div>
  );
}

export function NewRequestEmail({
  request,
  detailUrl,
  submitterName,
}: NewRequestEmailProps): ReactElement {
  const org = request.organization;

  return (
    <div style={styles.body}>
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <p style={styles.brand}>Crystal B2B</p>
          <h1 style={styles.title}>Nová požiadavka {request.reference_code}</h1>
          <p style={styles.subtitle}>
            Firma {org?.name ?? "—"} odoslala novú požiadavku na čistenie. Nižšie
            je kompletný obsah objednávky.
          </p>

          <p style={styles.sectionTitle}>Základné údaje</p>
          <Field label="Referencia" value={request.reference_code} />
          <Field label="Stav" value={getStatusLabel(request.status)} />
          <Field label="Organizácia" value={org?.name ?? "—"} />
          <Field label="Adresa servisu" value={org?.service_address ?? "—"} />
          <Field label="Telefón organizácie" value={org?.phone ?? "—"} />
          <Field label="Odoslal" value={submitterName ?? "—"} />
          <Field
            label="Odoslané"
            value={formatDateTimeSk(request.created_at)}
          />

          <p style={styles.sectionTitle}>Termín</p>
          <Field
            label="Požadovaný dátum"
            value={formatDateSk(request.requested_date)}
          />
          <Field
            label="Čas"
            value={formatTimeSk(request.requested_time)}
          />
          <Field
            label="Priorita"
            value={getPriorityLabel(request.priority)}
          />
          <Field
            label="Počet vozidiel"
            value={String(request.vehicle_count)}
          />

          {request.partner_note ? (
            <>
              <p style={styles.sectionTitle}>Poznámka partnera</p>
              <p style={styles.note}>{request.partner_note}</p>
            </>
          ) : null}

          <p style={styles.sectionTitle}>Vozidlá</p>
          {request.vehicles.map((vehicle, index) => (
            <div key={vehicle.id} style={styles.vehicle}>
              <p style={styles.vehicleTitle}>
                {index + 1}. {getVehiclePrimaryId(vehicle)}
              </p>
              <p style={styles.vehicleMeta}>
                {getVehicleDisplayName(vehicle)}
                {vehicle.color ? ` · ${vehicle.color}` : ""}
              </p>
              <p style={styles.vehicleMeta}>
                Balík: {getPackageLabel(vehicle.service_package)}
              </p>
              {vehicle.category ? (
                <p style={styles.vehicleMeta}>
                  Kategória: {getVehicleCategoryLabel(vehicle.category)}
                </p>
              ) : null}
              {vehicle.license_plate ? (
                <p style={styles.vehicleMeta}>EČV: {vehicle.license_plate}</p>
              ) : null}
              {vehicle.vin ? (
                <p style={styles.vehicleMeta}>VIN: {vehicle.vin}</p>
              ) : null}
              {vehicle.internal_reference ? (
                <p style={styles.vehicleMeta}>
                  Interné označenie: {vehicle.internal_reference}
                </p>
              ) : null}
              {vehicle.brand || vehicle.model ? (
                <p style={styles.vehicleMeta}>
                  Značka / model:{" "}
                  {[vehicle.brand, vehicle.model].filter(Boolean).join(" ")}
                </p>
              ) : vehicle.make_model ? (
                <p style={styles.vehicleMeta}>
                  Značka / model: {vehicle.make_model}
                </p>
              ) : null}
              {vehicle.note ? (
                <p style={styles.vehicleMeta}>Poznámka: {vehicle.note}</p>
              ) : null}
              <p style={styles.vehicleMeta}>
                {vehicle.vehicle_id
                  ? "Prepojené s evidenciou"
                  : "Mimo evidencie / historický záznam"}
              </p>
            </div>
          ))}

          <div style={styles.buttonWrap}>
            <a href={detailUrl} style={styles.button}>
              Otvoriť požiadavku v aplikácii
            </a>
          </div>
          <p style={styles.footer}>
            Ak tlačidlo nefunguje, otvorte tento odkaz:
            <br />
            {detailUrl}
          </p>
        </div>
      </div>
    </div>
  );
}
