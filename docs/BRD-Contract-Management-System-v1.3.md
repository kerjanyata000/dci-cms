# Business Requirement Document

## Contract Management System

> Sumber: BRD Contract Management System v1.3 (2026-07-08) — dikonversi ke Markdown dari dokumen Word asli.


## 1. Document Control

| Item | Description |
| --- | --- |
| Document Title | Business Requirement Document - Contract Management System |
| System | Odoo / Contract Management System |
| Source | Requirement discussion and process flowcharts, updated with party-level contract view design |
| Version | 1.3 |
| Date | 2026-07-08 |
| Prepared For | Legal, Business, Finance, Management, and IT stakeholders |


## 2. Background

The current contract management activities require a structured system to maintain contract documents, contract metadata, party information, review status, signing status, amendment history, supporting documents, and contract lifecycle monitoring in a centralized and traceable manner.

A Contract Management System is required to support Legal users in managing contract records at Party level. Each Party detail shall provide visibility of related contracts, amendment/addendum records, novation or counterparty change history, early termination records, supporting documents, SO synchronization information, and related audit history. The system shall also allow users to search using Party criteria and/or Contract criteria, while presenting the relevant records within the related Party context based on access rights.

The proposed solution is to implement or enhance the Contract Management System in Odoo using a party-centric record structure, with supporting integration to Odoo Sales Order data, Party Master/Odoo Partner mapping, document extraction/indexing, and e-signature process where applicable.


## 3. Objective

The objective of this project is to provide a centralized, controlled, and traceable Contract Management System to support contract administration and lifecycle monitoring by Legal and relevant stakeholders.

1. To centralize Party records, related contract records, contract documents, supporting documents, and contract-related metadata in Odoo.
2. To provide search, view, and smart search capability using Party criteria and/or Contract criteria, with contract records displayed within the related Party context.
3. To support the creation of new contract records under the selected Party, including document upload, metadata capture, extraction/indexing, and validation against Party Master data where applicable.
4. To allow controlled update of non-sensitive contract metadata while preventing direct changes to sensitive legal, tax, and counterparty information.
5. To support contract review status updates, counterparty review, manual signature handling, and e-signature handling.
6. To support Change Counterparty, Amendment/Addendum, and Early Termination actions as Legal-managed contract lifecycle actions without internal approval workflow.
7. To maintain amendment/addendum, novation or counterparty change, termination, supporting document, and SO synchronization history under the relevant Party and Contract context for audit and traceability.
8. To synchronize relevant Sales Order information from Odoo for contract activation, renewal monitoring, and contract summary update.
9. To provide a Party Master inquiry and Odoo Partner link/relink capability to maintain consistency between CMS Party data and Odoo master data.
10. To support renewal calendar and dashboard visibility based on renewal date, expiry date, and termination effective date.
11. To ensure contract access, contract actions, and document visibility follow role-based access rights and audit trail requirements.

## 4. Scope


### 4.1 In Scope

| No. | Scope Item | Description |
| --- | --- | --- |
| 1 | Login and Dashboard | User login validation, home screen, dashboard widget, renewal calendar, and action visibility based on access rights. |
| 2 | Party-level Contract Search and View | Search and view records using Party criteria and/or Contract criteria. Search results and detail view shall be presented in Party context, where related contracts, amendment/addendum records, novation/counterparty change history, termination history, supporting documents, SO information, and audit history can be viewed subject to access rights. |
| 3 | Add New Contract | Create contract record under selected Party, input contract metadata, upload contract document, store extracted metadata, validate key data against Party Master, and display the new contract in Party detail. |
| 4 | Edit Contract Details | Update allowed administrative metadata only. Sensitive fields such as counterparty, NPWP, legal address, contract value, contract period, and signed document shall follow controlled actions. |
| 5 | Contract Review Status Update | Manage document review and signature readiness, including counterparty review, revision required, ready for signature, e-sign/manual signing, fully signed, signature cancelled, expired, or declined. |
| 6 | Change Counterparty | Provide Legal-managed counterparty/party change action without approval, with change type, reason, effective date, Party Master validation, and history. Novation or party transfer history shall be visible in the relevant Party and Contract context. |
| 7 | Create Amendment / Addendum | Create amendment/addendum as a linked record to the parent contract, maintain its own document lifecycle, update contract history/current summary when fully signed, and display it under the related Party detail. |
| 8 | Early Termination | Create early termination record for active contracts, input termination details, manage termination document/signature if required, update contract status based on termination effective date, and display termination history under the related Party detail. |
| 9 | Upload Supporting Document | Upload, categorize, remove/void, and track supporting documents without changing contract lifecycle status. |
| 10 | SO Synchronization | Synchronize relevant Sales Order information from Odoo for fully signed or active contracts using Party/Odoo Partner reference and agreed matching criteria, including SO list, contract expiry update, and no-renewal/no-active-SO flag. |
| 11 | Parties Search and View | Provide the primary Party inquiry view, including Party details, related contracts, amendment/addendum records, novation/counterparty change history, termination records, supporting documents, SO information, Odoo Partner link status, and data comparison/mismatch status. |
| 12 | Audit Trail and History | Maintain audit history for contract creation, metadata update, document upload/removal, status update, party change, amendment/addendum, termination, and SO synchronization. |
| 13 | Notifications | Notify relevant users for key actions, pending activities, status changes, renewal/expiry events, and Odoo link or SO synchronization issues. |
| 14 | Parties - Add New Party | Create Party records, validate mandatory Party data, check duplicate records, check Odoo Partner availability, and save Party with proper Odoo link status. |
| 15 | Parties - Edit Party | Update allowed Party information through a controlled process with validation, Odoo data comparison where applicable, and audit trail. |
| 16 | Parties - Delete / Deactivate Party | Delete unused Party records or deactivate Party records that have been used in contracts or linked records, subject to validation and audit trail. |


### 4.2 Out of Scope

| No. | Out of Scope Item | Description |
| --- | --- | --- |
| 1 | Automatic Odoo Partner Master Creation | Automatic creation, update, approval, or deletion of Odoo Partner master data from CMS is excluded unless separately agreed. CMS may check, link, relink, or compare data against Odoo Partner records. |
| 2 | Legal Approval Workflow | Internal approval workflow for Change Counterparty, Amendment/Addendum, and Early Termination is not required in this scope. These are Legal-managed actions. |
| 3 | Contract Clause Negotiation Automation | Automated legal negotiation, legal decision-making, or clause recommendation is not included. |
| 4 | Automatic Contract Drafting from Templates | Full template-based contract generation is excluded unless separately agreed. The system may store uploaded contract documents and metadata. |
| 5 | Certified Legal Advice or Legal Risk Scoring | The system does not replace Legal review or provide certified legal advice. |
| 6 | Odoo SO Creation or Amendment | The CMS shall not create, modify, approve, or cancel Sales Orders. SO data is consumed for synchronization and reference only. |
| 7 | Invoice, Billing, Payment, and AR/AP Processing | Invoice creation, billing execution, payment processing, AR/AP settlement, and accounting posting are outside the CMS scope. |
| 8 | E-Sign Provider Commercial Setup | Commercial setup, licensing, and external provider administration for DocuSign or other e-signature providers are outside system implementation scope. |
| 9 | Historical Contract Migration | Bulk historical contract migration is excluded unless separately defined as a specific migration activity. |
| 10 | Advanced Analytics or BI Dashboard | Advanced analytics, predictive renewal, and external BI integration are excluded from this revision. |


