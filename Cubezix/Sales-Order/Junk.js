frappe.ui.form.on("Sales Order", {
    setup: function(frm){
        filter_bank_detials(frm);
    },
        before_submit: function(frm) {
        if (frm.doc.grand_total > 25000) {
            if (!frappe.user.has_role('MD')) {
                frappe.msgprint(__('Approval required from MD to submit this Sales Order as the amount exceeds 25,000.'));
                frappe.validated = false;
            } else {
                frappe.confirm(
                    'This Sales Order amount exceeds 25,000. Do you approve?',
                    function() {
                        frappe.validated = true;
                    },
                    function() {
                        frappe.validated = false;
                    }
                );
            }
        }
    },
    custom_approved_by(frm){
        t = true;
        if (frm.doc.custom_approved_by){
            t= false
        }
        frm.set_df_property("custom_approved_by", "hidden", t)
    },
     custom_approved_on(frm){
        t = true;
        if (frm.doc.custom_approved_on){
            t= false
        }
        frm.set_df_property("custom_approved_on", "hidden", t)
    },
   custom_approved(frm){
       if (frm.doc.custom_approved){
            frm.set_value("custom_approved_by", frappe.session.user)
            frm.set_value("custom_approved_on", frappe.datetime._date())
       }else{
           frm.set_value("custom_approved_by", "")
            frm.set_value("custom_approved_on", "")
       }
    },
    refresh: function(frm){
        // add_whatsapp_agent(frm)
        // allow_on_submit(frm);
        
        if (!frm.doc.__islocal){
            whatsapp_btn(frm);
            if(frm.doc.docstatus==1){
                approver_btn(frm);
            }
            update_wrapper_ui(frm);
        }
        if (!frm.doc.bank){
          setBankInfo(frm)
        }
        show_notes(frm);
        allow_date_change(frm);
       
    },
    start_date(frm){
      calculate_months(frm);  
    },
    end_date(frm){
        set_delivery_date(frm);
        calculate_months(frm);
    },
    company: function(frm) {
        if (frm.doc.company=='CubeZix Technologies') {
          (frm.set_value('letter_head', 'CT LH'));
        }
        else if (frm.doc.company=='CubeZix IT Infrastructure') {
          (frm.set_value('letter_head', 'CZ LH'));
        }
        else if (frm.doc.company=='SquareZix Digital Marketing') {
          (frm.set_value('letter_head', 'SZ LH'));
        }
     },
    segment: function(frm){
        not_amc(frm);
        set_delivery_date(frm)
    },
    start_date(frm){
        if(frm.doc.start_date && frm.doc.end_date){
        
        // frm.set_value("no_of_months",  get_month_diff(frm.doc.start_date, frm.doc.end_date));
        }
    },
});


function allow_date_change(frm){
    if (frm.doc.docstatus==1){
        const md = frappe.user.has_role("MD");
        if (!md){
            frm.set_df_property("start_date", "read_only", 1);
            frm.set_df_property("end_date", "read_only", 1);
        }
    }
}


function get_month_diff(d1, d2){
    var m =  moment(d2).diff(d1, "months", true);
    // console.log(m)
    return m;
}

function show_notes(frm) {
    const crm_notes = new erpnext.utils.CRMNotes({
        frm: frm,
        notes_wrapper: $(frm.fields_dict.notes_html.wrapper),

    });
    crm_notes.refresh();
}


var add_whatsapp_agent = function(frm) {
    // var currentCount = frm.doc.send_whatsapp;
    frm.add_custom_button(__(``), function() {
        frappe.msgprint(__("please wait In Progress.."))
        
        // if (currentCount >= 2){
        //   frappe.msgprint(__("Whatsappp already sent."));
        // }else{
            
        //     frm.doc.send_whatsapp = currentCount + 1;
        //     frm.doc.wp_sender = 1;
        //     frm.refresh_field('send_whatsapp');
        //     frm.dirty();
        //     frm.save()
            
        //     .then(function() {
        //         frm.doc.wp_sender = 0;
        //         // frm.doc.send_whatsapp = "";
        //         frm.dirty();
        //         frm.save(); // Save the cleared form
        //     })
        //     .catch(function(err) {
        //         console.error(err); // Handle any errors that occur during saving or submission
        //     });
        // }
        
    }).addClass('fa fa-whatsapp text-success').css('background-color', 'transparent');
}

function not_amc(frm){
    var dd = ["Hardware", "InfraHW", "Infrastructure", "Microsoft 365", "Subscriptions"];
    if (dd.includes(frm.doc.segment)){
        frm.set_value("amc_type", "Non AMC")
    }else{
        frm.set_value("amc_type", "")
    }
}

