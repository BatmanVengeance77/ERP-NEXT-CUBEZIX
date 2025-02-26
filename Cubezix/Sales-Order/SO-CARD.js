frappe.ui.form.on('Sales Order', {
  refresh(frm) {
    if (!frm.doc.__islocal) {  // Runs only if the document is already saved
      setup_so_ui(frm);
    }
  },

  onload_post_render(frm) {  // Ensures UI updates quickly after rendering
    if (!frm.doc.__islocal) {
      setup_so_ui(frm);
    }
  }
});




async function setup_so_ui(frm) {
    var html_field = "custom_dashboard_html"; // Assuming this is the HTML field you want to update
    var html = "";
    var segment_condition_1 =
        frm.doc.segment == "Hardware" ||
        frm.doc.segment == "InfraHW";
    var segment_condition_2 =
        frm.doc.segment == "AMC" ||
        frm.doc.segment == "Digital Marketing" ||
        frm.doc.segment == "Outsourcing";
    var segment_condition_3 =
        frm.doc.segment == "Infrastructure" ;


    if (!frm.doc.__islocal && segment_condition_1) {
      await  Card_1(frm);
    }
   else  if (!frm.doc.__islocal && segment_condition_2) {
      await  Card_2(frm);
      await update_contract_status(frm);
    }
    else if (!frm.doc.__islocal && segment_condition_3) {
      await  Card_3(frm);
    }
}


function is_allowed_material_request(frm, item_group) {
  return new Promise((resolve, reject) => {
    var target_doc = "Item Group";
    frappe.model.with_doc(target_doc, item_group, function () {
      try {
        var source_doc = frappe.model.get_doc(target_doc, item_group);
        var custom_allow_material_request =
          source_doc.custom_allow_material_request;
        resolve(custom_allow_material_request);
      } catch (error) {
        reject(error); // Handle errors if document is not found or other issues
      }
    });
  });
}

async function get_service_item_count(frm) {
    var service_item = 0;
    var product_item = frm.doc.items.length;
    var ordered_qty = 0;
    var delivered_qty = 0;
    var pending_delivered_qty = 0;
    var total_qty = 0;
  
    var promises = frm.doc.items.map(async (item) => {
      try {
        var result = await is_allowed_material_request(frm, item.item_group);
        if (result) {
          service_item += 1;
          product_item -= 1;
        }
  
        if (item.ordered_qty) {
          ordered_qty = ordered_qty + item.ordered_qty;
        }
        if (item.delivered_qty) {
          delivered_qty = delivered_qty + item.delivered_qty;
        } else {
          pending_delivered_qty = pending_delivered_qty + 1;
        }
        total_qty = total_qty + 1;
      } catch (error) {
        console.error("Error checking item group:", error); // Log errors for debugging
      }
    });
  
    // Wait for all promises to complete
    await Promise.all(promises);
  
    return {
      service_item: service_item,
      product_item: product_item,
      ordered_qty: ordered_qty,
      delivered_qty: delivered_qty,
      pending_delivered_qty: pending_delivered_qty,
    };
  }
  
async function get_amounter(frm) {
    var totalPayments = frm.doc.payment_plan.length;
    var c = 0;

    var title = { paymentDone: "", totalPayments: "" };
    var amount = "";
    var date = "";

    for (var i = 0; i < totalPayments; i++) {
        const item = frm.doc.payment_plan[i];

        if (item.payment_status !== "Paid") {
            title.paymentDone = `${c}`;
            title.totalPayments = `${totalPayments}`;
            amount = format_currency(item.amount);
            date = `${moment(item.payment_date).format("DD-MM-YYYY")} (${item.terms})`;

            return { title, amount, date }; // Return the first unpaid payment
        }

        c++; // Increment counter for paid payments
    }

    // If all payments are paid, update the title accordingly
    title.paymentDone = `${c} `;
    title.totalPayments = `${totalPayments} `;

    return { title, amount: "Paid", date: "" };
}

function get_qty(frm) {
  var ttl = 0;
  for (var i = 0; i < frm.doc.items.length; i++) {
    const item = frm.doc.items[i];
    ttl = ttl + item.qty;
  }
  return ttl;
}

// function calculate_months_left(frm) {
//     if (frm.doc.delivery_date) {
//         let today = frappe.datetime.get_today();
//         let deliveryDate = frm.doc.delivery_date;

//         let todayMoment = moment(today, "YYYY-MM-DD");
//         let deliveryMoment = moment(deliveryDate, "YYYY-MM-DD");

//         if (deliveryMoment.isBefore(todayMoment, 'day')) {
//             return { monthsDone: "", totalMonths: "" };
//         } else {
//             let totalMonths = deliveryMoment.diff(todayMoment.clone().startOf('year'), 'months')- 1;
//             let monthsDone = todayMoment.diff(todayMoment.clone().startOf('year'), 'months');
            
