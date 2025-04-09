1. Configure the MX Record
   In your domain's DNS settings, add an MX record like this:

Name Type Value TTL Priority
contact MX inbound-smtp.eu-central-1.amazonaws.com. 60 10
This means emails sent to contact@yourdomain.com will now route to SES in the eu-central-1 region.

Notes:
If you want all emails to the domain to route to SES, use @ as the name:

txt
Copier
Modifier
@ MX inbound-smtp.eu-central-1.amazonaws.com. 60 10
This creates a catch-all for the domain (e.g., anything@yourdomain.com).

2. Verify the Domain in SES
   In the SES Console:

Go to Domains under Verified identities.

Add your domain (e.g., yourdomain.com).

SES will give you a TXT record to add to your DNS.

Wait for SES to verify the domain (can take a few minutes).
