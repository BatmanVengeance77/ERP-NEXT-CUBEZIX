frappe.ui.form.on('Sales Order', {
    refresh: async function(frm) {  
        if (!frm.is_new()) {  // Only for existing records
            await update_contract_status(frm);
        }
    }
});

 async function update_contract_status(frm) {
    if (frm.doc.segment && (frm.doc.segment === "AMC" || frm.doc.segment === "Outsourcing")) {
        if (frm.doc.start_date && frm.doc.end_date) {
            let startDate = frappe.datetime.str_to_obj(frm.doc.start_date);
            let endDate = frappe.datetime.str_to_obj(frm.doc.end_date);
            let today = new Date();

            let totalMonths = monthDiff(startDate, endDate);
            let completedMonths = monthDiff(startDate, today);
            let remainingMonths = totalMonths - completedMonths;

            let status = "In-Progress"; // Default status (1 to 8 months)

            if (remainingMonths <= 0) {
                status = "Expired";
            } else if (remainingMonths <= 2) {
                status = "Approaching Renewal";
            } else if (remainingMonths <= 4) {
                status = "Near Renewal";
            } else if (remainingMonths > 8) {
                status = "In-Progress";
            }

            frm.set_value('custom_contract_status', status);
            frm.refresh_field('custom_contract_status');
            frm.dirty = false; 
            // Ensure the UI updates properly
            setTimeout(() => {
                change_font_style(frm, status);
            }, 300); // Short delay to ensure the field is rendered
        }
    }
}

// Function to calculate the difference between two dates in months
function monthDiff(startDate, endDate) {
    return (
        (endDate.getFullYear() - startDate.getFullYear()) * 12 +
        (endDate.getMonth() - startDate.getMonth())
    );
}

// Function to change font color and make it bold
function change_font_style(frm, status) {
    let fieldWrapper = frm.fields_dict.custom_contract_status.$wrapper;
    
    if (fieldWrapper) {
        let textElement = fieldWrapper.find(".control-value"); // Target the text inside the field

        textElement.css({
            "font-weight": "900",
            "font-size": "14px"         });

        if (status === "Expired") {
            textElement.css("color", "dimgray");
        } else if (status === "Approaching Renewal") {
            textElement.css("color", "red"); 
        } else if (status === "Near Renewal") {
            textElement.css("color", "orange"); 
        } else if (status === "In-Progress") {
            textElement.css("color", "blue"); 
        } 
    }
} 