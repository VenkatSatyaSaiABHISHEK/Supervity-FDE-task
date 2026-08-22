"""
SupportFlow AI — Database Initialization & Knowledge Base Seeding

On startup:
  1. Creates all SQLite tables
  2. Applies any needed column migrations
  3. Seeds the Support Knowledge Base collection (support-kb) with 7
     synthetic support documents and indexes them in ChromaDB.

The knowledge base covers:
  billing_policy, payment_and_refunds, subscription_faq,
  technical_troubleshooting, login_and_account_access,
  password_reset, general_support_faq
"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from .config import DATABASE_URL, SUPPORT_COLLECTION_ID, SUPPORT_COLLECTION_NAME

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─── Support Knowledge Base Documents ────────────────────────────────────────

KB_DOCUMENTS = [
    {
        "id": "kb-billing-policy",
        "name": "billing_policy.txt",
        "size": "2.1 KB",
        "summary": "SupportFlow billing cycles, prorated upgrades, accepted payment methods, and auto-renewal policy.",
        "content": """SupportFlow Billing Policy

Billing Cycle:
Customers are billed on a monthly or annual cycle depending on their subscription plan. Monthly billing occurs on the same date each month (the date of initial subscription). Annual billing occurs once per year on the subscription anniversary date.

Invoice Disputes:
If you believe you have been incorrectly charged, please contact support within 30 days of the charge appearing on your statement. Our billing team will investigate and issue corrections or credits where applicable. Disputes raised after 30 days may not be eligible for a full refund.

Tax and VAT:
Applicable taxes are added based on your billing address. Tax rates vary by region. SupportFlow is required to collect applicable sales tax or VAT in jurisdictions where required by law. Tax amounts appear as a separate line item on your invoice.

Plan Changes and Prorations:
If you upgrade your subscription plan mid-cycle, you will be charged a prorated amount for the remaining days in the current billing cycle. The new plan features activate immediately upon upgrade. If you downgrade, the difference is credited to your next billing cycle — you will not receive a cash refund for mid-cycle downgrades.

Payment Methods:
We accept Visa, Mastercard, American Express, PayPal, and bank transfers (for annual Enterprise plans). All payment data is encrypted and processed securely via Stripe. SupportFlow does not store full credit card numbers.

Auto-Renewal:
Subscriptions auto-renew unless cancelled at least 24 hours before the renewal date. You will receive a renewal reminder email 7 days before renewal and a final reminder 1 day before. To disable auto-renewal, go to Settings > Subscription > Manage Renewal.

Late Payment:
If a payment fails, your account remains active for a 5-day grace period. If payment is not resolved within that period, access to premium features will be restricted until a valid payment method is provided."""
    },
    {
        "id": "kb-payment-refunds",
        "name": "payment_and_refunds.txt",
        "size": "2.3 KB",
        "summary": "Duplicate charge resolution, refund eligibility by plan type, refund process and timelines.",
        "content": """Payment and Refunds Policy

Duplicate Charges:
If you have been charged more than once for the same subscription period, this is caused by a payment processing error. Please contact support immediately with your transaction IDs (found in your email receipt or bank statement). We will investigate and issue a full refund for the duplicate charge within 5–7 business days. No action is required on your part beyond submitting the refund request with the transaction details.

Double Billing Investigation:
Our billing team will cross-reference your charge timestamps, subscription ID, and payment gateway logs. You will receive an email confirmation once the duplicate is identified and the refund is initiated. The refunded amount will appear on your original payment method.

Refund Eligibility by Plan:
- Monthly plans: Refunds available within 7 days of the initial purchase or renewal date, for new subscribers only. Subsequent renewals are non-refundable unless due to documented service outage.
- Annual plans: Full refunds are available within 14 days of initial purchase. After 14 days, prorated refunds for unused complete months may be issued at our discretion.
- Add-ons and one-time purchases: Non-refundable unless there is a documented service outage or system error caused by SupportFlow.

