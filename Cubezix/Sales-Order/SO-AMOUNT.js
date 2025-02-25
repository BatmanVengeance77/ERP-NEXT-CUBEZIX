frappe.ui.form.on('Sales Order', {
    segment: function(frm) {
        update_delivery_dates(frm);
    },
    total: function(frm) {
        update_delivery_dates(frm);
    },
    validate: function(frm) {
        update_delivery_dates(frm);  // Ensures final update before saving
    }
});

function update_delivery_dates(frm) {
    if (frm.doc.segment === "Infrastructure" && frm.doc.total) {
        let days_to_add = 0;

        // Define logic for delivery days based on the total amount
        if (frm.doc.total >= 10000 && frm.doc.total < 25000) {
            days_to_add = 15;
        } else if (frm.doc.total >= 25000 && frm.doc.total < 50000) {
            days_to_add = 30;
        } else if (frm.doc.total >= 50000 && frm.doc.total < 100000) {
            days_to_add = 60;
        } else if (frm.doc.total >= 100000 && frm.doc.total < 150000) {
            days_to_add = 90;
        } else if (frm.doc.total >= 150000) {
            days_to_add = 120;
        }

        if (days_to_add > 0) {
            let current_date = frappe.datetime.get_today();
            let new_delivery_date = frappe.datetime.add_days(current_date, days_to_add);
            
            // Update delivery_date on the spot (instantly)
            frm.set_value('delivery_date', new_delivery_date);

            // Loop through items and update each row immediately
            (frm.doc.items || []).forEach(row => {
                frappe.model.set_value(row.doctype, row.name, 'delivery_date', new_delivery_date);
            });

            // Ensure the field updates instantly without needing a save
            frm.refresh_field('delivery_date');
            frm.refresh_field('items');
        }
    }
}
