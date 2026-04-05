import mysql from "mysql2/promise";

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Clear existing CRM data
await conn.execute("DELETE FROM crm_campaign_enrollments");
await conn.execute("DELETE FROM crm_campaign_steps");
await conn.execute("DELETE FROM crm_campaigns");
await conn.execute("DELETE FROM crm_lead_activities");
await conn.execute("DELETE FROM crm_leads");
await conn.execute("DELETE FROM crm_email_templates");
console.log("Cleared existing CRM data");

// ─── Demo Leads ─────────────────────────────────────────────────────
const leads = [
  // Stage: new (scraped, not yet qualified)
  { company: "Bynder", contact: "Lisa van Dijk", email: "l.vandijk@bynder.com", phone: "+31 20 555 0101", size: "51-200", industry: "SaaS / MarTech", website: "https://bynder.com", location: "Amsterdam", budget: "€5.000-10.000/mo", source: "linkedin", stage: "new", score: 25, value: 72000, tags: ["tech", "scale-up", "amsterdam"] },
  { company: "Miro", contact: "Thomas Bakker", email: "t.bakker@miro.com", phone: "+31 20 555 0102", size: "201-500", industry: "SaaS / Collaboration", website: "https://miro.com", location: "Amsterdam", budget: "€10.000-25.000/mo", source: "cold_outreach", stage: "new", score: 30, value: 180000, tags: ["tech", "enterprise", "amsterdam"] },
  { company: "Framer", contact: "Sophie Jansen", email: "s.jansen@framer.com", phone: "+31 20 555 0103", size: "51-200", industry: "Design / Tech", website: "https://framer.com", location: "Amsterdam", budget: "€3.000-5.000/mo", source: "website", stage: "new", score: 20, value: 48000, tags: ["design", "startup", "amsterdam"] },
  { company: "WeTransfer", contact: "Mark de Vries", email: "m.devries@wetransfer.com", phone: "+31 20 555 0104", size: "201-500", industry: "Tech / File Sharing", website: "https://wetransfer.com", location: "Amsterdam", budget: "€10.000-25.000/mo", source: "linkedin", stage: "new", score: 35, value: 150000, tags: ["tech", "creative", "amsterdam"] },
  
  // Stage: qualified (doelgroepanalyse done)
  { company: "Adyen", contact: "Emma Visser", email: "e.visser@adyen.com", phone: "+31 20 555 0201", size: "500+", industry: "FinTech / Payments", website: "https://adyen.com", location: "Amsterdam", budget: "€25.000+/mo", source: "referral", stage: "qualified", score: 72, value: 360000, tags: ["fintech", "enterprise", "amsterdam", "high-value"] },
  { company: "Booking.com", contact: "Jan Smit", email: "j.smit@booking.com", phone: "+31 20 555 0202", size: "500+", industry: "Travel / Tech", website: "https://booking.com", location: "Amsterdam", budget: "€25.000+/mo", source: "event", stage: "qualified", score: 68, value: 420000, tags: ["travel", "enterprise", "amsterdam"] },
  { company: "Elastic", contact: "Pieter Hendriks", email: "p.hendriks@elastic.co", phone: "+31 20 555 0203", size: "201-500", industry: "Search / Analytics", website: "https://elastic.co", location: "Amsterdam", budget: "€10.000-25.000/mo", source: "cold_outreach", stage: "qualified", score: 55, value: 144000, tags: ["tech", "data", "amsterdam"] },
  
  // Stage: tour_scheduled
  { company: "Rituals Cosmetics", contact: "Anna de Boer", email: "a.deboer@rituals.com", phone: "+31 20 555 0301", size: "201-500", industry: "Retail / Luxury", website: "https://rituals.com", location: "Amsterdam", budget: "€5.000-10.000/mo", source: "referral", stage: "tour_scheduled", score: 78, value: 96000, tags: ["retail", "luxury", "amsterdam"] },
  { company: "Ace & Tate", contact: "Daan Mulder", email: "d.mulder@aceandtate.com", phone: "+31 20 555 0302", size: "51-200", industry: "D2C / Eyewear", website: "https://aceandtate.com", location: "Amsterdam", budget: "€3.000-5.000/mo", source: "linkedin", stage: "tour_scheduled", score: 65, value: 48000, tags: ["d2c", "retail", "amsterdam"] },
  
  // Stage: proposal
  { company: "Picnic", contact: "Kees van den Berg", email: "k.vandenberg@picnic.app", phone: "+31 20 555 0401", size: "500+", industry: "E-commerce / Grocery", website: "https://picnic.app", location: "Amsterdam", budget: "€10.000-25.000/mo", source: "event", stage: "proposal", score: 85, value: 180000, tags: ["ecommerce", "tech", "amsterdam", "hot"] },
  { company: "Bunq", contact: "Floor Willems", email: "f.willems@bunq.com", phone: "+31 20 555 0402", size: "201-500", industry: "FinTech / Banking", website: "https://bunq.com", location: "Amsterdam", budget: "€5.000-10.000/mo", source: "cold_outreach", stage: "proposal", score: 80, value: 96000, tags: ["fintech", "scale-up", "amsterdam"] },
  
  // Stage: negotiation
  { company: "MessageBird", contact: "Rick Peters", email: "r.peters@messagebird.com", phone: "+31 20 555 0501", size: "201-500", industry: "CPaaS / Communications", website: "https://messagebird.com", location: "Amsterdam", budget: "€10.000-25.000/mo", source: "referral", stage: "negotiation", score: 92, value: 156000, tags: ["tech", "communications", "amsterdam", "closing"] },
  
  // Stage: won
  { company: "Mollie", contact: "Sara Groot", email: "s.groot@mollie.com", phone: "+31 20 555 0601", size: "201-500", industry: "FinTech / Payments", website: "https://mollie.com", location: "Amsterdam", budget: "€10.000-25.000/mo", source: "referral", stage: "won", score: 100, value: 144000, tags: ["fintech", "payments", "amsterdam", "member"] },
  { company: "TomTom", contact: "Bas Dijkstra", email: "b.dijkstra@tomtom.com", phone: "+31 20 555 0602", size: "500+", industry: "Navigation / Maps", website: "https://tomtom.com", location: "Amsterdam", budget: "€25.000+/mo", source: "event", stage: "won", score: 100, value: 300000, tags: ["tech", "navigation", "amsterdam", "member"] },
  
  // Stage: lost
  { company: "Takeaway.com", contact: "Lotte Bos", email: "l.bos@takeaway.com", phone: "+31 20 555 0701", size: "500+", industry: "Food Delivery", website: "https://takeaway.com", location: "Amsterdam", budget: "€10.000-25.000/mo", source: "cold_outreach", stage: "lost", score: 15, value: 0, tags: ["food", "enterprise"] },
  
  // Rotterdam leads
  { company: "Coolblue", contact: "Joris Kuijpers", email: "j.kuijpers@coolblue.nl", phone: "+31 10 555 0101", size: "500+", industry: "E-commerce / Electronics", website: "https://coolblue.nl", location: "Rotterdam", budget: "€10.000-25.000/mo", source: "linkedin", stage: "qualified", score: 60, value: 180000, tags: ["ecommerce", "rotterdam"] },
  { company: "Guerrilla Games", contact: "Mees van Loon", email: "m.vanloon@guerrilla-games.com", phone: "+31 20 555 0801", size: "201-500", industry: "Gaming / Entertainment", website: "https://guerrilla-games.com", location: "Amsterdam", budget: "€5.000-10.000/mo", source: "event", stage: "tour_scheduled", score: 70, value: 84000, tags: ["gaming", "creative", "amsterdam"] },
];

