```markdown
# SAHKAAR

### Cooperative-Owned Digital Service & Workforce Management Platform

SAHKAAR is a cooperative-owned digital platform designed to connect **verified skilled workers, households, cooperative societies, and government programmes** through a transparent and accountable digital ecosystem.

Unlike conventional private service marketplaces, SAHKAAR focuses on **worker participation, consumer protection, cooperative governance, verified workforce management, welfare, certification, and government coordination**.

---

## 🚀 Vision

SAHKAAR aims to create a digital infrastructure where cooperative workers can participate in the formal service economy without losing their collective ownership or bargaining voice.

The platform is designed around one core principle:

> **Workers should have a voice in the system without allowing any individual worker, worker group, or administrator to gain unilateral control.**

At the same time, consumers should receive transparent and predictable pricing, while cooperative administrators should have the tools required to manage their workforce efficiently.

---

# 🎯 Problem

Skilled workers such as:

- Electricians
- Plumbers
- Carpenters
- Painters
- Domestic Helpers
- Caregivers
- Drivers
- Gardeners
- Cleaners
- Technicians

often operate through informal networks or fragmented local systems.

This creates several problems:

- Limited digital visibility
- Lack of structured worker records
- Difficulty discovering verified workers
- Limited access to certification and training
- Lack of transparent pricing governance
- Weak welfare and insurance tracking
- Poor workforce planning
- Limited access to government schemes
- No structured workforce analytics for cooperatives

Existing private service marketplaces primarily optimize for marketplace transactions.

SAHKAAR instead focuses on building a **cooperative-owned workforce ecosystem**.

---

# 💡 What SAHKAAR Provides

SAHKAAR consists of three major interfaces:

```text
                 SAHKAAR
                    │
       ┌────────────┼────────────┐
       │            │            │
     USER         WORKER        ADMIN
     APP           APP          PORTAL
       │            │            │
       └────────────┼────────────┘
                    │
              SAHKAAR BACKEND
                    │
          ┌─────────┴─────────┐
          │                   │
       DATABASE           FILE STORAGE
```

### User Application

Customers can:

- Discover services
- Request services manually
- Use AI-assisted service requests
- Select service date and time
- Provide location
- Upload service/problem photos
- Receive responses from eligible workers
- Select one worker
- Track service progress
- View invoices
- Pay digitally
- Rate and review workers
- View booking history
- Discover relevant government schemes

---

### Worker Application

Workers can:

- Manage their profile
- Select multiple skills
- Set availability
- Define service area
- Receive eligible job requests
- Accept or reject requests
- Manage active jobs
- Add actual material costs
- View earnings
- Participate in pricing
- Manage certifications
- Apply for training
- View welfare contributions
- Manage insurance
- Discover government schemes
- Track relevant government programmes

---

### Admin Portal

Administrators can manage:

- Workers
- Verification
- Certifications
- Services
- Bookings
- Pricing governance
- Travel-cost parameters
- Payments
- Welfare
- Insurance
- Government schemes
- Training programmes
- Workforce analytics
- Support tickets
- Community data
- Audit records

---

# 🏗️ Core Architecture

```text
USER APP
    │
    ├── Service Request
    ├── AI Request
    ├── Worker Selection
    ├── Booking
    ├── Invoice
    └── Payment
            │
            ▼
       SAHKAAR API
            │
    ┌───────┼────────┐
    │       │        │
 Workers  Pricing  Bookings
    │       │        │
    ├───────┼────────┤
    │       │        │
 Welfare  Govt.   Analytics
    │       │        │
    └───────┼────────┘
            │
            ▼
      PostgreSQL
            │
            ▼
      Object Storage
```

---

# ⚖️ Fair Pricing & Anti-Monopoly Governance

One of the core design challenges of SAHKAAR is pricing.

Simply allowing workers to decide prices could create the possibility of:

- Worker monopoly
- Price coordination
- Arbitrary price increases
- Consumer exploitation

At the same time, completely removing worker participation would undermine the cooperative model.

SAHKAAR therefore separates **participation from unilateral control**.

```text
Worker Proposals
       ↓
Objective Cost & Service Data
       ↓
Fair Price Range
       ↓
Pricing Review
       ↓
Approved Price
       ↓
Admin Implementation
       ↓
Consumer
       ↓