## 5. Stakeholders

| Stakeholder | Role |
| --- | --- |
| Legal / Contract Admin | Main business owner and primary user responsible for contract record creation, review status management, counterparty change, amendment/addendum, early termination, and contract history maintenance. |
| Business User / Contract Requestor | User or department that requires contract visibility and may provide contract-related information or documents. |
| Counterparty | External party that reviews, confirms, or signs the contract document where applicable. |
| Signer | Authorized person who signs the contract manually or through e-signature provider. |
| Finance / Commercial User | Viewer or reference user who may need contract, SO, party, or commercial information for operational follow-up. |
| Management / Directors | View-only stakeholder with access to relevant contract information, monitoring, or reporting based on authorization. |
| IT / Odoo Support Team | Responsible for Odoo configuration, access rights, integration support, technical support, and system maintenance. |
| Odoo ERP / Sales Order Module | Source of Sales Order and partner information used for contract synchronization and party validation/linking. |
| E-Sign Provider | External system used for e-signature envelope creation, signer notification, signing completion, void, expired, or declined status update where applicable. |


## 6. High Level Business Process

The following process flows represent the high-level business process for the Contract Management System. The diagrams are intended for business alignment and requirement confirmation. Detailed system design, technical validation logic, database structure, API sequence, and UI-level implementation details shall be further elaborated by the vendor in the Functional Specification Document or technical design.


### 6.1. Login and Home Screen / Dashboard

User logs in to the CMS. The system validates access and displays the home screen or selected dashboard, including renewal calendar, pending actions, and relevant contract monitoring information based on user access rights.


### 6.2. Contracts - Party-level Search and View

User searches using Party criteria and/or Contract criteria. CMS returns results based on access rights and allows the user to open Party detail, where related contracts, contract documents, amendment/addendum records, novation or counterparty change history, termination history, supporting documents, SO information, and audit history can be viewed.


### 6.3. Contracts - Add New Contract

Legal user creates a new contract record under the selected Party, uploads a contract document, reviews extracted metadata, resolves required validation or mismatch, and saves the contract record for further review or lifecycle processing. The new contract shall be visible from the related Party detail.


### 6.4. Contracts - Edit Contract Details

Legal user updates allowed contract metadata. CMS validates mandatory information and saves updated data if validation passes. Sensitive contract or party data shall not be updated through general Edit Contract Details.


### 6.5. Contracts - Contract Review Status Update

Legal user updates document review status, sends the draft to counterparty, handles revision required, sets document as ready for signature, sends e-sign request or uploads manually signed document, and marks the document as fully signed when completed.


### 6.6. Contracts - Change Counterparty

Legal user performs Change Counterparty as a controlled action without internal approval. CMS validates contract status, change type, and Party Master availability, then applies the change and stores history if allowed. The related novation or party change history shall remain visible from the relevant Party and Contract context.


### 6.7. Contracts - Create Amendment / Addendum

Legal user creates an amendment/addendum as a linked record to the parent contract, prepares or uploads the document, manages revision/signing, and records the fully signed amendment/addendum as part of the parent contract history and related Party detail.


### 6.8. Contracts - Early Terminate

Legal user initiates early termination for an active contract, inputs termination details, manages termination document or confirmation, and CMS updates the contract to terminated based on the effective termination date. The termination record shall remain visible from the parent contract and related Party detail.


### 6.9. Contracts - Upload Supporting Document

User uploads supporting documents to the contract record, selects document type, provides description, and CMS stores the document with audit trail without changing the contract lifecycle status.


### 6.10. Contracts - SO Synchronization

CMS sends inquiry to Odoo to synchronize active Sales Order information for fully signed or active contracts using the related Party/Odoo Partner reference and other agreed identifiers. The result updates the linked SO list, contract summary, expiry information, or no-renewal/no-active-SO indicator where applicable, and is displayed within the Party and Contract context.


### 6.11. Parties - Search & View

User searches and views Party records. The Party detail is the primary view for related contract records, including contracts, amendments/addendums, novation or counterparty change history, termination records, supporting documents, SO information, and Odoo Partner link status. CMS allows authorized users to link or relink a Party to Odoo Partner, show data comparison, and maintain Odoo link status such as Linked, Pending, or Mismatch.


### 6.12. Parties - Add New Party

Authorized user creates a new Party record, inputs Party information, validates mandatory data and duplicate possibility, checks Odoo Partner availability, and saves the Party as Linked, Pending Odoo Link, or Unlinked based on the validation result.


### 6.13. Parties - Edit Party

Authorized user updates allowed Party information. CMS validates the updated data, compares sensitive data with Odoo Partner data where applicable, flags mismatch if required, and records the update in audit trail without changing existing contract history or signed documents.


### 6.14. Parties - Delete Party

Authorized user deletes or deactivates a Party record. CMS checks whether the Party is already used in contracts or other linked records. Unused Party records may be deleted based on policy, while used Party records shall be deactivated and retained for historical reference.


## 7. Business Requirements

