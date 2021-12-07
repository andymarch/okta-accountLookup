# Account Look-up

This sample cutomizes the Okta sign in widget to allow for a signle email to be linked
to multiple accounts which have a seperate username format. In the case of this
example the username is a account number.

## Caveats

- Each account has its own credentials rather than one per email address.
- The risk of leaking the presence of an account identifier based on email
  address is acceptable.


## Deploying the service

This sample is based on serverless, copy and rename the env.example to .env.
Provide values for the Okta tenant and an API key able to view all users. The
final parameter is a space seperated list of endpoints which can call this
service (this is used to set CORS headers) this should be set to the custom
domain of your Okta tenant or any page where you are using self-hosted widget.

You can then use serverless to deploy this lambda endpoint (🚀 AWS Serverless quickstart
[here](https://www.serverless.com/framework/docs/providers/aws/guide/quick-start/))


## Sign-in Widget Customization

The following customisation can be added either to the self hosted or the Okta
hosted sign-in widget. This called the lookup service on when the email field is
looses focus.

### Configuration

        var identifier;
      	config['transformUsername'] = function (username, operation) {
        if(identifier){ return identifier }
          else if(document.getElementById("contractNumber") && document.getElementById("contractNumber").value)
          { return document.getElementById("contractNumber").value}
          else { return username }
      	}

### After widget init
Make sure you replace the <YOURENDPOINT> with the service endpoint created when
deploying the service.

        oktaSignIn.on('ready', function (context) {
         if(context.controller == "primary-auth"){
           document.getElementsByName("identifier")[0].setAttribute("onblur", "checkIdentifier()")
         }
        })

        async function checkIdentifier(){            
        document.getElementsByClassName("button-primary")[0].disabled = true; 
        contractId = null
        if(document.getElementById("contractField")){
           document.getElementById("contractField").style.display = "none"; 
        }
        
        if(document.getElementsByName("identifier")[0].value.includes("@")){
          const response = await fetch('<YOURENDPOINT>/accountLookup/'+document.getElementsByName("identifier")[0].value);
          const responseJson = await response.json();
          if(responseJson.action === 'prompt'){
            //create the fields if they don't exist
            if(!document.getElementById("contractField")){
              var x = document.createElement("DIV")
              x.setAttribute("id","contractField")
              x.setAttribute("class", "o-form-fieldset o-form-label-top")
              var prompt = document.createTextNode("Your email is used as an identifier for multiple accounts please enter contract number.");
              x.appendChild(prompt)
              var x1 = document.createElement("DIV")
              x1.setAttribute("class", "okta-form-label o-form-label")

              var label = document.createElement("label")
              var t = document.createTextNode("Contract Number");
              label.setAttribute("for","contractNumber")
              label.appendChild(t)
              x1.appendChild(label)
              x.appendChild(x1)

              var x2 = document.createElement("DIV")
              x2.setAttribute("class", "o-form-input")

              var wrapSpan = document.createElement("SPAN")
              wrapSpan.setAttribute("class", "o-form-control okta-form-input-field input-fix")

              var contractNumber = document.createElement("INPUT")
              contractNumber.setAttribute("id","contractNumber")
              contractNumber.setAttribute("name","contractNumber")
              contractNumber.setAttribute("type","text")
              contractNumber.required = true;
              wrapSpan.appendChild(contractNumber)

              x2.appendChild(wrapSpan)
              x.appendChild(x2)

              document.getElementsByClassName('o-form-fieldset-container')[0].appendChild(x)
            }
            else {
              document.getElementById("contractField").style.display = "inherit"; 
            }
          }
          if(responseJson.action === 'proceed'){
            identifier = responseJson.contractid
          }
        }
        document.getElementsByClassName("button-primary")[0].disabled = false;
      }