Audit Trail
```

Workers can **propose** prices, but they cannot directly determine the final customer-facing price.

The system uses:

- Minimum price
- Reference price
- Maximum price
- Worker proposals
- Objective cost data
- Consumer affordability feedback
- Pricing review
- Exception handling
- Independent review
- Audit trails

### Price Exceptions

If a proposal falls outside the governed range:

```text
Price Exception
      ↓
Reason Required
      ↓
Supporting Evidence
      ↓
Independent Review
      ↓
Approve / Reject
```

An administrator cannot simply override the system.

### Important Principle

> **Workers participate in pricing. They do not unilaterally control pricing.**

---

# 💰 Transaction Architecture

SAHKAAR uses a transparent transaction structure.

For a completed service:

```text
Base Service Charge
        +
Actual Material Cost
        +
System-Calculated Travel Cost
        =
Final Invoice
```

### Material Cost

Material reimbursement is kept separate from worker labour/service earnings.

### Travel Cost

Travel cost is calculated by the system using configured parameters such as:

- Distance
- Fuel assumptions
- Mileage
- Applicable travel rules

Workers cannot arbitrarily modify travel charges.

### Payment

Payments are linked to the booking and transaction.

The system maintains:

- Booking ID
- User ID
- Worker ID
- Transaction ID
- Amount
- Payment status
- Timestamp

The platform can also generate a **booking-specific payment QR** rather than relying on a worker's personal/static QR.

---

# 👷 Worker Verification

Workers are not immediately treated as verified service providers.

The workflow is:

```text
Worker Registration
        ↓
Pending Verification
        ↓
Admin Review
        ↓
Approved
        ↓
Account Activated
        ↓
Eligible for Service Requests
```

Only verified workers can participate in customer service requests.

---

# 🎓 Certification

SAHKAAR supports multiple forms of certification.

### 1. SAHKAAR Platform Certification

An internal certification ensuring that the worker understands the SAHKAAR platform and workflow.

```text
Training
   ↓
Assessment
   ↓
Pass
   ↓
SAHKAAR Certification
```

### 2. Skill Certification

Workers can obtain certification for skills such as:

- Electrical
- Plumbing
- Carpentry
- Painting
- etc.

A worker who already knows a trade can request an assessment.

```text
Existing Skill
      ↓
Assessment
      ↓
Pass
      ↓
Skill Certificate
```

Workers who need training can follow:

```text
Training
   ↓
Assessment
   ↓
Pass
   ↓
Skill Certificate
```

SAHKAAR does not represent its internal certificates as government certificates unless an actual recognized certification relationship exists.

---

# 🛡️ Worker Welfare & Insurance

SAHKAAR includes a dedicated worker welfare system.

## Welfare

Welfare contributions are based on defined worker earning rules.

Material reimbursement is treated separately from labour/service earnings.

## Insurance

Insurance is **not treated as a percentage deducted from every service**.

Instead, workers can be associated with insurance plans containing:

- Coverage
- Monthly premium
- Benefits
- Policy details
- Due date
- Payment history
- Claims

Example structure:

```text
Worker
   ↓
Insurance Plan
   ↓
Monthly Premium
   ↓
Coverage
   ↓
Claims
```

Actual insurance coverage must come from an appropriate authorized insurance arrangement.

---

# 🏛️ Government Coordination Layer

SAHKAAR is **not intended to replace government systems**.

Instead:

> **SAHKAAR acts as a coordination layer between cooperative administrators, government programmes, and verified workers.**

```text
             GOVERNMENT
                  │
        ┌─────────┼─────────┐
        │         │         │
     Schemes   Training  Workforce
     /Benefits Programs Requirements
        │         │         │
        └─────────┼─────────┘
                  ↓
            ADMIN PORTAL
                  ↓
          VERIFIED WORKFORCE
```

---

## Government Schemes

Administrators can manually add and manage real government schemes.

Each scheme can contain:

- Scheme name
- Government department
- Description
- Eligibility
- Benefits
- Required documents
- Cover image
- Application process
- Official government link
- Validity
- Status

### Important

The MVP does **not** depend on direct government APIs.

The Admin database is the source of scheme information.

Only:

```text
Admin Created
+
Verified
+
Published
```

schemes appear to workers.

The system must not generate fictional government schemes.

Final eligibility and approval remain with the concerned government authority.

---

# 🎓 Government Training Connect

Government or authorized training programmes can be managed through the Admin Portal.

Example:

```text
Training Programme
        ↓