function set_delivery_date(frm){
    if (frm.doc.segment=="AMC" || frm.doc.segment=="Outsourcing" || frm.doc.segment=="Digital Marketing"){
        frm.set_value("delivery_date", frm.doc.end_date)
    }else if (frm.doc.segment=="Hardware"){
        var date = new Date();
        date.setDate(date.getDate() + 7);
        var day = date.getDate();
        var month = date.getMonth() + 1; // Months are zero-based
        var year = date.getFullYear();
        day = day < 10 ? '0' + day : day;
        month = month < 10 ? '0' + month : month;
        var formattedDate = day + '-' + month + '-' + year;
        frm.set_value("delivery_date", date);
    }else if (frm.doc.segment=="Infrastructure"){
        var date_1 = new Date();
        date_1.setDate(date_1.getDate() + 45);
        var day = date_1.getDate();
        var month = date_1.getMonth() + 1; // Months are zero-based
        var year = date_1.getFullYear();
        day = day < 10 ? '0' + day : day;
        month = month < 10 ? '0' + month : month;
        var formattedDate = day + '-' + month + '-' + year;
        frm.set_value("delivery_date", date_1);
    }
}

function allow_on_submit(frm){
    var md = frappe.user.has_role("MD");
    var status = frm.doc.docstatus;
    if(status ==="1" || status===1){
        frm.set_df_property("other_commitments", "allow_on_submit", 0);
        frm.set_df_property("inventory_table", "allow_on_submit", 0);
    }
    if(md && status ==="1" || status===1){
        frm.set_df_property("other_commitments", "allow_on_submit", 1);
        frm.set_df_property("inventory_table", "allow_on_submit", 1);
    }
}

function whatsapp_btn(frm) {
    frm.add_custom_button('Order', function () {
        frm.set_value("custom_whatsapp", frm.doc.custom_whatsapp+1);
        frm.save();
    }).css({"background-color":"#365E32", "width": "100px","display": "inline-block", "text-align":"center"})
}

function filter_bank_detials(frm){
    	frm.set_query("bank", function () {
		    var cmpy_si = frm.doc.company;
			if (cmpy_si
                 == "CubeZix IT Infrastructure") {
			    
				return {
					filters: [
						["name", "in", ["eib", "rak"]]
					]
				}
			}else if(cmpy_si == "Square Zix Digital Marketing"){
			    return {
					filters: [
						["name", "in", ["WIO"]]
					]
				}
			}else if(cmpy_si == "CubeZix Technologies"){
			    return {
					filters: [
						["name", "in", ["EIB"]]
					]
				}
			}
		});
}

function setBankInfo(frm){
    var bankField = frm.doc.company;
        var bankDetailsField = "bank";
        
         const bankDetailsMap = {
            "CubeZix IT Infrastructure": "eib",
            "SquareZix Digital Marketing": "WIO",
            "CubeZix Technologies": "CT - EIB"
        };
        frm.set_value(bankDetailsField, bankDetailsMap[bankField]);
}



function approver_btn(frm){
    
     if((frappe.user.has_role('MD') || frappe.user.has_role('Service Delivery Director')) && !frm.doc.custom_approved){
        frm.add_custom_button(__('Approve'), function(){
            approve_me(frm)
        // }).css({"background-color: green; width: 120px; display: inline-block; text-align: center; color: white; border-radius: 20px; box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1); transition: background-color 0.3s ease, transform 0.2s ease; cursor: pointer;"});
        }).css({"background-color":"#3572EF", "width": "100px","display": "inline-block", "text-align":"center"});
    }
    // else {
    //     frm.add_custom_button(__('Unapprove'), function(){
    //         un_approve_me(frm)
    //     }).css({"background-color":"#cc2929", "width": "100px","display": "inline-block", "text-align":"center"});
    // }
}


function approve_me(frm){
    frm.set_value("custom_approved", 1);
    frm.set_value("custom_approved_by", frappe.session.user);
    frm.set_value("custom_approved_on", frappe.datetime._date());
    frm.save('Update');
    
}



function un_approve_me(frm){
    frm.set_value("custom_approved", 0);
    frm.set_value("custom_approved_by", "");
    frm.set_value("custom_approved_on", "");
    frm.save('Update');
    
}


function update_wrapper_ui(frm){
    if(!frm.doc.__islocal){
        $(frm.fields_dict['custom_bank_details_html'].wrapper).html(frm.doc.bank_details);
    }
}



function calculate_months(cur_frm){
    if (cur_frm.doc.end_date && cur_frm.doc.start_date){
        var month_diff = moment(cur_frm.doc.end_date).diff(cur_frm.doc.start_date, 'months');
        cur_frm.set_value("no_of_months", month_diff);
        
    }
    
}