| ID | Requirement |
| --- | --- |
| BR-CMS-001 | The system shall provide a centralized Contract Management System in Odoo for Legal to manage contract records, documents, metadata, and lifecycle status. |
| BR-CMS-002 | The system shall provide role-based access for Legal users, business users, Finance/commercial users, management viewers, and IT administrators. |
| BR-CMS-003 | The system shall allow users to search and view records using Party criteria and/or Contract criteria, with contract information displayed within the related Party context. |
| BR-CMS-004 | The system shall provide smart search capability based on metadata and indexed contract content, subject to access rights. |
| BR-CMS-005 | The system shall allow Legal users to create new contract records under the selected Party and upload contract documents. |
| BR-CMS-006 | The system shall store both extracted metadata from uploaded documents and user-confirmed contract metadata for validation and audit purposes. |
| BR-CMS-007 | The system shall validate sensitive party-related data against Party Master data where applicable and shall not allow such data to be freely edited in contract detail. |
| BR-CMS-008 | The system shall allow controlled update of administrative contract metadata through Edit Contract Details. |
| BR-CMS-009 | The system shall prevent direct counterparty change through general Edit Contract Details and shall provide a dedicated Change Counterparty action. |
| BR-CMS-010 | The system shall support contract review status updates, counterparty review, revision required handling, ready for signature, e-signature, manual signed document upload, and fully signed status. |
| BR-CMS-011 | The system shall allow Legal users to perform Change Counterparty without internal approval, with change type, reason, effective date, Party Master validation, audit trail, and related Party history visibility. |
| BR-CMS-012 | The system shall allow Legal users to create Amendment/Addendum records linked to the parent contract and visible from the related Party detail without internal approval workflow. |
| BR-CMS-013 | The system shall allow Legal users to initiate Early Termination for active contracts without internal approval workflow, and display termination history from the related Party detail. |
| BR-CMS-014 | The system shall allow users to upload supporting documents to contract records without changing contract lifecycle status. |
| BR-CMS-015 | The system shall synchronize relevant Sales Order information from Odoo for fully signed or active contracts. |
| BR-CMS-016 | The system shall provide Parties Search and View as the primary inquiry view, including related contracts, Odoo Partner link/relink status, and data comparison. |
| BR-CMS-017 | The system shall provide renewal calendar visibility based on renewal date, expiry date, and termination effective date. |
| BR-CMS-018 | The system shall maintain complete audit trail and history for contract creation, metadata changes, status updates, document activities, counterparty changes, amendments, terminations, SO synchronization, and Party-Odoo mapping activities. |
| BR-CMS-019 | The system shall provide notification capability for key contract events, pending actions, e-sign status changes, renewal/expiry monitoring, and integration exceptions. |
| BR-CMS-020 | The system shall not create, modify, cancel, or post Sales Orders, invoices, payments, or accounting entries as part of this Contract Management System scope. |
| BR-CMS-021 | The system shall display contract-related records at Party level, including contracts, amendment/addendum, novation or counterparty change history, early termination, supporting documents, SO information, and audit history, subject to access rights. |
| BR-CMS-022 | The system shall allow controlled update of Party records, including validation against CMS Party data and Odoo Partner data where applicable, with audit trail. |
| BR-CMS-023 | The system shall allow unused Party records to be deleted based on agreed policy and shall require used Party records to be deactivated instead of hard deleted. |


## 8. Functional Requirements


### 8.1 Login and Home Screen / Dashboard

| ID | Functional Requirement |
| --- | --- |
| FR-DASH-001 | The system shall allow users to access the Contract Management System after successful login and access validation. |
| FR-DASH-002 | The system shall display an error message if the user does not have valid access. |
| FR-DASH-003 | The system shall display home screen/dashboard information based on the user role and selected dashboard. |
| FR-DASH-004 | The system shall display renewal calendar or contract lifecycle agenda based on renewal date, expiry date, and termination effective date where applicable. |
| FR-DASH-005 | The system shall display pending actions or monitoring indicators relevant to the user access rights. |


### 8.2 Contracts - Party-level Search and View

| ID | Functional Requirement |
| --- | --- |
| FR-CNT-SV-001 | The system shall provide search capability for users to search Party records and related contracts using Party criteria and/or Contract criteria. |
| FR-CNT-SV-002 | The system shall allow users to search using Party criteria such as party name, NPWP/Tax ID, Odoo Partner ID, status, and type, and Contract criteria such as contract number, contract title, contract type, contract status, date range, expiry date, and related SO. |
| FR-CNT-SV-003 | The system shall support smart search based on Party metadata, contract metadata, and indexed contract content where available. |
| FR-CNT-SV-004 | The system shall display search results based on user access rights. |
| FR-CNT-SV-005 | The system shall allow users to open Party detail from search results and navigate to specific contract records from the Party detail. |
| FR-CNT-SV-006 | The system shall display Party details and related contract information, including contracts, metadata, documents, supporting documents, review status, current party information, amendment/addendum history, novation or counterparty change history, termination history, SO information, and audit history based on access rights. |
| FR-CNT-SV-007 | The system shall clearly distinguish current party/counterparty and original party/counterparty for contracts affected by Change Counterparty, novation, or party transfer. |


### 8.3 Contracts - Add New Contract

| ID | Functional Requirement |
| --- | --- |
| FR-CNT-ADD-001 | The system shall allow authorized Legal users to create a new contract record under an existing Party or after selecting/creating the relevant Party based on the agreed flow. |
| FR-CNT-ADD-002 | The system shall allow Legal users to input contract metadata such as contract title, type, category, selected Party, contract period, contract value, owner, department, and remarks where applicable. |
| FR-CNT-ADD-003 | The system shall allow Legal users to upload the contract document during contract creation. |
| FR-CNT-ADD-004 | The system shall perform document extraction/indexing where applicable and store extracted metadata separately from user-confirmed metadata. |
| FR-CNT-ADD-005 | The system shall compare key extracted data such as counterparty, contract number, period, value, signer, NPWP, and address against user-confirmed metadata or Party Master data where applicable. |
| FR-CNT-ADD-006 | The system shall flag mismatch or missing mandatory information for user review. |
| FR-CNT-ADD-007 | The system shall allow users to save the contract record as draft once mandatory data is completed, and show the draft contract under the related Party detail. |
| FR-CNT-ADD-008 | The system shall generate a unique contract reference number based on the agreed numbering rule. |
| FR-CNT-ADD-009 | The system shall display the newly created contract within the related Party detail together with other related contract records. |


### 8.4 Contracts - Edit Contract Details

| ID | Functional Requirement |
| --- | --- |
| FR-CNT-EDIT-001 | The system shall provide Edit Contract Details action for authorized users. |
| FR-CNT-EDIT-002 | The system shall allow users to update only allowed administrative metadata, such as internal title, internal PIC, department, category, tags, notes, reminder PIC, and notification recipients. |
| FR-CNT-EDIT-003 | The system shall not allow counterparty, legal name, NPWP, registered address, contract value, contract period, signed document, or contract status to be updated through general Edit Contract Details. |
| FR-CNT-EDIT-004 | The system shall validate mandatory fields before saving updated data. |
| FR-CNT-EDIT-005 | The system shall display validation error if mandatory data is missing or invalid. |
| FR-CNT-EDIT-006 | The system shall record edit activity in audit trail, including updated fields, previous value, new value, user, and date/time where applicable. |


### 8.5 Contracts - Contract Review Status Update

| ID | Functional Requirement |
| --- | --- |
| FR-CNT-RVW-001 | The system shall allow authorized Legal users to update contract document review status according to the agreed lifecycle. |
| FR-CNT-RVW-002 | The system shall allow Legal users to send the contract draft to counterparty and update the review status to Sent to Counterparty. |
| FR-CNT-RVW-003 | The system shall allow Legal users to mark counterparty feedback as accepted or revision required. |
| FR-CNT-RVW-004 | If revision is required, the system shall allow upload of a revised contract document and maintain document version history. |
| FR-CNT-RVW-005 | The system shall allow Legal users to mark the contract as Ready for Signature after the draft is accepted. |
| FR-CNT-RVW-006 | The system shall allow Legal users to choose between e-signature process and manual signed document upload. |
| FR-CNT-RVW-007 | Before sending for e-signature, the system shall validate the latest approved document, counterparty, signer information, contract period/value where applicable, and absence of pending revision or change request. |
| FR-CNT-RVW-008 | The system shall create and send an e-signature envelope to the e-signature provider where applicable. |
| FR-CNT-RVW-009 | The system shall update signature status based on e-signature webhook or manual user action, including Sent for Signature, Fully Signed, Signature Cancelled, Signature Expired, and Signature Declined/Need Action. |
| FR-CNT-RVW-010 | For manual signed document upload, the system shall require Legal/Admin verification before marking the contract as Fully Signed. |
| FR-CNT-RVW-011 | The system shall allow resend for e-signature after cancelled, expired, or need-action status where applicable. |