Eligibility Rules
        ↓
Relevant Workers Identified
        ↓
Worker Notification
        ↓
Training
        ↓
Certificate Verification
```

This allows cooperatives to connect relevant workers with training opportunities.

---

# 📊 Government Workforce Analytics

SAHKAAR can generate aggregated workforce information from platform data.

Example:

```text
Community C001

420 Verified Workers

110 Electricians
85 Plumbers
60 Carpenters

Current Demand:
Plumbing       High
Electrical     Medium
Carpentry      Medium
```

Potential analytics include:

- Workforce size
- Skills distribution
- Certification gaps
- Service demand
- Workforce availability
- Training requirements
- Skill-demand trends

Government-facing reporting should prefer **aggregated information** and avoid unnecessary exposure of individual personal data.

---

# 🏛️ Government Workforce Requirements

A future-ready module can allow structured requirements such as:

```text
50 Electricians
Location: XYZ
Duration: 30 days
Required Certification: Electrical
```

The system can identify matching verified workers.

For the current prototype, this remains a **future/demo workflow**, not a claimed live government integration.

---

# 📱 Service Request Flow

SAHKAAR supports two request methods.

## Manual Request

```text
Select Service
      ↓
Describe Problem
      ↓
Date
      ↓
Time
      ↓
Location
      ↓
Optional Photo
      ↓
Review
      ↓
Submit
```

## AI-Assisted Request

```text
Natural Language
      ↓
AI Understands Request
      ↓
Structured Service Request
      ↓
Photo Option
      ↓
Date
      ↓
Time
      ↓
Location
      ↓
User Confirmation
      ↓
Submit
```

AI does not automatically submit a request without user confirmation.

---

# 👥 Worker Matching

Current SAHKAAR scope follows:

> **1 User : 1 Worker : 1 Booking**

Eligible workers are identified using:

- Required skill
- Worker verification
- Availability
- Service area
- Location/range
- Relevant certification

Multiple eligible workers may accept a request.

The user then chooses **one worker**.

```text
Service Request
      ↓
Eligible Workers
      ↓
Workers Accept
      ↓
User Views Accepted Workers
      ↓
User Selects One Worker
      ↓
Booking Confirmed
```

Multi-worker/team jobs are reserved for future scope.

---

# 🔄 Booking Lifecycle

```text
Request
   ↓
Workers Notified
   ↓
Workers Accept
   ↓
User Selects Worker
   ↓
Booking Confirmed
   ↓
Worker On The Way
   ↓
Worker Arrived
   ↓
Service In Progress
   ↓
Worker Done
   ↓
User Verifies
   ↓
User Done
   ↓
Final Cost
   ↓
Invoice
   ↓
Payment
   ↓
Rating & Review
```

---

# 🗃️ Data & Storage

SAHKAAR uses a structured backend architecture with:

### PostgreSQL

Used for:

- Users
- Workers
- Communities
- Bookings
- Services
- Pricing
- Payments
- Certifications
- Welfare
- Insurance
- Government programmes
- Analytics
- Audit records

### Object Storage

Used for files such as:

- Worker profile photos
- Certificates
- Documents
- Scheme cover images
- Training certificates
- Booking photos
- Support attachments

Sensitive files should remain protected and access-controlled.

---

# 🔐 Security & Governance

SAHKAAR follows role-based access control.

```text
USER
WORKER
ADMIN
REVIEWER
AUDITOR
```

Important operations are governed through permissions and audit records.

Sensitive actions such as:

- Price changes
- Worker verification
- Certification decisions
- Financial corrections
- Welfare rule changes
- Insurance changes
- Government scheme changes

should be traceable.

---

# 🧾 Auditability

SAHKAAR maintains audit records for important actions.

Example:

```text
PRICE CHANGE AUDIT

Service: Tap Repair
Old Price: ₹250
Proposed Price: ₹300
Fair Range: ₹270–₹310
Reason: Operating Cost Change
Reviewed By: Pricing Review Panel
Implemented By: Admin A001
Timestamp: ...
```

Historical records should not be silently overwritten.

Corrections should create new records rather than erase the original history.

---

# 🏢 Community Model

Each cooperative/community receives a permanent Community ID.

Example:

```text
Community C001
      │
      ├── Admin A001
      │
      ├── Workers
      ├── Services
      ├── Bookings
      ├── Pricing
      └── Government Programmes
