# 🎯 CEO Demo Guide - Leverage CRM

## Quick Setup (5 Minutes)

### Step 1: Seed Demo Data

Run the demo setup script to populate your database with realistic data:

```bash
# From project root
python demo_setup.py
```

**Demo Account Credentials:**
- **Email**: `no-reply@amzdudes.io`
- **Password**: `Demo123!@#`

### Step 2: Verify Demo Account

1. Go to your frontend URL: `https://crm.amzdudes.io` (or localhost:5173)
2. Login with demo credentials
3. Verify you see:
   - 5 companies (brands & suppliers)
   - 5 contacts
   - 7 deals across different stages
   - 3 purchase orders
   - 2 shipments
   - 2 invoices
   - 3 reminders
   - 5 Amazon SKU records

---

## 🎬 Demo Script (15-20 Minutes)

### Opening (2 minutes)

**"Today I'll show you Leverage CRM - our command center for Amazon wholesale operations. This tool connects deals, outreach, operations, and profit intelligence into one unified platform."**

**Key Points:**
- Built specifically for Amazon wholesalers
- All-in-one solution (no more spreadsheets)
- AI-powered email outreach
- Real-time operations tracking
- Profit intelligence dashboard

---

### 1. Dashboard Overview (3 minutes)

**Navigate to Dashboard**

**Show:**
- **Control Center Header**: "Hey Demo User, keep the flywheel moving"
- **Key Metrics**: 
  - Total Deals: 7
  - Contacts: 5
  - Companies: 5
  - Pipeline Value: $695,000

**Say:**
*"This is your command center. At a glance, you see your entire operation - deals, contacts, companies, and pipeline value. Everything updates in real-time."*

**Highlight:**
- **Operations Snapshot**: Shows 3 active purchase orders
- **AI Outreach Queue**: Deals that need email outreach
- **Next Actions**: Reminders and tasks
- **Logistics Highlight**: Active shipments

**Action**: Click on "Operations Snapshot" → Show PO details

---

### 2. Pipeline Management (4 minutes)

**Navigate to Pipeline Tab**

**Show Kanban Board:**
- **Say**: *"This is our deal pipeline. We use a visual Kanban board - just like Trello, but built for wholesale deals."*

**Demonstrate:**
1. **Drag & Drop**: Move "TechBrand Q4 Wholesale Partnership" from Negotiation to Proposal
   - *"You can drag deals between stages as they progress. The system tracks everything."*

2. **Deal Details**: Click on "TechBrand Q4 Wholesale Partnership"
   - Show deal information
   - Show "Draft Purchase Order" section
   - *"When a deal closes, you can instantly convert it to a purchase order."*

3. **Create New Deal**: Click "+" button
   - Fill in: Title, Value ($50,000), Stage, Due Date
   - *"Adding new deals is instant. No forms, no complexity."*

**Show Timeline View:**
- Switch to "Timeline" tab
- *"You can also view deals chronologically to see your sales velocity."*

**Highlight "Next Actions" Sidebar:**
- Show overdue deals
- Show high-value deals
- *"The system automatically highlights what needs attention."*

---

### 3. AI-Powered Email Outreach (4 minutes)

**Navigate to AI Outreach**

**Say:**
*"This is where AI meets sales. Instead of writing emails from scratch, our AI generates personalized outreach emails."*

**Demonstrate:**

1. **Select a Deal**: Choose "Global Suppliers Electronics Line"
   - *"When you select a deal, it auto-fills contact information and variables."*

2. **Select a Contact**: Choose "Michael Chen"
   - *"The system knows who to contact for each deal."*

3. **Choose Template**: Select "Brand Outreach – Intro"
   - *"We have pre-built templates for different scenarios."*

4. **Fill Variables**:
   - First Name: Michael
   - Brand Name: Global Suppliers
   - Category: Electronics
   - *"These variables personalize the email."*

5. **Generate Email**: Click "Generate Email"
   - *"Watch the AI create a professional, personalized email in seconds."*
   - Show generated subject and body
   - *"You can edit it before sending."*

6. **Gmail Integration**:
   - *"Once connected to Gmail, you can send emails directly from here. All emails are tracked in the CRM."*
   - (If Gmail not connected, show the "Connect Gmail" button)

**Key Point**: *"This saves hours per week. Instead of writing 20 emails, you generate and send them in minutes."*

---

### 4. Operations Management (3 minutes)

**Navigate to Operations**

**Say:**
*"Operations is where deals become reality. Purchase orders, shipments, invoices - all tracked in one place."*

**Show:**

1. **Purchase Orders Tab**:
   - Show 3 POs with different statuses (draft, ordered, in_transit)
   - Click on PO-2024-001
   - Show PO detail modal with:
     - Cost breakdown (COGS, freight, customs, FBA fees)
     - Calculated landed cost
     - Profit margin
     - *"You can track all costs and see profitability before the product even arrives."*

2. **Shipments Tab**:
   - Show 2 active shipments
   - Show tracking numbers and ETAs
   - *"Real-time shipment tracking. Know exactly when inventory arrives."*

3. **Invoices Tab**:
   - Show paid and pending invoices
   - *"Financial tracking integrated with operations."*

**Key Point**: *"Everything is connected. A deal becomes a PO, which becomes a shipment, which becomes an invoice. No data silos."*

---

### 5. Intelligence & Profit Analysis (2 minutes)

**Navigate to Intelligence**

**Say:**
*"This is where we turn data into decisions. Profit intelligence, sales analytics, and deal insights."*

**Show:**

1. **Profit Metrics**:
   - Total Revenue: $54,600
   - Total Expenses: $52,500
   - Net Profit: $2,100
   - *"See your actual profitability, not just revenue."*