const leadIds = [];
for (const l of leads) {
  const [result] = await conn.execute(
    "INSERT INTO crm_leads (companyName, contactName, contactEmail, contactPhone, companySize, industry, website, locationPreference, budgetRange, source, stage, score, estimatedValue, tags, nextFollowUp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [l.company, l.contact, l.email, l.phone, l.size, l.industry, l.website, l.location, l.budget, l.source, l.stage, l.score, l.value, JSON.stringify(l.tags), l.stage !== "won" && l.stage !== "lost" ? Date.now() + Math.random() * 7 * 86400000 : null]
  );
  leadIds.push(result.insertId);
}
console.log(`Inserted ${leadIds.length} demo leads`);

// ─── Lead Activities (journey trail) ────────────────────────────────
const activities = [];
const dayMs = 86400000;

for (let i = 0; i < leads.length; i++) {
  const l = leads[i];
  const lid = leadIds[i];
  const baseTime = Date.now() - 30 * dayMs;
  
  // Every lead starts with scrape/discovery
  activities.push({ leadId: lid, type: "note", title: "Lead gescraped via " + l.source, desc: `Website ${l.website} gevonden. Bedrijf: ${l.company}, sector: ${l.industry}, grootte: ${l.size}`, time: baseTime });
  
  if (["qualified","tour_scheduled","proposal","negotiation","won","lost"].includes(l.stage)) {
    activities.push({ leadId: lid, type: "score_change", title: "AI doelgroepanalyse voltooid", desc: `Score: ${l.score}. Industrie match: hoog. Budget fit: ${l.budget}. Locatievoorkeur: ${l.location}`, time: baseTime + 1 * dayMs });
    activities.push({ leadId: lid, type: "email_sent", title: "Eerste outreach email verzonden", desc: `Onderwerp: "Exclusieve werkplek voor ${l.company}" — Gepersonaliseerde intro met Mr. Green USPs`, time: baseTime + 2 * dayMs });
    activities.push({ leadId: lid, type: "stage_change", title: "Stage → Qualified", desc: "Lead gekwalificeerd na doelgroepanalyse en eerste contact", time: baseTime + 3 * dayMs });
  }
  
  if (["tour_scheduled","proposal","negotiation","won"].includes(l.stage)) {
    activities.push({ leadId: lid, type: "email_opened", title: "Email geopend", desc: `${l.contact} heeft de outreach email geopend (2x)`, time: baseTime + 4 * dayMs });
    activities.push({ leadId: lid, type: "email_replied", title: "Reactie ontvangen", desc: `${l.contact}: "Interessant, graag meer info over jullie locatie ${l.location}"`, time: baseTime + 5 * dayMs });
    activities.push({ leadId: lid, type: "call", title: "Introductiegesprek", desc: `15 min call met ${l.contact}. Interesse in ${l.size === "500+" ? "dedicated floor" : "flex desks + meeting rooms"}`, time: baseTime + 7 * dayMs });
    activities.push({ leadId: lid, type: "tour", title: "Rondleiding ingepland", desc: `Tour ${l.location} locatie op ${new Date(baseTime + 10 * dayMs).toLocaleDateString("nl-NL")}`, time: baseTime + 8 * dayMs });
    activities.push({ leadId: lid, type: "stage_change", title: "Stage → Tour Scheduled", desc: "", time: baseTime + 8 * dayMs });
  }
  
  if (["proposal","negotiation","won"].includes(l.stage)) {
    activities.push({ leadId: lid, type: "meeting", title: "Rondleiding afgerond", desc: `${l.contact} was onder de indruk van de faciliteiten. Interesse in ${l.budget} pakket.`, time: baseTime + 10 * dayMs });
    activities.push({ leadId: lid, type: "proposal_sent", title: "Voorstel verzonden", desc: `Maatwerk offerte voor ${l.company}: ${l.budget}/maand, inclusief meeting rooms en credits`, time: baseTime + 12 * dayMs });
    activities.push({ leadId: lid, type: "stage_change", title: "Stage → Proposal", desc: "", time: baseTime + 12 * dayMs });
  }
  
  if (["negotiation","won"].includes(l.stage)) {
    activities.push({ leadId: lid, type: "call", title: "Onderhandeling", desc: `Bespreking contractvoorwaarden. ${l.contact} wil korting op jaarcontract.`, time: baseTime + 15 * dayMs });
    activities.push({ leadId: lid, type: "stage_change", title: "Stage → Negotiation", desc: "", time: baseTime + 15 * dayMs });
  }
  
  if (l.stage === "won") {
    activities.push({ leadId: lid, type: "stage_change", title: "Stage → Won! 🎉", desc: `Contract getekend. ${l.company} start per ${new Date(baseTime + 20 * dayMs).toLocaleDateString("nl-NL")}`, time: baseTime + 20 * dayMs });
  }
  
  if (l.stage === "lost") {
    activities.push({ leadId: lid, type: "email_sent", title: "Follow-up email", desc: "Tweede outreach poging", time: baseTime + 5 * dayMs });
    activities.push({ leadId: lid, type: "stage_change", title: "Stage → Lost", desc: "Geen reactie na 3 pogingen. Lead gemarkeerd als verloren.", time: baseTime + 14 * dayMs });
  }
}