//             return { monthsDone, totalMonths };
//         }
//     }
//     return { monthsDone: "", totalMonths: "" };
// }  
function calculate_months_left(frm) {
    if (frm.doc.start_date && frm.doc.end_date) {
        let today = frappe.datetime.get_today();
        let startDate = frm.doc.start_date;
        let endDate = frm.doc.end_date;

        let todayMoment = moment(today, "YYYY-MM-DD");
        let startMoment = moment(startDate, "YYYY-MM-DD");
        let endMoment = moment(endDate, "YYYY-MM-DD");

        if (endMoment.isBefore(startMoment, 'day')) {
            return { monthsDone: "", totalMonths: "" };
        }

        let totalDays = endMoment.diff(startMoment, 'days');
        let totalMonths = Math.ceil(totalDays / 30.44); // Using ceil for accuracy

        let daysDone = todayMoment.diff(startMoment, 'days');
        let monthsDone = Math.ceil(daysDone / 30.44);

        if (todayMoment.isBefore(startMoment, 'day')) {
            monthsDone = 0;
        } else if (todayMoment.isAfter(endMoment, 'day')) {
            monthsDone = totalMonths;
        }

        return { monthsDone, totalMonths };
    }
    return { monthsDone: "", totalMonths: "" };
}



function getGrandTotal(frm) {
    const formattedValue = frappe.format(frm.doc.grand_total, { fieldtype: "Currency" }, { currency: frm.doc.currency });
    return formattedValue.replace(/<\/?[^>]+(>|$)/g, ""); // Removes all HTML tags
}

function total_amount (frm) {
        // Get the grand_total value
        let grand_total = frm.doc.grand_total;

        // Check if grand_total exists and then display it with AED symbol
       if (grand_total !== undefined && grand_total !== null) {
            // Update the field's label to show "AED"
            frm.fields_dict['grand_total'].set_label('AED ' + grand_total);
        }
    }
    
function calculate_months_completed(frm) {
    if (!frm.doc.delivery_date) return 0;

    let delivery_date = new Date(frm.doc.delivery_date);
    let current_date = new Date();
    
    let months_completed = (current_date.getFullYear() - delivery_date.getFullYear()) * 12 +
                           (current_date.getMonth() - delivery_date.getMonth());
    
    return Math.max(months_completed, 0);
}

function applyContractStatusColor(frm) {
    if (!frm || !frm.doc) {
        console.error("frm or frm.doc is undefined");
        return "#DCFDE6"; // Default color to avoid breaking
    }

    let status = frm.doc.custom_contract_status || "";

    switch (status) {
        case "In-Progress":
            return "#DCFDE6"; // Light Green
        case "Near Renewal":
            return "orange";
        case "Approaching Renewal":
            return "red";
        case "Expired":
            return "dimgray";
        default:
            return "#DCFDE6";
    }
}

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
frm.dirty = false;  // Ensure `frm.dirty` is used correctly

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





