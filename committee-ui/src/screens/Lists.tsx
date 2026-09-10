import { DocList } from "../components/DocList";
import { deskPath } from "../lib/api";

export function Households() {
  return (
    <DocList
      title="Households"
      doctype="Jamath Household"
      fields={["name", "membership_id", "phone_number", "economic_status", "zakat_score", "modified"]}
      columns={[
        {
          key: "membership_id",
          label: "ID",
          render: (r) => (
            <a
              className="font-medium text-brand-700 hover:underline"
              href={deskPath("Jamath Household", r.name)}
              target="_blank"
              rel="noreferrer"
            >
              {String(r.membership_id || r.name)}
            </a>
          ),
        },
        { key: "phone_number", label: "Phone" },
        { key: "economic_status", label: "Status" },
        { key: "zakat_score", label: "Zakat score" },
      ]}
      emptyHint="No households yet. Seed the demo jamath or add families in Desk."
    />
  );
}

export function ServiceTickets() {
  return (
    <DocList
      title="Service tickets"
      doctype="Jamath Service Request"
      fields={["name", "request_type", "status", "household", "modified"]}
      columns={[
        {
          key: "name",
          label: "Ticket",
          render: (r) => (
            <a
              className="font-medium text-brand-700 hover:underline"
              href={deskPath("Jamath Service Request", r.name)}
              target="_blank"
              rel="noreferrer"
            >
              {r.name}
            </a>
          ),
        },
        { key: "request_type", label: "Type" },
        { key: "status", label: "Status" },
        { key: "household", label: "Household" },
      ]}
    />
  );
}

export function Grants() {
  return (
    <DocList
      title="Zakat / grants"
      doctype="Jamath Grant Application"
      fields={["name", "applicant_household", "status", "amount_requested", "modified"]}
      columns={[
        {
          key: "name",
          label: "Application",
          render: (r) => (
            <a
              className="font-medium text-brand-700 hover:underline"
              href={deskPath("Jamath Grant Application", r.name)}
              target="_blank"
              rel="noreferrer"
            >
              {r.name}
            </a>
          ),
        },
        { key: "applicant_household", label: "Household" },
        { key: "status", label: "Status" },
        { key: "amount_requested", label: "Amount" },
      ]}
    />
  );
}

export function FundTypes() {
  return (
    <DocList
      title="Fund types"
      doctype="Fund Type"
      fields={["name", "fund_name", "fund_category", "modified"]}
      columns={[
        { key: "name", label: "Code" },
        { key: "fund_name", label: "Name" },
        { key: "fund_category", label: "Category" },
      ]}
    />
  );
}

export function Payments() {
  return (
    <DocList
      title="Payments"
      doctype="Payment Entry"
      fields={["name", "party", "paid_amount", "posting_date", "status", "modified"]}
      columns={[
        {
          key: "name",
          label: "Voucher",
          render: (r) => (
            <a
              className="font-medium text-brand-700 hover:underline"
              href={deskPath("Payment Entry", r.name)}
              target="_blank"
              rel="noreferrer"
            >
              {r.name}
            </a>
          ),
        },
        { key: "party", label: "Party" },
        { key: "paid_amount", label: "Amount" },
        { key: "posting_date", label: "Date" },
        { key: "status", label: "Status" },
      ]}
    />
  );
}