for (const a of activities) {
  await conn.execute(
    "INSERT INTO crm_lead_activities (leadId, `type`, title, description, createdAt) VALUES (?, ?, ?, ?, ?)",
    [a.leadId, a.type, a.title, a.desc, new Date(a.time)]
  );
}
console.log(`Inserted ${activities.length} lead activities`);

// ─── Campaigns ──────────────────────────────────────────────────────
const campaigns = [
  { name: "Amsterdam Tech Scale-ups Q1", desc: "Outreach naar tech scale-ups in Amsterdam met 50+ medewerkers", type: "email_sequence", status: "active", audience: "Tech bedrijven, 51-500 medewerkers, Amsterdam", total: 45, sent: 38, open: 22, click: 12, reply: 8, conversion: 3 },
  { name: "Rotterdam Expansion Launch", desc: "Introductie van de nieuwe Rotterdam locatie aan bestaande leads", type: "one_off", status: "active", audience: "Alle leads met locatievoorkeur Rotterdam", total: 28, sent: 28, open: 18, click: 9, reply: 5, conversion: 1 },
  { name: "FinTech Focus Campaign", desc: "Gerichte campagne voor FinTech bedrijven - exclusieve community pitch", type: "email_sequence", status: "completed", audience: "FinTech sector, alle groottes", total: 32, sent: 32, open: 24, click: 15, reply: 10, conversion: 4 },
  { name: "Creative Industry Drip", desc: "Langlopende nurture campagne voor design/creative agencies", type: "drip", status: "active", audience: "Design, Creative, Marketing agencies", total: 55, sent: 42, open: 28, click: 14, reply: 6, conversion: 2 },
];