async function Card_1(frm) {
    var html_field = "custom_dashboard_html";
    var html = "";
    // 1
      const grand_total = getGrandTotal(frm);
    //2
    const get_amounter_data = await get_amounter(frm);
    //3
    var item_data = await get_service_item_count(frm);
     const data = [
  {
    value1: frm.doc.customer_name,
    value2: frm.doc.full_name,
    color1: "#FDE3E6",
    color2: "#930931"
  },
  {
    value1: frm.doc.segment,
    value2: grand_total,
    color1: get_amounter_data.amount === "Paid" ? "#DCFDE6" : "#F4E9FF",
    color2: get_amounter_data.amount === "Paid" ? "#225a17" : "#680bb1"
  },
  {
    value1: `Total Items : ${frm.doc.total_qty}`,
    value2: `Delivered Items : ${item_data?.delivered_qty ?? "N/A"}`,
    color1: frm.doc?.total_qty === item_data?.ordered_qty ? "#DCFDE6" : "#DEF3FF",
    color2: frm.doc?.total_qty === item_data?.ordered_qty ? "#225a17" : "#5b53de"
  }
];
    const cssStyles = `<style>
    .containers { display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; }
    .cards { flex: 1; min-width: 200px; text-align: center; padding: 24px; border-radius: 15px; height: 110px; }
    .cards .divider { height: 1px;  position: relative; top:-10px; width: 170px; margin-left: 85px;  }
    </style>`;

    const htmlContent = data.map(item => {
        return `
     <div class="cards" style="background-color: ${item.color1} ; border: 0.5px solid darkblue">
     <div>
     <span style="color: ${item.color2}; font-weight: 600; ">${item.value1} </span> 
     </div>
     </br>
     <div class="divider" style="background: darkblue"></div>
     <div>
        <span style="padding-top:10px; ; font-weight: 600; color: ${item.color2}">  ${item.value2} </span>
     </div>
</div>

`;
    }).join('');

    frm.fields_dict[html_field].$wrapper.html(`${cssStyles} <div class="containers">${htmlContent}</div>`);
}
async function Card_2(frm) {
    
    var html_field = "custom_dashboard_html";
    // Fetch amounter data
    const get_amounter_data = await get_amounter(frm);
    // Calculate months left
    let total_months_left = calculate_months_left(frm);
    
    let { monthsDone, totalMonths } = total_months_left;
    let color = applyContractStatusColor(frm);
    

    
        const data = [
    { 
        value1: frm.doc.customer_name, 
        value2: frm.doc.full_name, 
        color1: "#FDE3E6", 
        color2: "#EC507D" 
    },
    { 
        value1: get_amounter_data?.date, 
        value2: get_amounter_data?.amount, 
        value3: get_amounter_data?.title?.paymentDone || "", 
        value4: get_amounter_data?.title?.totalPayments || "", 
        color1: get_amounter_data.amount === "Paid" ? "#DCFDE6" : "#F4E9FF",
        color2: get_amounter_data.amount === "Paid" ? "#225a17" : "#680bb1",
        color3: get_amounter_data.amount === "Paid" ? "darkgreen" : "darkblue",
        color4: "blue"
    },
    { 
        value1: frm.doc.segment, 
        value2: frm.doc.custom_contract_status || "", 
        value3: monthsDone|| "", 
        value4: totalMonths || "", 
        color1: color, 
        color2: "darkgreen",
        color3: "darkgreen",
        color4: "blue",
    }
  
];

    // CSS styles as a template string
    const cssStyles = `
    <style>
        .containers { display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; }
        .cards { flex: 1; min-width: 200px; text-align: center; padding: 10px; border-radius: 15px; height: 120px; position: relative; border: 0.5px solid; display: flex; flex-direction: column; justify-content: center; }
        .cards-circle { width: 60px; height: 60px; border-radius: 50%; position: absolute; top: 50%; left: 85%; transform: translate(-50%, -50%); display: flex; justify-content: center; align-items: center; font-weight: 600; }
        .inside-card { display: flex; flex-direction: column; justify-content: center; align-items: center; }
        .item-count { font-size: 17px; font-weight: 600; }
        .total-items { font-size: 14px; margin-top: -3px; }
    </style>`;

    // HTML content generation
const htmlContent = data.map(item => `
    <div class="cards" style="background-color: ${item.color1}; border: 0.5px solid ${item.color2}">
        <div>
            <span style="color: ${item.color2}; padding-top:10px; font-weight: 600;">${item.value1}</span> 
            <div class="main-circle">
                ${item.value3 && item.value4 
                    ? `<div class="cards-circle" style="background-color:${item.color3}; color:${item.color1}; font-weight: 600;">
                           <div class="inside-card">
                               <div class="item-count">${item.value3}</div>
                               <div class="total-items">/ ${item.value4}</div>    
                           </div>
                       </div>` 
                    : '<div class="empty-circle"></div>'} <!-- Ensure main-circle structure is not empty -->
            </div>
        </div>
        <br>
        <div>
            <span style="font-weight: 600; color: ${item.color2}">${item.value2}</span>
        </div>
    </div>`).join('');

    // Injecting the content into the ERPNext field
    frm.fields_dict[html_field].$wrapper.html(`${cssStyles} <div class="containers">${htmlContent}</div>`);
}
async function Card_3(frm) {
    var html_field = "custom_dashboard_html";
    var html = "";
    // 1
      const grand_total = getGrandTotal(frm);
    //2
    const get_amounter_data = await get_amounter(frm);
    //3
    var item_data = await get_service_item_count(frm);
     const data = [
  {
    value1: frm.doc.customer_name,
    value2: frm.doc.full_name,
    color1: "#FDE3E6",
    color2: "#930931"
  },
  {
    value1: frm.doc.segment,
    value2: grand_total,
    color1: get_amounter_data.amount === "Paid" ? "#DCFDE6" : "#F4E9FF",
    color2: get_amounter_data.amount === "Paid" ? "#225a17" : "#680bb1"
  },
  {
    value1: `Total Items : ${frm.doc.total_qty}`,
    value2: `Delivered Items : ${item_data?.delivered_qty ?? "N/A"}`,
    color1: frm.doc.total_qty === item_data?.delivered_qty ? "#DCFDE6" : "#DEF3FF",
    color2: frm.doc.total_qty === item_data?.delivered_qty ? "#225a17" : "#5b53de",
  }
];
    const cssStyles = `<style>
    .containers { display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; }
    .cards { flex: 1; min-width: 200px; text-align: center; padding: 24px; border-radius: 15px; height: 110px; }
    .cards .divider { height: 1px;  position: relative; top:-10px; width: 170px; margin-left: 85px;  }
    </style>`;

    const htmlContent = data.map(item => {
        return `
     <div class="cards" style="background-color: ${item.color1} ; border: 0.5px solid darkblue">
     <div>
     <span style="color: ${item.color2}; font-weight: 600; ">${item.value1} </span> 
     </div>
     </br>
     <div class="divider" style="background: darkblue"></div>
     <div>
        <span style="padding-top:10px; ; font-weight: 600; color: ${item.color2}">  ${item.value2} </span>
     </div>
</div>

`;
    }).join('');

    frm.fields_dict[html_field].$wrapper.html(`${cssStyles} <div class="containers">${htmlContent}</div>`);
}