Refund Process:
1. Submit a ticket via the support portal with your account email and order ID.
2. Our billing team reviews within 1–2 business days.
3. Approved refunds are processed within 5–10 business days.
4. The credit appears on your original payment method.
5. You will receive an email confirmation when the refund is issued.

Failed Payments:
If a payment fails, we retry 3 times over 5 days. You will receive email notifications at each failed attempt. If all retries fail, your account enters a restricted state until a valid payment method is provided via Account Settings > Billing.

Currency and Conversion:
All prices are listed and charged in USD unless otherwise specified at the time of purchase. International customers may incur currency conversion fees from their bank. SupportFlow is not responsible for bank-side conversion charges."""
    },
    {
        "id": "kb-subscription-faq",
        "name": "subscription_faq.txt",
        "size": "2.0 KB",
        "summary": "Available subscription plans, upgrades, cancellation process, data retention, and free trial information.",
        "content": """Subscription Plans FAQ

What plans are available?
SupportFlow offers three subscription tiers:
- Starter: $29/month — up to 3 users, 5 GB storage, email support, standard 48-hour response SLA.
- Professional: $99/month — up to 20 users, 50 GB storage, live chat + email support, 24-hour response SLA.
- Enterprise: Custom pricing — unlimited users, custom storage, dedicated support manager, 4-hour SLA (1-hour for critical issues), SSO, and advanced security features.

How do I upgrade my plan?
Log in to your account and go to Settings > Subscription > Upgrade Plan. You will see the prorated charge for the upgrade. The new features activate immediately. The charge is applied to the card on file.

How do I cancel my subscription?
Navigate to Settings > Subscription > Cancel Subscription. Your subscription remains active until the end of the current billing period. You will not be charged for the next cycle. Your data is retained for 30 days after cancellation.

Can I pause my subscription?
Subscription pausing is available for Professional and Enterprise customers only. Contact support with your reason for pausing. During the pause period, your account switches to read-only mode. Billing pauses for a maximum of 3 months.

What happens to my data after cancellation?
Your data is retained for 30 days after the cancellation date. After 30 days, all data — including documents, chat history, and account settings — is permanently and irreversibly deleted. We strongly recommend exporting your data before cancelling.

Can I switch from monthly to annual billing?
Yes. Go to Settings > Subscription > Change Billing Cycle. Switching to annual billing gives a discount equivalent to 2 months free per year (for example, Professional plan: $99 x 10 = $990/year instead of $99 x 12 = $1,188/year).

Is there a free trial?
Yes. A 14-day free trial is available for the Starter and Professional plans. No credit card is required during the trial. At the end of the trial, you will be prompted to enter payment details to continue.

How many users can I add?
Starter: 3 users. Professional: 20 users. Enterprise: unlimited. Additional user seats can be purchased as add-ons for Starter and Professional plans."""
    },
    {
        "id": "kb-technical-troubleshooting",
        "name": "technical_troubleshooting.txt",
        "size": "2.8 KB",
        "summary": "Troubleshooting guide for application crashes, PDF upload failures, API errors, and performance issues.",
        "content": """Technical Troubleshooting Guide

Application Crashes and Freezes:
If the application crashes, becomes unresponsive, or shows a blank white screen:
1. Clear your browser cache and cookies: Chrome/Firefox — press Ctrl+Shift+Del, select All Time, and clear all data.
2. Try a different browser. SupportFlow fully supports Chrome 110+, Firefox 110+, and Edge 110+. Safari may have display issues.
3. Disable all browser extensions, especially ad blockers and password managers, which can interfere with the application.
4. Check your internet connection speed (minimum 5 Mbps recommended).
5. Hard-reload the page: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (macOS).
6. If the crash persists, open the browser developer console (F12), go to the Console tab, and copy any red error messages. Include these in your support ticket.