### 8.6 Contracts - Change Counterparty

| ID | Functional Requirement |
| --- | --- |
| FR-CNT-CP-001 | The system shall provide Change Counterparty action from contract detail for authorized Legal users. |
| FR-CNT-CP-002 | The system shall require user to select change type, such as Correction, Legal Name Change, Merger/Acquisition, Novation/Party Transfer, or Other where applicable. |
| FR-CNT-CP-003 | The system shall validate allowed change type based on the current contract status. |
| FR-CNT-CP-004 | The system shall allow Correction only for Draft or Under Review contracts. |
| FR-CNT-CP-005 | The system shall block direct counterparty change for contracts in Waiting for Signature until the e-signature/signing process is cancelled or revised. |
| FR-CNT-CP-006 | The system shall allow Party Change for Active contracts without internal approval. |
| FR-CNT-CP-007 | The system shall validate that the new counterparty is available in Party Master or require the user to create/select an available Party based on agreed flow. |
| FR-CNT-CP-008 | The system shall require reason and effective date for counterparty change. |
| FR-CNT-CP-009 | The system shall allow supporting document upload where required by change type. |
| FR-CNT-CP-010 | The system shall apply the counterparty change and maintain original party, current party, change type, effective date, reason, supporting document, Party-level history, and audit trail. |
| FR-CNT-CP-011 | For Novation or Party Transfer, the system shall maintain the novation/party transfer history linked to the parent contract and make it visible from the relevant Party detail. |


### 8.7 Contracts - Create Amendment / Addendum

| ID | Functional Requirement |
| --- | --- |
| FR-CNT-AMD-001 | The system shall allow Legal users to create Amendment/Addendum records from an existing contract. |
| FR-CNT-AMD-002 | The system shall create Amendment/Addendum as a linked record to the parent contract and shall not overwrite the original contract document. The record shall be visible from the related Party detail. |
| FR-CNT-AMD-003 | The system shall allow Legal users to input document type, title, change category, effective date, reason/background, and summary of changes. |
| FR-CNT-AMD-004 | The system shall allow Legal users to upload or prepare amendment/addendum document draft. |
| FR-CNT-AMD-005 | The system shall manage amendment/addendum document review, revision, ready for signature, e-signature/manual signature, and fully signed status. |
| FR-CNT-AMD-006 | The system shall not require internal approval workflow for Amendment/Addendum. |
| FR-CNT-AMD-007 | Once fully signed, the system shall store the amendment/addendum in contract history, display it under the related Party detail, and update current contract summary where applicable, while retaining original contract data. |
| FR-CNT-AMD-008 | The system shall allow users to view amendment/addendum records from Party detail with clear reference to the parent contract. |


### 8.8 Contracts - Early Terminate

| ID | Functional Requirement |
| --- | --- |
| FR-CNT-TERM-001 | The system shall allow Legal users to initiate Early Termination from an active contract. |
| FR-CNT-TERM-002 | The system shall create a termination record linked to the parent contract. |
| FR-CNT-TERM-003 | The system shall allow Legal users to input termination type, termination effective date, reason, summary, and outstanding obligation notes where applicable. |
| FR-CNT-TERM-004 | The system shall allow Legal users to upload termination document or supporting evidence. |
| FR-CNT-TERM-005 | The system shall manage termination document signing or confirmation where required. |
| FR-CNT-TERM-006 | The system shall not require internal approval workflow for Early Termination. |
| FR-CNT-TERM-007 | If termination effective date is in the future, the parent contract shall remain Active with a termination scheduled indicator until the effective date. |
| FR-CNT-TERM-008 | Once termination is completed or effective, the system shall update the parent contract status to Terminated and store termination history under the parent contract and related Party detail while retaining original expiry date. |
| FR-CNT-TERM-009 | The system shall allow users to view early termination records from Party detail with clear reference to the parent contract. |


### 8.9 Contracts - Upload Supporting Document

| ID | Functional Requirement |
| --- | --- |
| FR-CNT-SUP-001 | The system shall allow authorized users to upload supporting documents from contract detail or from the contract section within Party detail. |
| FR-CNT-SUP-002 | The system shall allow users to select document type/category, input description, and upload supporting document file. |
| FR-CNT-SUP-003 | The system shall validate required information, file type, file size, and user access before saving the document. |
| FR-CNT-SUP-004 | The system shall save the supporting document and update the supporting document list without changing contract lifecycle status. |
| FR-CNT-SUP-005 | The system shall allow authorized users to remove or void a supporting document with audit trail. Hard delete shall be restricted based on agreed policy. |
| FR-CNT-SUP-006 | The system shall record upload, update, remove, or void activity in audit trail. |


### 8.10 Contracts - SO Synchronization

| ID | Functional Requirement |
| --- | --- |
| FR-CNT-SO-001 | The system shall trigger SO synchronization when a contract becomes Fully Signed and through batch scheduler for active contracts based on agreed schedule. |
| FR-CNT-SO-002 | The system shall send inquiry to Odoo using the related Party/Odoo Partner ID, contract reference, or other agreed matching data to search for related active Sales Order information. |
| FR-CNT-SO-003 | The system shall validate Party/Odoo Partner information before performing SO inquiry. |
| FR-CNT-SO-004 | If related SO information is found, the system shall update linked SO list and contract summary and display the result within the Party and Contract context. |
| FR-CNT-SO-005 | For fully signed contracts with SO found, the system shall update the contract status to Active where applicable. |
| FR-CNT-SO-006 | For active contracts with SO found, the system shall update SO list and contract expiry/renewal information where applicable. |
| FR-CNT-SO-007 | If no active SO is found for an active contract, the system shall flag the contract as No Active SO / Renewal Not Found based on agreed business rule. |
| FR-CNT-SO-008 | SO synchronization shall not overwrite signed contract document or original contract data. |
| FR-CNT-SO-009 | The system shall record SO synchronization result, timestamp, error, and updated fields in audit trail or integration log. |


### 8.11 Parties - Search & View

