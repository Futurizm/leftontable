# Test documents for LeftOnTable

Five fictional US employers, each with a long benefits guide (24–31 pages) and a matching paystub. Every company, person and vendor is made up. The documents are for testing only.

How to test: open the app → **Scan my benefits** → upload the guide → upload the paystub → check the auto-filled answers, add the extra inputs listed below → **Show my money**.

The paystub fills in salary, pay frequency, state, 401(k)/403(b) rate and your current medical plan automatically. You only need to add family status, childcare and commute.

---

## 1. Acme Corp (corporate, Illinois)
`acme-benefits-guide-2027.pdf` (31 pages) · `acme-paystub-2026-11.pdf`

**Jordan Rivera**, 34, Chicago, married, toddler in daycare, $90k, saves 3% in the 401(k), on the PPO family plan.
**Add:** Married · Family · Childcare $1,100/mo · Transit $210/mo · Medical usage: Typical

**Should find (≈ $10,992/yr):** cheaper HDHP + $1,500 HSA seed (~$3,024), Dependent Care FSA (~$1,845), 401(k) match gap 3%→6% ($1,800), commuter subsidy + pre-tax transit (~$1,525), learning $1,000, wellness $600, phone $480, Health FSA, $300 Healthy Start credit hidden on page 24. Optional: tuition, ESPP, student loans.
Same files as the **Try a sample employee** button.

## 2. Northgate Health System (hospital, Texas)
`northgate-health-benefits-guide-2027.pdf` (24 pages) · `northgate-paystub-2026-11.pdf`

**Taylor Nguyen**, 31, ICU nurse, hourly with overtime and night differential, head of household, one child. 403(b) at 2%, Choice PPO for employee + child.
**Add:** Head of household · + Kids · Childcare $950/mo · Commute $0 · Medical usage: Typical

**Tests:** a 403(b) instead of a 401(k), match of 50% on the first 6% plus a separate 2% core contribution, hourly pay, no state income tax, three medical plans.
**Should find (≈ $7,395/yr with only the paystub, checked):** 403(b) match gap: at 2% Taylor gets a 1% match, at 6% the full 3%, so ~$1,888/yr. Saver HDHP + $1,000 HSA seed cheaper than the PPO (~$3,334; the Network HMO is also cheaper). Also Health FSA, certification reimbursement $1,000, Healthy Northgate $300, uniform allowance $250. Adding childcare $950/mo adds the Dependent Care FSA. Optional: student loans $1,800, tuition $5,250.

## 3. Brightline Software (tech, Washington)
`brightline-software-benefits-guide-2027.pdf` (25 pages) · `brightline-paystub-2026-11.pdf`

**Sam Okafor**, 29, senior engineer, $168k, single, paid twice a month. Already saves 10% Roth 401(k), on the PPO.
**Add:** Single · Just me · Childcare $0 · Transit $99/mo · Medical usage: Light

**Tests:** the employee already gets the full match (match capped at $6,000/yr), so there must be no 401(k) card. Also a region-only HMO (WA/OR residents), an employer that pays 100% of transit, and lots of stipends.
**Should find (≈ $6,462/yr with only the paystub, checked):** no 401(k) card; HDHP with $0 premium + $1,000 HSA seed instead of the PPO (~$1,080), learning $2,500, wellness $1,200, internet $720, home office $500, bike benefit $240, Health FSA. Entering transit $99/mo adds the commuter card (employer pays 100%). Optional: ESPP. Fertility benefit listed as a free perk, not as cash. Cascade HMO flagged "WA and OR residents only".

## 4. Pacific Valley Unified School District (public schools, California)
`pacific-valley-usd-benefits-guide-2027.pdf` (24 pages) · `pvusd-paystub-2026-10.pdf`

**Riley Chen**, 38, 5th grade teacher, monthly pay, married, two kids in after-school care. Family PPO costs $760/month after the district contribution.
**Add:** Married · Family · Childcare $600/mo · Commute $0 · Medical usage: Typical

**Tests:** a pension instead of a 401(k) match, so there must be no match card. Also monthly pay, the district contribution cap, a Bay Area-only HMO, and California taxing HSA contributions at the state level.
**Should find (≈ $8,395/yr with only the paystub, checked):** no 401(k) card; Golden HDHP + $1,200 HSA seed instead of the $760/mo family PPO (~$7,083), Health FSA, classroom supplies $300, credential renewal $200, fitness $150. HSA tax savings exclude California state tax. Adding childcare $600/mo adds the Dependent Care FSA. Bay Integrated HMO is flagged as region-only and never recommended.

## 5. Summit Outfitters (retail, Florida)
`summit-outfitters-benefits-guide-2027.pdf` (25 pages) · `summit-paystub-2026-11.pdf`

**Avery Brooks**, 26, lead sales associate, hourly, paid weekly, ~$39k/yr, single, 2.5 years at Summit and contributing 0% to the 401(k).
**Add:** Single · Just me · Childcare $0 · Commute $0 · Medical usage: Typical

**Tests:** weekly pay, medical premiums that depend on pay band (three tables), and a match that starts after one year of service.
**Should find (≈ $2,424/yr, checked):** 401(k) match 0%→4% ($1,576), Value HDHP cheaper for this pay band ($364), Health FSA ($334), gear allowance $150. Optional: tuition-free degrees $5,250. The plan table shows "Band A: annual base pay under $40,000".

---

Regenerate all files with `npm run samples` (sources in `scripts/samples/`).
