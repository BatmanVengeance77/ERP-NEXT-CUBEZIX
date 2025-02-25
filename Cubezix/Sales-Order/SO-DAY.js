frappe.ui.form.on('Sales Order', {
    segment: async function(frm) {  // Add 'async' here
        if (frm.is_new()) {
            await set_delivery_date_from_segment(frm); // Now 'await' works
        }
    },
    before_save: function(frm) {
        if (frm.is_new()) {
            set_delivery_date_from_segment(frm);
        }
    }
});

async function set_delivery_date_from_segment(frm) {

    if (!frm.doc.segment) return; // Exit if no segment is selected

    frappe.db.get_value('Segment', { 'name': frm.doc.segment }, 'days')
        .then(response => {
            if (response.message && response.message.days) {
                let days = response.message.days;
                let delivery_date = new Date();
                delivery_date.setDate(delivery_date.getDate() + days);
                let formatted_date = delivery_date.toISOString().split('T')[0];

                frm.set_value("delivery_date", formatted_date);
                update_table_delivery_dates(frm, formatted_date);
            }
        });
}

function update_table_delivery_dates(frm, delivery_date) {
    if (frm.doc.items && frm.doc.items.length > 0) {
        frm.doc.items.forEach(item => {
            frappe.model.set_value(item.doctype, item.name, "delivery_date", delivery_date);
        });
    }
    frm.refresh_field("items");
}