| ID | Functional Requirement |
| --- | --- |
| FR-PTY-SV-001 | The system shall provide Parties menu as the primary inquiry view for authorized users to search and view Party records and related contract records. |
| FR-PTY-SV-002 | The system shall allow users to search Party records by Party criteria such as party name, NPWP/Tax ID, Odoo Partner ID, status, and type, and by related Contract criteria such as contract number, title, type, status, expiry date, renewal date, and related SO. |
| FR-PTY-SV-003 | The system shall display Party detail, legal name, NPWP/Tax ID, registered address, contact information, Odoo link status, related contracts, amendment/addendum records, novation or counterparty change history, termination records, supporting documents, and SO information based on access rights. |
| FR-PTY-SV-004 | The system shall allow authorized users to link or relink a CMS Party to an Odoo Partner. |
| FR-PTY-SV-005 | The system shall check Odoo Partner availability using name, NPWP/Tax ID, customer/vendor code, or other agreed identifier. |
| FR-PTY-SV-006 | The system shall display comparison between CMS Party data and Odoo Partner data before link/relink confirmation. |
| FR-PTY-SV-007 | If exact Odoo Partner match is found, the system shall allow user confirmation and update Odoo Link Status to Linked. |
| FR-PTY-SV-008 | If no match, multiple match, or mismatch is found, the system shall mark the link status as Pending or Mismatch and require user resolution. |
| FR-PTY-SV-009 | Relink Odoo Partner shall require reason and audit trail. |
| FR-PTY-SV-010 | The system shall allow users to navigate from Party detail to the selected contract, amendment/addendum, novation/counterparty change, termination, supporting document, or SO reference record based on access rights. |


### 8.12 Parties - Add New Party

| ID | Functional Requirement |
| --- | --- |
| FR-PTY-ADD-001 | The system shall provide Add New Party action for authorized users from the Parties menu. |
| FR-PTY-ADD-002 | The system shall allow users to input Party information, including legal name, party type, NPWP/Tax ID, registered address, contact person, contact details, and remarks where applicable. |
| FR-PTY-ADD-003 | The system shall validate mandatory Party information before the Party record can be saved. |
| FR-PTY-ADD-004 | The system shall check existing CMS Party records to reduce duplicate Party creation based on agreed identifiers such as legal name, NPWP/Tax ID, or other reference data. |
| FR-PTY-ADD-005 | The system shall check Odoo Partner availability using agreed identifiers such as party name, NPWP/Tax ID, customer code, vendor code, or other agreed matching criteria. |
| FR-PTY-ADD-006 | If an exact Odoo Partner match is found, the system shall display the Odoo Partner data comparison and allow the user to confirm linking the new CMS Party to the Odoo Partner. |
| FR-PTY-ADD-007 | If no match, multiple matches, or data mismatch is found, the system shall allow the user to save the Party as Pending Odoo Link or Unlinked based on agreed business rule and user confirmation. |
| FR-PTY-ADD-008 | The system shall generate a unique Party ID when the Party record is saved. |
| FR-PTY-ADD-009 | The system shall make the Party available for contract selection based on Party status and Odoo link status rules. |
| FR-PTY-ADD-010 | The system shall record Party creation, Odoo link result, user confirmation, and validation result in audit trail. |


### 8.13 Parties - Edit Party

| ID | Functional Requirement |
| --- | --- |
| FR-PTY-EDIT-001 | The system shall provide Edit Party action for authorized users from Party detail. |
| FR-PTY-EDIT-002 | The system shall allow authorized users to update allowed Party information, such as contact person, contact details, remarks, internal classification, and other agreed editable fields. |
| FR-PTY-EDIT-003 | The system shall treat sensitive Party information, such as legal name, NPWP/Tax ID, and registered address, as controlled data that requires validation against Odoo Partner data or additional confirmation based on agreed rule. |
| FR-PTY-EDIT-004 | The system shall validate mandatory fields, data format, and duplicate possibility before saving updated Party data. |
| FR-PTY-EDIT-005 | If the Party is linked to an Odoo Partner, the system shall display or maintain comparison between CMS Party data and Odoo Partner data where applicable. |
| FR-PTY-EDIT-006 | If updated Party data creates mismatch against Odoo Partner data, the system shall flag the Odoo Link Status as Mismatch or Pending Resolution based on agreed rule. |
| FR-PTY-EDIT-007 | The system shall allow authorized users to refresh, link, or relink Odoo Partner data through the agreed Party-Odoo link action where applicable. |
| FR-PTY-EDIT-008 | The system shall save updated Party data without overwriting existing signed contract documents or historical contract records. |
| FR-PTY-EDIT-009 | The system shall record Party data updates, previous value, new value, user, date/time, reason where required, and Odoo mismatch result in audit trail. |


### 8.14 Parties - Delete Party

| ID | Functional Requirement |
| --- | --- |
| FR-PTY-DEL-001 | The system shall provide Delete / Deactivate Party action for authorized users from Party detail. |
| FR-PTY-DEL-002 | The system shall check whether the Party is used in any contract, amendment/addendum, termination record, supporting document, SO synchronization reference, or other linked record before deletion or deactivation. |
| FR-PTY-DEL-003 | If the Party has not been used in any contract or linked record, the system may allow hard delete based on agreed policy and access rights. |
| FR-PTY-DEL-004 | If the Party has been used in any contract or linked record, the system shall prevent hard delete and allow deactivation instead. |
| FR-PTY-DEL-005 | The system shall require user confirmation and reason before deleting or deactivating a Party record. |
| FR-PTY-DEL-006 | The system shall ensure deactivated Party records are not available for new contract selection unless reactivated or allowed by admin override. |
| FR-PTY-DEL-007 | The system shall retain historical Party reference in existing contracts, signed documents, change history, and audit trail after Party deactivation. |
| FR-PTY-DEL-008 | The system shall record delete, deactivate, reactivate, or failed delete attempt in audit trail, including user, date/time, reason, and validation result. |


## 9. Status Definitions


### 9.1 Contract Lifecycle Status

| Status | Description |
| --- | --- |
| Draft | Contract record is created but document and metadata are not yet finalized. |
| Under Review | Contract draft is being reviewed internally or by Legal. |
| Sent to Counterparty | Contract draft has been sent to counterparty for review or confirmation. |
| Revision Required | Counterparty or Legal requires document revision before continuing. |
| Ready for Signature | Contract document has been accepted and is ready for signing process. |
| Sent for Signature | Contract document has been sent for e-signature or is in signing process. |
| Fully Signed | Contract has been signed by all required parties. |
| Active | Contract is active for operational monitoring, typically after fully signed and related SO/activation condition is satisfied. |
| Expired | Contract has reached its expiry date without active renewal. |
| Termination Scheduled | Early termination has been completed or scheduled with future effective date, while the contract remains active until the effective date. |
| Terminated | Contract has ended before original expiry date due to early termination. |
| Cancelled | Contract process has been cancelled before fully signed or activation. |


### 9.2 Signature Status

| Status | Description |
| --- | --- |
| Not Started | Signature process has not started. |
| Sent for Signature | E-signature envelope has been created and sent to signers. |
| Fully Signed | All signers have completed signing and signed document is available. |
| Signature Cancelled | E-signature request has been voided/cancelled. |
| Signature Expired | E-signature request has expired before completion. |
| Signature Declined / Need Action | Signer declined or the signing process requires user follow-up. |


