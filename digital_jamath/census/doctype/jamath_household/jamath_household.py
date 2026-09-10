from digital_jamath.compat import frappe, Document, flt, _


class JamathHousehold(Document):
    def validate(self):
        self._normalize_phone()
        self._ensure_unique_phone_per_jamath()

    def before_save(self):
        self.calculate_zakat_eligibility()

    def _normalize_phone(self):
        import re

        digits = re.sub(r"\D", "", self.phone_number or "")
        if len(digits) >= 10:
            self.phone_number = digits[-10:]

    def _ensure_unique_phone_per_jamath(self):
        if not self.phone_number:
            return
        filters = {"phone_number": self.phone_number}
        if self.company:
            filters["company"] = self.company
        else:
            filters["company"] = ["in", ["", None]]
        for name in frappe.get_all("Jamath Household", filters=filters, pluck="name"):
            if name != self.name:
                frappe.throw(
                    _("Phone {0} is already registered for this jamath.").format(self.phone_number)
                )

    def calculate_zakat_eligibility(self):
        """
        Calculates Shariah Zakat eligibility score (0-100) based on
        household monthly income, health conditions, widow status, and housing.
        """
        score = 0
        income = flt(self.monthly_income)

        if income > 0 and income < 5000:
            score += 50
        elif income >= 5000 and income < 10000:
            score += 30
        elif income == 0:
            score += 60

        if self.has_critical_illness:
            score += 30
        if self.is_widow_household:
            score += 20
        if getattr(self, "housing_status", "") == "Rented":
            score += 10

        self.zakat_score = min(score, 100)

        if self.zakat_score >= 80:
            self.economic_status = "Zakat Eligible"
        else:
            self.economic_status = "Aam / Sahib-e-Nisab"
