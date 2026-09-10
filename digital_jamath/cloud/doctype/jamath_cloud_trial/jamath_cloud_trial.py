import frappe
from frappe.model.document import Document
from frappe.utils import date_diff, getdate, today


class JamathCloudTrial(Document):
    @property
    def days_remaining(self):
        if not self.trial_end:
            return 0
        return max(0, date_diff(getdate(self.trial_end), getdate(today())))

    def before_save(self):
        if self.status == "Trial" and self.trial_end and getdate(self.trial_end) < getdate(today()):
            self.status = "Expired"