2. **Deal Analytics**:
   - Stage distribution chart
   - Value by stage
   - *"Understand where deals are stuck and where value is concentrated."*

3. **Amazon Data** (if available):
   - SKU sales data
   - Stock levels
   - *"When Amazon SP-API is connected, you'll see real-time sales data here."*

**Key Point**: *"Make data-driven decisions. Know which deals are profitable, which products sell, and where to focus."*

---

### 6. Contacts & Companies (1 minute)

**Navigate to Dashboard → Contacts Tab**

**Show:**
- Grid of 5 contacts with emails and phone numbers
- *"All your brand and supplier contacts in one place."*

**Navigate to Companies Tab**

**Show:**
- 5 companies (brands and suppliers)
- Filter by type
- *"Organize by brand vs supplier. Track all your relationships."*

---

### 7. Quick Actions & Efficiency (1 minute)

**Back to Dashboard**

**Show Quick Actions:**
- New Deal
- Add Contact
- Add Company
- Send Email

**Say:**
*"Everything is accessible in 1-2 clicks. No hunting through menus. Built for speed."*

**Show Command Palette:**
- Press `Cmd/Ctrl + K`
- *"Keyboard shortcuts for power users. Navigate anywhere instantly."*

---

## 🎯 Key Talking Points

### Problem We Solve
- **Before**: Spreadsheets, email chaos, no visibility, manual tracking
- **After**: One platform, AI assistance, real-time visibility, automated tracking

### Competitive Advantages
1. **Built for Amazon Wholesalers**: Not a generic CRM, purpose-built for our workflow
2. **AI-Powered**: Email generation saves 10+ hours/week
3. **End-to-End**: Deals → POs → Shipments → Invoices → Profit
4. **Real-Time**: Everything updates instantly, no manual sync
5. **Beautiful UX**: Modern, fast, intuitive interface

### ROI Demonstration
- **Time Saved**: 10-15 hours/week on email outreach
- **Deal Velocity**: Faster deal progression with reminders and automation
- **Profit Visibility**: Know profitability before ordering
- **Error Reduction**: Automated tracking reduces mistakes

### Future Roadmap (Mention Briefly)
- Amazon SP-API integration (pending approval)
- Advanced analytics and forecasting
- Mobile app
- Team collaboration features

---

## 🛡️ Handling Questions

### "How does this compare to Salesforce/HubSpot?"
**Answer**: *"Those are generic CRMs. We built this specifically for Amazon wholesale operations. It includes operations tracking, profit analysis, and Amazon integration that generic CRMs don't have."*

### "Is the data secure?"
**Answer**: *"Yes. We use industry-standard encryption, secure authentication, and your data is stored in a secure PostgreSQL database. We follow SOC 2 compliance practices."*

### "Can we customize it?"
**Answer**: *"Absolutely. We can add custom fields, workflows, and integrations based on your specific needs. This is a living platform that evolves with your business."*

### "What about training?"
**Answer**: *"The interface is intuitive, but we provide onboarding and training. Most users are productive within a day."*

### "How much does it cost?"
**Answer**: *"We're finalizing pricing. It will be subscription-based, competitive with other CRMs, but with much better ROI due to time savings and profit visibility."*

### "When can we start using it?"
**Answer**: *"The core platform is ready now. We're waiting on Amazon SP-API approval for full Amazon integration, but everything else is production-ready."*

---

## ✅ Pre-Demo Checklist

- [ ] Run `python demo_setup.py` to seed data
- [ ] Test login with demo credentials
- [ ] Verify all data appears correctly
- [ ] Test Gmail connection (if available)
- [ ] Check that all pages load
- [ ] Test drag-and-drop in Pipeline
- [ ] Test email generation in AI Outreach
- [ ] Verify Operations page shows POs/shipments/invoices
- [ ] Check Intelligence page loads correctly
- [ ] Have backup plan if internet is slow (use localhost)

---

## 🚨 Troubleshooting During Demo

### If Something Doesn't Load
- **Stay Calm**: *"Let me refresh that"* - Refresh page
- **Have Backup**: If live site fails, switch to localhost:5173
- **Pivot**: Skip to next section, come back later

### If Data Looks Empty
- **Quick Fix**: Run `python demo_setup.py` again
- **Alternative**: Manually create 1-2 items to show functionality

### If Gmail Connection Fails
- **Say**: *"Gmail integration requires OAuth setup. The functionality is there, we just need to configure it for this demo environment."*
- **Show**: The email generation still works, just can't send yet

### If Amazon Data Missing
- **Say**: *"Amazon SP-API integration is pending approval. Once approved, this will show real-time sales data from your Amazon account."*
- **Show**: The structure is there, just needs API connection

---

## 📊 Demo Metrics to Highlight

- **7 Deals** in pipeline
- **$695,000** pipeline value
- **5 Companies** (brands & suppliers)
- **5 Contacts** with full details
- **3 Purchase Orders** in various stages
- **2 Active Shipments** with tracking
- **$54,600** revenue tracked
- **5 Amazon SKUs** with sales data

---

## 🎤 Closing Statement

**"Leverage CRM is more than a tool - it's your command center for Amazon wholesale operations. It connects everything: deals, outreach, operations, and profit intelligence. It saves time, increases visibility, and helps you make better decisions.**

**We're ready to deploy this for the team. The core platform is production-ready, and we're just waiting on Amazon SP-API approval for full Amazon integration.**

**Questions?"**

---

## 📝 Post-Demo Follow-Up

After the demo, send:
1. **Demo Account Access** (if they want to explore)
2. **Feature Roadmap** document
3. **Pricing Proposal** (if ready)
4. **Implementation Timeline**

---

**Good luck with your demo! 🚀**