### 9.3 Amendment/Addendum Status

| Status | Description |
| --- | --- |
| Draft | Amendment/Addendum record has been created but not finalized. |
| Under Review | Amendment/Addendum draft is being reviewed or revised. |
| Ready for Signature | Amendment/Addendum is ready for signing. |
| Waiting for Signature | Amendment/Addendum is being signed manually or through e-signature. |
| Fully Signed | Amendment/Addendum has been signed and linked to parent contract history. |
| Cancelled | Amendment/Addendum process has been cancelled. |


### 9.4 Termination Status

| Status | Description |
| --- | --- |
| Draft | Termination record is created but not yet finalized. |
| In Progress | Termination details or document are being prepared. |
| Waiting for Signature / Confirmation | Termination document or confirmation is waiting for completion. |
| Completed | Termination process is completed and ready to update or has updated the parent contract based on effective date. |
| Cancelled | Termination process has been cancelled. |


### 9.5 Party Odoo Link Status

| Status | Description |
| --- | --- |
| Unlinked | Party has not been linked to Odoo Partner. |
| Pending Odoo Link | Party requires manual link or confirmation to Odoo Partner. |
| Linked | Party is linked to an Odoo Partner ID. |
| Mismatch | CMS Party data and Odoo Partner data have differences that require review. |
| Relink Required | Existing Odoo Partner mapping is suspected to be incorrect and requires correction. |
| Not Required | Party does not need Odoo Partner mapping based on agreed business rule. |


### 9.6 SO Synchronization Status

| Status | Description |
| --- | --- |
| Not Started | SO synchronization has not been performed. |
| In Progress | System is checking SO information from Odoo. |
| Synchronized | Related SO information has been found and stored in CMS. |
| No Active SO / Renewal Not Found | No active or relevant SO was found for the contract based on synchronization rule. |
| Error | SO synchronization failed due to validation or integration issue. |


### 9.7 Party Record Status

| Status | Description |
| --- | --- |
| Draft | Party record has been created but required data or validation is not yet completed. |
| Active | Party record is available for contract selection based on agreed access and validation rules. |
| Inactive | Party record is retained for historical reference but is not available for new contract selection. |
| Deleted / Removed | Party record has been removed based on agreed policy because it has not been used in any contract or linked record. |


## 10. Business Rules

| ID | Business Rule |
| --- | --- |
| BRL-CMS-001 | Only authorized users shall be allowed to access Contract Management System features based on role-based access rights. |
| BRL-CMS-002 | Search and view results shall be filtered based on user access rights at Party and Contract level. |
| BRL-CMS-003 | Smart Search shall search Party metadata, contract metadata, and indexed contract content only where the user has access to the related Party and Contract records. |
| BRL-CMS-004 | Sensitive party-related data such as legal entity name, NPWP/Tax ID, registered address, and signer identity shall be maintained in Party Master or controlled process, not as free-text contract metadata. |
| BRL-CMS-005 | Extracted metadata from contract document shall be stored separately from user-confirmed metadata and shall be used for validation and audit. |
| BRL-CMS-006 | Edit Contract Details shall only allow administrative metadata update and shall not allow direct change to counterparty, contract value, contract period, signed document, or contract status. |
| BRL-CMS-007 | Counterparty change shall be performed through Change Counterparty action and shall not require internal approval. |
| BRL-CMS-008 | Change Type = Correction shall only be allowed for Draft or Under Review contracts. |
| BRL-CMS-009 | Counterparty change for contracts in Waiting for Signature shall require cancellation or revision of the signing process before applying the change. |
| BRL-CMS-010 | Counterparty change shall store original counterparty, new counterparty, change type, effective date, reason, and audit trail. |
| BRL-CMS-011 | Amendment/Addendum shall be created as a linked record to the parent contract and shall not overwrite the original signed contract document. |
| BRL-CMS-012 | Amendment/Addendum shall not require internal approval workflow in this scope. Legal confirmation of document readiness is sufficient before signing. |
| BRL-CMS-013 | Early Termination shall only be initiated from Active contracts, unless otherwise allowed by admin override. |
| BRL-CMS-014 | If termination effective date is in the future, contract lifecycle status shall remain Active with Termination Scheduled indicator until the effective date. |
| BRL-CMS-015 | Upload Supporting Document shall not change contract lifecycle status or contract review status. |
| BRL-CMS-016 | Supporting document removal shall be recorded as remove/void with audit trail. Hard delete shall be restricted. |
| BRL-CMS-017 | Before sending for e-signature, the system shall validate latest approved document, counterparty, signer, contract period/value where applicable, and pending revision/change request. |
| BRL-CMS-018 | Manual signed document upload shall require Legal/Admin verification before Mark as Fully Signed. |
| BRL-CMS-019 | SO synchronization shall update linked SO list and contract summary only, and shall not modify signed contract document. |
| BRL-CMS-020 | Contract status Fully Signed may become Active based on SO synchronization or agreed activation condition. |
| BRL-CMS-021 | Party to Odoo Partner link/relink shall be maintained at Party level, not directly at Contract level. |
| BRL-CMS-022 | Relink to Odoo Partner shall require reason and audit trail. |
| BRL-CMS-023 | Renewal Calendar shall display agenda based on renewal date, expiry date, and termination effective date. |
| BRL-CMS-024 | Archived, if used, shall be treated as an administrative flag and shall not replace the original contract lifecycle status such as Expired or Terminated. |
| BRL-CMS-025 | All contract actions, document activities, synchronization results, and data changes shall be recorded for audit trail purposes. |
| BRL-CMS-026 | Party detail shall be the primary display context for contract-related records, including contracts, amendment/addendum, novation or counterparty change history, early termination, supporting documents, SO information, and audit history. |
| BRL-CMS-027 | Users may search using Party criteria and/or Contract criteria, but the result and detail view shall maintain the related Party context. |
| BRL-CMS-028 | Amendment/Addendum, Novation or Party Transfer, and Early Termination records shall remain linked to the parent contract and shall be visible from the related Party detail based on access rights. |
| BRL-CMS-029 | Party records already used in contracts or linked records shall not be hard deleted and shall be deactivated instead. |
| BRL-CMS-030 | Party deactivation shall not remove or change historical Party references in existing contracts, signed documents, amendments, terminations, or audit history. |
| BRL-CMS-031 | Deactivated Party records shall not be available for new contract selection unless reactivated or allowed by admin override. |


## 11. Data Requirements


### 11.1 Contract Data