```

If the administrator changes:

```text
Community C001
      │
      └── New Admin A002
```

The Community ID remains unchanged.

Community data must remain isolated from other communities.

---

# 🛠️ Technology Stack

The project is designed around a modern web/mobile architecture.

### Frontend

- React
- JavaScript / JSX
- Context-based state management
- Responsive UI
- Component-based architecture

### Backend

- API-based architecture
- Role-based authorization
- Server-side business logic
- Transaction management
- Validation
- Audit logging

### Database

- PostgreSQL
- Neon

### Storage

- Object Storage

### AI

- AI-assisted service-request understanding
- Structured request generation
- Future intelligent workforce analytics

---

# 📂 Project Structure

A logical project structure:

```text
src/
│
├── admin/
│   ├── pages/
│   ├── components/
│   ├── contexts/
│   ├── services/
│   └── styles/
│
├── components/
├── contexts/
├── pages/
├── services/
├── assets/
└── App.jsx

backend/
├── config/
├── database/
├── middleware/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── workers/
│   ├── bookings/
│   ├── pricing/
│   ├── payments/
│   ├── welfare/
│   ├── insurance/
│   ├── certifications/
│   ├── government/
│   ├── training/
│   ├── analytics/
│   └── audit/
└── server/
```

---

# 🗺️ Roadmap

## Phase 1 — Core Platform

- [x] User application
- [x] Worker application
- [x] Admin portal
- [x] Service request system
- [x] Worker matching
- [x] Booking lifecycle

## Phase 2 — Governance

- [x] Fair pricing model
- [x] Worker price proposals
- [x] Price bands
- [x] Pricing review
- [x] Audit trail
- [x] Anti-monopoly safeguards

## Phase 3 — Worker Ecosystem

- [x] Worker verification
- [x] Skill certification
- [x] Platform certification
- [x] Welfare
- [x] Insurance

## Phase 4 — Government Coordination

- [x] Government scheme management
- [x] Scheme applications
- [x] Training programmes
- [x] Workforce analytics
- [ ] Government requirement integration
- [ ] Official government API integrations where formally available

## Future

- Multi-worker/team jobs
- Advanced AI workforce forecasting
- Government system integrations
- Advanced cooperative analytics
- Expanded welfare programmes
- Larger institutional/government workforce deployment

---

# 🌱 Future Vision

SAHKAAR can evolve from a service-booking platform into a broader **digital cooperative workforce infrastructure**.

The long-term ecosystem can connect:

```text
Workers
   ↕
Cooperatives
   ↕
Consumers
   ↕
Training Institutions
   ↕
Government Programmes
   ↕
Institutional Workforce Demand
```

The objective is not simply to digitize bookings.

It is to create a system where:

- Workers are organized
- Skills are verified
- Prices are governed transparently
- Consumers receive predictable services
- Welfare can be structured
- Training opportunities reach relevant workers
- Cooperatives gain operational intelligence
- Government gets better aggregated workforce visibility

---

# 🤝 Contributing

Contributions, suggestions, and improvements are welcome.

Before contributing:

1. Understand the existing architecture.
2. Do not bypass pricing governance.
3. Do not introduce hardcoded operational data.
4. Preserve Community-level data isolation.
5. Maintain auditability for sensitive operations.
6. Do not expose private worker/user information.
7. Keep User, Worker, and Admin responsibilities separated.

---

# ⚠️ Disclaimer

SAHKAAR is a cooperative technology platform concept.

Government schemes, certifications, insurance products, and government programmes displayed through the platform must be based on verified information and clearly identify their actual issuing/authorizing organization.

SAHKAAR does not represent itself as a government authority.

Final government eligibility, approval, certification, and benefits remain subject to the concerned government or authorized organization.

---

# 📜 License

License information will be added as the project moves toward its public release.

---

## SAHKAAR

**Cooperative-owned. Worker-focused. Transparent by design.**

> **Participation without monopoly.  
> Digital access without losing cooperative ownership.  
> Transparency without sacrificing worker interests.**
```