PDF Upload Failures:
If a PDF file fails to upload or shows an error:
1. Verify the file size is within plan limits: Starter — 50 MB per file, Professional — 200 MB per file, Enterprise — 1 GB per file.
2. Ensure the PDF is not password-protected or has DRM restrictions. Remove password protection first using Adobe Acrobat or a PDF unlocking tool.
3. Check that the file extension is .pdf (lowercase). Files with .PDF uppercase extension may be rejected on some systems.
4. Try re-saving or re-exporting the PDF from its source application to create a clean copy.
5. Ensure your internet connection is stable during the upload. Disconnections during upload cause failures.
6. If the upload stalls for more than 3 minutes, cancel and retry. Do not navigate away during upload.

File Processing Errors (Status: "Failed"):
Documents showing "Failed" status after upload indicate a processing error:
- Corrupted file: Re-export or re-save the original document from its source.
- Unsupported format: SupportFlow supports PDF, DOCX, XLSX, TXT, PNG, and JPG. PPT support is in beta.
- Server-side issue: Wait 5–10 minutes and re-upload. If the error persists after 3 attempts, contact support with the document name and your account email.

API Integration Errors:
For HTTP 500 (Internal Server Error):
- Check your API key is valid: Settings > Developer > API Keys.
- Verify you are not exceeding your plan's rate limits (Starter: 100 req/min, Professional: 1000 req/min).
- Check the API status page: status.supportflow.ai

For HTTP 401 (Unauthorized):
- Your API key may have expired or been revoked. Regenerate it from Settings > Developer > API Keys.
- Verify the Authorization header is formatted correctly: Authorization: Bearer YOUR_API_KEY

For HTTP 429 (Rate Limited):
- You have exceeded the request rate limit. Implement exponential backoff with retry logic.
- Consider upgrading your plan for higher rate limits.

Slow Performance:
- Close unnecessary browser tabs and extensions.
- Ensure your device has at least 4 GB free RAM.
- Try using the application in an incognito/private browsing window.
- If the issue is server-side, check status.supportflow.ai for ongoing incidents."""
    },
    {
        "id": "kb-login-access",
        "name": "login_and_account_access.txt",
        "size": "2.2 KB",
        "summary": "Login failure steps, account locked recovery, 2FA issues, SSO configuration, and account suspension.",
        "content": """Login and Account Access Guide

Cannot Log In:
If you are unable to log in to your account:
1. Verify you are entering the correct email address. Check for typos or using a different email than the one used to register.
2. Check that Caps Lock is not enabled on your keyboard.
3. Try resetting your password using the Forgot Password link on the login page.
4. Clear your browser cache and cookies, then try again (Ctrl+Shift+Del).
5. Disable VPN or proxy connections, which may block access to SupportFlow servers.
6. Try logging in from a different browser or device to isolate the issue.
7. If you still cannot log in after completing these steps, contact support.

Account Locked:
Accounts are automatically locked after 5 consecutive failed login attempts for security purposes. The lock lasts 30 minutes.

To unlock immediately (without waiting):
- Use the Forgot Password link to initiate a password reset. Completing the password reset automatically removes the login lock.

Two-Factor Authentication (2FA) Issues:
If you are not receiving your 2FA code or the code is rejected:
- For authenticator apps (Google Authenticator, Authy): Ensure your phone's time is correct. Authenticator apps require accurate time sync. On Android: Settings > Date & Time > Automatic. On iOS: Settings > General > Date & Time > Set Automatically.
- For SMS codes: Ensure your phone has cellular signal and the correct phone number is on your account.
- If you have lost access to your authenticator device: Contact support with your account email and a government-issued ID for identity verification. We will disable 2FA on your account after verifying your identity.
- If backup codes were generated during 2FA setup, use one of those codes to log in and then reconfigure 2FA.

Logging In from a New Device:
For security, logging in from an unrecognized device triggers an email verification step. Check your inbox for a "Verify New Device" email and click the confirmation link. The link expires in 30 minutes. If expired, log in again to receive a new email.

