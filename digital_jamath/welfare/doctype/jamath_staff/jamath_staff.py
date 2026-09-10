# Copyright (c) 2026, Digital Jamath and contributors
# For license information, please see license.txt

from digital_jamath.compat import frappe
from frappe.model.document import Document


class JamathStaff(Document):
    def validate(self):
        if self.monthly_salary is not None and self.monthly_salary < 0:
            frappe.throw("Monthly salary cannot be negative.")