| Data Element | Description |
| --- | --- |
| Contract ID | Unique system-generated contract reference. |
| Contract Title / Display Name | Internal contract title or display name. |
| Contract Type / Category | Classification such as NDA, MSA, PKS, Addendum, SOW, or other agreed type. |
| Current Counterparty / Party ID | Reference to the current Party Master record where the contract is displayed. |
| Contract Value | Commercial value where applicable. |
| Effective Date | Contract start or effective date. |
| Expiry Date | Contract end date. |
| Renewal Date | Date when renewal review should start. |
| Internal PIC / Owner | Internal responsible person or department. |
| Contract Status | Current contract lifecycle status. |
| Current Contract Summary | Current summary after amendment/addendum or SO synchronization, while retaining original data. |
| Original Counterparty / Party ID | Initial Party or counterparty recorded when the contract was created, retained for audit and novation/counterparty change history. |
| Party-level Contract Display | Indicator or relationship that enables the contract to be displayed under the related Party detail. |


### 11.2 Contract Document and Extracted Metadata Data

| Data Element | Description |
| --- | --- |
| Document Version | Version number or reference of uploaded contract document. |
| Document File Reference | Stored contract document or file reference. |
| Extracted Counterparty | Counterparty name detected from document. |
| Extracted Contract Number | Contract number detected from document. |
| Extracted Period | Effective date and expiry date detected from document. |
| Extracted Value | Contract value detected from document where applicable. |
| Extracted Signer | Signer information detected from document where applicable. |
| Extraction Confidence / Status | Extraction quality or status where available. |
| Validation Result | Match, mismatch, possible match, or confirmed by user. |


### 11.3 Review and Signing Data

| Data Element | Description |
| --- | --- |
| Review Status | Current document review status. |
| Counterparty Review Result | Accepted or revision required. |
| Signature Method | E-signature or manual signed document. |
| E-Sign Envelope ID | Envelope reference from e-signature provider where applicable. |
| Signer Information | Signer name, email, role, and signing sequence where applicable. |
| Signed Document Reference | Final signed document file reference. |
| Signature Audit Trail / Certificate | Signing evidence from e-sign provider where applicable. |


### 11.4 Counterparty Change Data

| Data Element | Description |
| --- | --- |
| Change Request ID | Unique reference for counterparty change activity. |
| Old Counterparty / Party | Counterparty or Party before change. |
| New Counterparty / Party | Counterparty or Party after change. |
| Change Type | Correction, Legal Name Change, Merger/Acquisition, Novation/Party Transfer, or Other. |
| Effective Date | Date when the counterparty change takes effect. |
| Reason | Reason for the change. |
| Supporting Document | Document evidence where applicable. |
| Change History | User, timestamp, and audit record. |
| Party Relationship History | Record of original party, current party, and related novation or party transfer history shown in Party detail. |


### 11.5 Amendment/Addendum Data

| Data Element | Description |
| --- | --- |
| Amendment/Addendum ID | Unique reference for the linked amendment/addendum record. |
| Parent Contract ID | Reference to original contract. |
| Document Type | Amendment or Addendum. |
| Change Category | Period change, value change, scope change, clause change, or other. |
| Effective Date | Date when amendment/addendum takes effect. |
| Summary of Changes | Short summary of what is changed. |
| Document Status | Current amendment/addendum lifecycle status. |
| Signed Document Reference | Final signed amendment/addendum document. |
| Related Party ID | Party detail where the amendment/addendum is displayed together with the parent contract. |


### 11.6 Early Termination Data

| Data Element | Description |
| --- | --- |
| Termination ID | Unique reference for termination record. |
| Parent Contract ID | Reference to the active contract being terminated. |
| Termination Type | Mutual agreement, unilateral notice, breach/default, convenience, or other. |
| Termination Effective Date | Date when termination becomes effective. |
| Termination Reason | Reason for early termination. |
| Termination Document | Termination agreement, letter, or supporting document. |
| Original Expiry Date | Original contract expiry date retained for audit. |
| Actual Termination Date | Actual termination date applied to the contract. |
| Related Party ID | Party detail where the termination record is displayed together with the parent contract. |


### 11.7 Supporting Document Data

| Data Element | Description |
| --- | --- |
| Supporting Document ID | Unique reference for uploaded supporting document. |
| Contract ID | Related contract record. |
| Document Type / Category | Customer letter, legal evidence, internal memo, meeting minutes, email confirmation, or other. |
| Description | Description of the supporting document. |
| File Reference | Uploaded file or storage reference. |
| Upload Information | Uploaded by and upload date/time. |
| Removed / Voided Information | Removal reason, removed by, and date/time where applicable. |


### 11.8 Party Data

| Data Element | Description |
| --- | --- |
| Party ID | Unique CMS Party reference. |
| Legal Name | Official party name. |
| NPWP / Tax ID | Tax identifier where applicable. |
| Registered Address | Registered legal address. |
| Party Type | Customer, vendor, counterparty, or other agreed type. |
| Contact Person | Party contact information where applicable. |
| Odoo Partner ID | Linked Odoo Partner reference. |
| Odoo Link Status | Unlinked, Pending, Linked, Mismatch, Relink Required, or Not Required. |
| Related Contract List | List or summary of contracts displayed under the Party detail. |
| Related Amendment/Addendum List | List or summary of amendment/addendum records related to contracts under the Party detail. |
| Related Novation / Counterparty Change History | History of novation, party transfer, or counterparty changes related to the Party. |
| Related Termination History | Termination records related to contracts under the Party detail. |
| Related SO Summary | Sales Order references synchronized from Odoo and displayed in Party context where applicable. |
| Party Status | Draft, Active, Inactive, or Deleted/Removed based on agreed Party lifecycle rule. |
| Created / Updated Information | Created by, created date, last updated by, and last updated date. |
| Deactivation / Removal Information | Deactivation/removal reason, performed by, and performed date/time where applicable. |


### 11.9 SO Synchronization Data

| Data Element | Description |
| --- | --- |
| SO Number | Odoo Sales Order number linked or synchronized to contract. |
| Odoo Partner ID | Partner reference used in SO inquiry. |
| SO Status | Current SO status returned from Odoo. |
| SO Period / Expiry Reference | Period or date information used for contract expiry/renewal update where applicable. |
| Sync Status | Not Started, In Progress, Synchronized, No Active SO/Renewal Not Found, or Error. |
| Last Sync Date | Date/time of last synchronization. |
| Error Message | Integration or validation error where applicable. |


### 11.10 Audit Trail Data

| Data Element | Description |
| --- | --- |
| Activity Type | Create, edit, upload, remove, revise, send, sign, change counterparty, addendum, terminate, sync, link, relink, or other activity. |
| Performed By | User or system that performed the activity. |
| Performed Date | Date and time of the activity. |
| Previous Value | Previous value for audited changes where applicable. |
| New Value | New value after change where applicable. |
| Remarks / Reason | Reason or remarks entered by user or system. |


## 12. Integration Requirements


### 12.1 E-Signature Provider Integration

| ID | Requirement |
| --- | --- |
| INT-ESIGN-001 | The system shall support sending contract, amendment/addendum, or termination document for e-signature where applicable. |
| INT-ESIGN-002 | The system shall create an e-signature envelope based on agreed document, signer, signing role, and signing sequence. |
| INT-ESIGN-003 | The system shall receive e-signature webhook/status update for completed, voided, expired, declined, or failed signing events. |
| INT-ESIGN-004 | The system shall store signed document and signing evidence/audit trail received from the e-signature provider where applicable. |
| INT-ESIGN-005 | The system shall support resend or re-initiation of e-signature process based on agreed status and business rule. |