Account Suspended:
Account suspension occurs due to:
1. Failed payments (unpaid invoices after grace period).
2. Violation of the Terms of Service.
3. Suspected unauthorized access or security breach.
Contact support to understand the reason for suspension and the steps to reinstate your account.

Single Sign-On (SSO) Issues:
Enterprise customers using SAML 2.0 SSO: If SSO login fails, contact your IT administrator to verify the IdP (Identity Provider) configuration. Provide your organization domain to SupportFlow support for server-side investigation."""
    },
    {
        "id": "kb-password-reset",
        "name": "password_reset.txt",
        "size": "1.7 KB",
        "summary": "Step-by-step password reset process, troubleshooting email delivery, and changing password while logged in.",
        "content": """Password Reset Guide

How to Reset Your Password:
1. Go to the SupportFlow login page.
2. Click "Forgot Password" below the login form.
3. Enter the email address associated with your account and click "Send Reset Link."
4. Check your inbox for an email from no-reply@supportflow.ai with the subject "Reset Your SupportFlow Password."
5. Click the "Reset Password" button in the email. The link is valid for 60 minutes.
6. Enter your new password. Requirements:
   - Minimum 8 characters
   - At least one uppercase letter (A–Z)
   - At least one number (0–9)
   - At least one special character (!, @, #, $, %, ^, &)
7. Re-enter the password in the Confirm Password field.
8. Click "Save New Password."
9. You will be redirected to the login page. Log in with your new credentials.

Password Reset Email Not Received:
- Check your spam or junk mail folder.
- Ensure you entered the exact email used to register your account.
- Add no-reply@supportflow.ai to your email whitelist or safe senders list.
- Gmail users: check the Promotions or Updates tab.
- Wait up to 5 minutes before requesting another reset email. Sending too many requests too quickly may cause delays.
- If still not received after 10 minutes, contact support directly.

Reset Link Expired:
If the reset link shows "Link Expired" (links expire after 60 minutes), return to the login page and request a new reset email. Expired links cannot be reactivated.

Changing Your Password While Logged In:
1. Click your profile avatar (top-right corner).
2. Go to Account Settings > Security.
3. Click "Change Password."
4. Enter your current password, then enter and confirm your new password.
5. Click "Save Changes." You will receive an email confirming the password change.

Cannot Remember Account Email:
Contact support at support@supportflow.ai with your full name and the approximate date you created the account. Our team will verify your identity and help locate your account."""
    },
    {
        "id": "kb-general-faq",
        "name": "general_support_faq.txt",
        "size": "1.9 KB",
        "summary": "Support hours, contact methods, SLA response times, ticket submission, GDPR compliance, and uptime SLA.",
        "content": """General Support FAQ

What are your support hours?
- Monday to Friday: 9:00 AM – 6:00 PM EST
- Saturday: 10:00 AM – 2:00 PM EST
- Sunday and Public Holidays: Closed (automated responses only)
- Enterprise customers: 24/7 emergency support for P1 critical issues.

How do I contact support?
- Email: support@supportflow.ai (responses within plan SLA)
- Live Chat: Available in-app (bottom-right widget) during business hours
- Support Portal: support.supportflow.ai (for ticket submission and tracking)
- Phone (Enterprise only): +1-800-555-0190

What are the SLA response times?
- Starter plan: 48 business hours for initial response
- Professional plan: 24 business hours for initial response
- Enterprise plan: 4 hours for standard issues; 1 hour for P1 critical issues
SLA clocks run during business hours only (Monday–Friday, 9 AM–6 PM EST).

How do I submit a support ticket?
Visit support.supportflow.ai and click "Submit a Ticket." Choose the category (Billing, Technical, Account), provide a detailed description including screenshots or error messages if applicable, and submit. You will receive an automatic confirmation email with your ticket ID.

How do I track my ticket status?
Log in to the support portal at support.supportflow.ai and navigate to "My Tickets." You can see the current status (Open, In Progress, Resolved, Closed), agent notes, and respond directly within the portal.

What information should I include in a support request?
- Account email address
- Description of the issue (what happened, when, what you were doing)
- Steps to reproduce the issue
- Screenshots or error messages (attach to the ticket)
- Browser name and version (for UI issues)
- Operating system (Windows 11, macOS Ventura, etc.)

Is SupportFlow GDPR compliant?
Yes. SupportFlow is fully GDPR compliant. To request data export, submit a GDPR Data Export Request via the support portal. To request data deletion, contact privacy@supportflow.ai. All requests are processed within 30 days as required by GDPR Article 17.

What is SupportFlow's uptime SLA?
SupportFlow guarantees 99.9% uptime for Professional and Enterprise plans (equivalent to less than 9 hours of downtime per year). Starter plans have a 99.5% uptime target. Scheduled maintenance windows are communicated at least 48 hours in advance via email and the status page."""
    }
]


def init_db():
    """Initializes SQLite tables and seeds the support knowledge base on startup."""
    from .models import database_models
    Base.metadata.create_all(bind=engine)

    # ── Schema migrations (add new columns if they don't exist) ───────────────
    db = SessionLocal()
    migration_statements = [
        "ALTER TABLE chat_sessions ADD COLUMN collection_id VARCHAR",
        "ALTER TABLE chat_messages ADD COLUMN ticket_category VARCHAR",
        "ALTER TABLE chat_messages ADD COLUMN ticket_category_confidence FLOAT",
        "ALTER TABLE chat_messages ADD COLUMN ticket_retrieval_confidence FLOAT",
        "ALTER TABLE chat_messages ADD COLUMN ticket_status VARCHAR",
        "ALTER TABLE chat_messages ADD COLUMN ticket_escalation_reason TEXT",
    ]
    for stmt in migration_statements:
        try:
            db.execute(text(stmt))
            db.commit()
        except Exception:
            db.rollback()
    db.close()

    # ── Seed Support Knowledge Base ───────────────────────────────────────────
    db = SessionLocal()
    try:
        from .models.database_models import Collection, Document
        from .services.rag_engine import RagEngine

        # Create the support-kb collection if it doesn't exist
        kb_col = db.query(Collection).filter(Collection.id == SUPPORT_COLLECTION_ID).first()
        if not kb_col:
            kb_col = Collection(
                id=SUPPORT_COLLECTION_ID,
                name=SUPPORT_COLLECTION_NAME,
                description="SupportFlow customer support knowledge base covering billing, technical issues, and account access.",
                icon_type="BookOpen"
            )
            db.add(kb_col)
            db.commit()
            print(f"[DB Seed] Created support knowledge base collection: {SUPPORT_COLLECTION_ID}")

        # Seed each KB document
        for doc_data in KB_DOCUMENTS:
            existing = db.query(Document).filter(Document.id == doc_data["id"]).first()
            if not existing:
                doc = Document(
                    id=doc_data["id"],
                    name=doc_data["name"],
                    size=doc_data["size"],
                    type="txt",
                    status="Indexed",
                    summary=doc_data["summary"],
                    ocr_text=doc_data["content"],
                    tags="support,knowledge-base",
                    collection_id=SUPPORT_COLLECTION_ID
                )
                db.add(doc)
                db.commit()

                # Index in ChromaDB
                try:
                    RagEngine.index_document(
                        document_id=doc_data["id"],
                        document_name=doc_data["name"],
                        pages_content=[(1, doc_data["content"])],
                        collection_id=SUPPORT_COLLECTION_ID
                    )
                    print(f"[DB Seed] Indexed KB document: {doc_data['name']}")
                except Exception as ve:
                    print(f"[DB Seed] ChromaDB indexing failed for {doc_data['name']}: {ve}")

        db.commit()
        print(f"[DB Seed] Support knowledge base seeding complete ({len(KB_DOCUMENTS)} documents).")

    except Exception as e:
        db.rollback()
        print(f"[DB Seed] ERROR during knowledge base seeding: {e}")
    finally:
        db.close()
