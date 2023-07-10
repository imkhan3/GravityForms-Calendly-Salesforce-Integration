function CreateModal() {
    var parser = new DOMParser();
    var modal = parser.parseFromString(
        `
        <dialog id="myModal" style="width:93%; border: none;">
            <style>
                .calendly-inline-modal {
                    height: 1000px;
                }
                @media (max-width: 768px) {
                    .calendly-inline-modal {
                        height: 2350px;
                    }
                }
            </style>
            <span class="xModal" style="cursor: pointer; font-size: 2.5em;" formmethod="dialog">&times;</span>
            <div class="calendly-inline-modal " style="max-width: 100%;" data-auto-load="false"></div>
      </dialog>
      `,
        "text/html"
    );
    modal = modal.querySelector("#myModal");
    var span = modal.querySelector(".xModal");
    // When the user clicks on <span> (x), close the modal
    span.addEventListener("click", (e) => {
        modal.close();
    });

    // When the user clicks anywhere outside of the modal, close it
    modal.addEventListener("click", (e) => {
        const dialogDimensions = modal.getBoundingClientRect();
        if (
            e.clientX < dialogDimensions.left ||
            e.clientX > dialogDimensions.right ||
            e.clientY < dialogDimensions.top ||
            e.clientY > dialogDimensions.bottom
        ) {
            modal.close();
        }
    });
    return modal;
}

function autoFillCalendly(gform) {
    var prefill = { name: "", email: "", customAnswers: { a1: "", a2: "", a3: "" } };
    gform.querySelectorAll(".gfield_visibility_visible:not(.gfield--type-hidden) input").forEach((input) => {
        var inputName = input.placeholder;
        var inputVal = input.value;
        if (inputName == "First Name") {
            prefill["name"] = inputVal;
        }
        if (inputName == "Last Name") {
            prefill["name"] = prefill["name"] + " " + inputVal;
        }
        if (inputName == "Email" || inputName == "Company Email") {
            prefill["email"] = inputVal;
        }
        if (inputName == "Number of Employees") {
            prefill["customAnswers"]["a1"] = inputVal;
        }
        if (inputName == "Phone") {
            prefill["customAnswers"]["a2"] = inputVal;
        }
        if (inputName == "Company Name") {
            prefill["customAnswers"]["a3"] = inputVal;
        }
    });
    return prefill;
}

function pardotSubmit(gform, pardotHandler, pardotQueryString) {
    var values = pardotQueryString.split("&").map((item) => {
        var parts = item.split("=");
        parts[1] = gform.querySelector("[name=input_" + parts[1] + "]").value;
        return parts.join("=");
    });
    pardotQueryString = values.join("&");

    var iframe = document.createElement('iframe'); 
    var pardotURL = pardotHandler + "?" + pardotQueryString;
    iframe.id="pardot-submit";
    iframe.src = pardotURL; 
    iframe.height = '0px'; 
    iframe.width = '0px'; 
    document.body.appendChild(iframe);
}

function AppendCalendlyAssets() {
    let scriptTag = document.createElement('script');
    scriptTag.src = "https://assets.calendly.com/assets/external/widget.js";
    scriptTag.type = "text/javascript";
    scriptTag.async = true;
    document.body.appendChild(scriptTag);
}

function attachCalendly(gform, calendlyForm, company_size_input = "", EE_s=20, pardotHandler, pardotQueryString) {
    if(gform == null || gform == undefined || gform == "") {
        return;
    }
    if (company_size_input == null || company_size_input == "" || company_size_input == undefined) {
        company_size_input = document.evaluate(
            "//label[contains(., 'Company Size')]/following-sibling::div/input",
            gform,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
        ).singleNodeValue;
    }
    AppendCalendlyAssets();

    var submitButton = gform.querySelector(".gform_button[type='submit']");
    submitButton.addEventListener("click", function (e) {
        if (company_size_input.value >= EE_s && jQuery($jvcfpValidation).valid()) {
            e.preventDefault();
            e.stopPropagation();
            if ( document.querySelector("#pardot-submit") == null ) {
                pardotSubmit(gform, pardotHandler, pardotQueryString);
            }
            var modal = document.querySelector("#myModal");
            if (modal == null || modal == undefined || modal == "") {
                var modal = CreateModal();
                document.body.appendChild(modal);
                Calendly.initInlineWidget({
                    url: calendlyForm,
                    parentElement: document.querySelector(".calendly-inline-modal"),
                    prefill: autoFillCalendly(gform),
                    utm: {},
                });
            }
            modal.showModal();
        }
    });
}

jQuery(document).one('gform_post_render', function(){ // GRAVITY FORMS FIXES
    attachCalendly(my_selected_gform, my_calendlyForm, null, 10, my_pardotHandler, my_pardotQueryString);
});