### 12.2 Document Extraction and Indexing

| ID | Requirement |
| --- | --- |
| INT-DOC-001 | The system shall support extraction or indexing of uploaded contract documents where applicable. |
| INT-DOC-002 | Extracted metadata shall be stored per document version and compared against user-confirmed metadata or Party Master data. |
| INT-DOC-003 | The system shall flag mismatch or low-confidence extraction result for user review. |
| INT-DOC-004 | Smart Search shall use indexed metadata and contract content based on access rights and agreed search capability. |


### 12.3 Odoo Sales Order Synchronization

| ID | Requirement |
| --- | --- |
| INT-SO-001 | The system shall inquire related Sales Order information from Odoo based on agreed identifiers such as Party/Odoo Partner ID, contract reference, or other agreed matching criteria, and display results within the related Party and Contract context. |
| INT-SO-002 | The system shall support SO synchronization when a contract reaches Fully Signed status and through scheduled batch for active contracts. |
| INT-SO-003 | The system shall store SO synchronization result, linked SO list, last synchronization date, error message, and related Party/Contract display reference where applicable. |
| INT-SO-004 | The system shall not create, update, cancel, or approve Sales Orders in Odoo as part of this synchronization. |


### 12.4 Odoo Partner / Party Link Integration

| ID | Requirement |
| --- | --- |
| INT-PTY-001 | The system shall allow CMS Party to be linked to Odoo Partner ID. |
| INT-PTY-002 | The system shall check Odoo Partner availability using agreed identifiers such as party name, NPWP/Tax ID, customer code, or vendor code. |
| INT-PTY-003 | The system shall display data comparison between CMS Party and Odoo Partner before link/relink confirmation. |
| INT-PTY-004 | The system shall maintain Odoo Link Status and link/relink audit trail. |
| INT-PTY-005 | The system shall not automatically create or update Odoo Partner master data unless separately agreed. |


### 12.5 Notification Integration / Delivery

| ID | Requirement |
| --- | --- |
| INT-NOTIF-001 | The system shall provide Odoo inbox/activity notification and/or email notification based on agreed configuration. |
| INT-NOTIF-002 | Notification content shall include relevant contract reference, action required, status update, and link to related record where applicable. |


## 13. Notifications

The system shall provide notification capability to support contract follow-up, document review, signing, renewal monitoring, party/Odoo link resolution, and synchronization issue awareness. Notification may be delivered through Odoo inbox/activity notification and/or email notification based on the agreed configuration.

| ID | Notification Event | Recipient | Trigger | Expected Notification Content |
| --- | --- | --- | --- | --- |
| NOTIF-CMS-001 | New contract created | Legal / Assigned Contract Owner | Contract record is created or assigned | Contract ID, title, party, created by, and next action. |
| NOTIF-CMS-002 | Contract sent to counterparty | Legal / Contract Owner | Contract status becomes Sent to Counterparty | Contract ID, counterparty, sent date, and follow-up information. |
| NOTIF-CMS-003 | Revision required | Legal / Contract Owner | Counterparty or reviewer marks revision required | Contract ID, reason/remarks, revised document action required. |
| NOTIF-CMS-004 | Ready for signature | Legal / Signer where applicable | Contract status becomes Ready for Signature | Contract ID, document version, signer information, and signature action required. |
| NOTIF-CMS-005 | E-signature sent | Signer / Legal | E-signature envelope is sent | Contract ID, envelope reference, signer role, and signing link/status. |
| NOTIF-CMS-006 | Signature completed | Legal / Contract Owner | E-signature provider returns completed status or manual verification is completed | Contract ID, signed date, signed document availability, and next action. |
| NOTIF-CMS-007 | Signature cancelled / expired / declined | Legal / Contract Owner | E-signature provider returns voided, expired, or declined status | Contract ID, status, reason where available, and required follow-up. |
| NOTIF-CMS-008 | Counterparty changed | Legal / Contract Owner | Change Counterparty is applied | Contract ID, old counterparty, new counterparty, effective date, and reason. |
| NOTIF-CMS-009 | Amendment/Addendum fully signed | Legal / Contract Owner / Viewers where applicable | Amendment/Addendum status becomes Fully Signed | Parent contract ID, amendment/addendum ID, effective date, and summary update. |
| NOTIF-CMS-010 | Early termination scheduled | Legal / Contract Owner / Viewers where applicable | Termination record completed with future effective date | Contract ID, termination effective date, reason, and termination document reference. |
| NOTIF-CMS-011 | Contract terminated | Legal / Contract Owner / Viewers where applicable | Termination effective date reached or termination applied | Contract ID, original expiry date, actual termination date, and reason. |
| NOTIF-CMS-012 | Supporting document uploaded or removed | Legal / Contract Owner where applicable | Supporting document is uploaded, removed, or voided | Contract ID, document type, action, performed by, and date/time. |
| NOTIF-CMS-013 | SO synchronization completed | Legal / Contract Owner | SO synchronization returns active SO information | Contract ID, SO list, sync date, and updated contract summary. |
| NOTIF-CMS-014 | No active SO / renewal not found | Legal / Contract Owner | SO synchronization returns no active SO for active contract | Contract ID, sync date, and follow-up required. |
| NOTIF-CMS-015 | SO synchronization error | IT Support / Legal Admin | SO synchronization fails due to validation or integration error | Contract ID, error message, integration timestamp, and action required. |
| NOTIF-CMS-016 | Odoo Party link pending or mismatch | Legal Admin / Party Owner | Party link check returns no match, multiple match, or mismatch | Party ID, CMS Party data, Odoo candidate/status, and resolution action required. |
| NOTIF-CMS-017 | Renewal reminder | Legal / Contract Owner | Contract reaches renewal reminder date based on renewal calendar rule | Contract ID, party, expiry date, renewal date, and action required. |
| NOTIF-CMS-018 | Contract expiry reminder | Legal / Contract Owner | Contract is approaching expiry date based on agreed threshold | Contract ID, party, expiry date, status, and follow-up required. |
| NOTIF-CMS-019 | Party created with pending Odoo link | Legal Admin / Party Owner | New Party is saved as Pending Odoo Link or Unlinked | Party ID, party name, Odoo link status, validation result, and resolution action required. |
| NOTIF-CMS-020 | Party updated or deactivated | Legal Admin / Party Owner where applicable | Party data is updated, deactivated, reactivated, or removed | Party ID, action, performed by, date/time, reason, and impact information where applicable. |

End of current revision. Sections 6.12 Parties - Add New Party, 6.13 Parties - Edit Party, 6.14 Parties - Delete Party, and Functional Requirements 8.12 to 8.14 have been completed in this revision.