const campaignIds = [];
for (const c of campaigns) {
  const [result] = await conn.execute(
    "INSERT INTO crm_campaigns (name, description, `type`, `status`, targetAudience, totalLeads, sentCount, openCount, clickCount, replyCount, conversionCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [c.name, c.desc, c.type, c.status, c.audience, c.total, c.sent, c.open, c.click, c.reply, c.conversion]
  );
  campaignIds.push(result.insertId);
}
console.log(`Inserted ${campaignIds.length} campaigns`);

// ─── Campaign Steps ─────────────────────────────────────────────────
const steps = [
  // Campaign 1: Amsterdam Tech
  { campaignId: campaignIds[0], order: 1, delay: 0, subject: "Exclusieve werkplek voor {company} in hartje Amsterdam", body: "Beste {name},\n\nMr. Green Members is een besloten community van geselecteerde bedrijven. Met locaties aan de Keizersgracht en Herengracht bieden we meer dan een werkplek.\n\nGraag nodig ik u uit voor een persoonlijke rondleiding.\n\nMet vriendelijke groet" },
  { campaignId: campaignIds[0], order: 2, delay: 3, subject: "Re: Werkplek {company} — Wat onze leden zeggen", body: "Beste {name},\n\nOnze leden waarderen vooral de rust, het netwerk en de faciliteiten. Mollie, TomTom en Adyen gingen u voor.\n\nHeeft u 15 minuten voor een kort gesprek?\n\nGroet" },
  { campaignId: campaignIds[0], order: 3, delay: 7, subject: "Laatste kans: Exclusieve aanbieding voor {company}", body: "Beste {name},\n\nDeze maand bieden we nieuwe leden 10% korting op het eerste kwartaal. Slechts 3 plekken beschikbaar op onze Amsterdam locatie.\n\nPlan direct uw rondleiding.\n\nGroet" },
  // Campaign 2: Rotterdam
  { campaignId: campaignIds[1], order: 1, delay: 0, subject: "Mr. Green opent in Rotterdam — Eerste kijkdag", body: "Beste {name},\n\nWij openen onze nieuwste locatie in Rotterdam. Als eerste kunt u een exclusieve rondleiding boeken.\n\nGroet" },
];

for (const s of steps) {
  await conn.execute(
    "INSERT INTO crm_campaign_steps (campaignId, stepOrder, delayDays, subject, body) VALUES (?, ?, ?, ?, ?)",
    [s.campaignId, s.order, s.delay, s.subject, s.body]
  );
}
console.log(`Inserted ${steps.length} campaign steps`);

// ─── Email Templates ────────────────────────────────────────────────
const templates = [
  { name: "Eerste Contact - Tech", subject: "Exclusieve werkplek voor {company}", body: "Beste {name},\n\nMr. Green Members is een besloten community...", category: "outreach", ai: false },
  { name: "Follow-up na Tour", subject: "Bedankt voor uw bezoek, {name}", body: "Beste {name},\n\nBedankt voor de prettige rondleiding...", category: "follow-up", ai: false },
  { name: "AI: Gepersonaliseerde Intro", subject: "Waarom {company} past bij Mr. Green", body: "AI-gegenereerd template op basis van bedrijfsprofiel...", category: "outreach", ai: true },
  { name: "Voorstel Begeleidend", subject: "Uw maatwerk voorstel — {company}", body: "Beste {name},\n\nBijgaand vindt u ons voorstel...", category: "proposal", ai: false },
  { name: "Win-back Verloren Lead", subject: "We missen u, {name}", body: "Beste {name},\n\nEen tijdje geleden spraken we over...", category: "win-back", ai: true },
];

for (const t of templates) {
  await conn.execute(
    "INSERT INTO crm_email_templates (name, subject, body, category, isAiGenerated) VALUES (?, ?, ?, ?, ?)",
    [t.name, t.subject, t.body, t.category, t.ai]
  );
}
console.log(`Inserted ${templates.length} email templates`);

await conn.end();
console.log("\nCRM demo data seeded successfully!");
