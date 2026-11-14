// Shared sections every US benefits guide has (eligibility, Rx, dental, vision, life, disability,
// voluntary benefits, glossary, legal notices). Parameterized per fictional employer so each test
// guide is long and realistic while the key facts live in company-specific sections.

const money = (n) => `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function welcome(c) {
  return [
    ["h1", "Welcome to Open Enrollment"],
    ["p", `Each year, ${c.name} invests significantly in the health, financial security and well-being of our ${c.people}. This guide describes the benefits available to eligible ${c.short} employees for the ${c.planYearLabel}. Please take time to review it carefully. Many of the most valuable programs, including spending accounts, retirement contributions and several reimbursement programs, only pay out if you actively enroll or submit a claim.`],
    ["p", `We know benefits language can be confusing. Throughout this guide we have tried to explain each program in plain terms and to tell you exactly what you need to do to take advantage of it. If you have questions, the ${c.center} is available at ${c.phone}, and licensed counselors can help you compare options before you make your elections.`],
    ["p", `Thank you for the work you do every day. ${c.closing}`],
    ["p", c.signature],
    ["h2", "Key dates"],
    ["table", ["Milestone", "Date"], c.keyDates, [300, 200]],
    ["h2", "What is new this year"],
    ["ul", c.whatsNew],
    ["callout", `If you do not make changes during Open Enrollment, your current medical, dental, vision and life elections continue. Health Care FSA and Dependent Care FSA elections do NOT continue and must be made again every year.`],
  ];
}

export function eligibility(c) {
  return [
    ["h1", "Eligibility and Enrollment"],
    ["h2", "Who is eligible"],
    ["p", `You are eligible for the benefits in this guide if you are a ${c.eligibleWho}. ${c.eligibleExtra} Employees in temporary, seasonal or per diem positions are not eligible for these programs unless otherwise stated.`],
    ["h2", "Eligible dependents"],
    ["ul", [
      "Your legal spouse or registered domestic partner.",
      "Children up to the end of the month in which they turn 26, including biological, adopted, step and foster children and children for whom you are the legal guardian.",
      "Unmarried children of any age who are incapable of self-support because of a disability that began before age 26.",
    ]],
    ["p", `Proof of dependent eligibility, such as a marriage certificate or birth certificate, is required within 30 days of enrolling a new dependent. Dependents without verified documentation will be removed from coverage. Knowingly covering an ineligible dependent may result in disciplinary action and repayment of claims.`],
    ["h2", "When coverage begins"],
    ["p", `New employees are eligible for coverage ${c.newHireStart}. You have 30 days from your date of hire to enroll. If you do not enroll, you will have no medical, dental or vision coverage until the next Open Enrollment unless you experience a qualifying life event. Elections made during Open Enrollment take effect ${c.effective}.`],
    ["h2", "How to enroll"],
    ["ul", [
      `Log in to ${c.portal} with your employee credentials.`,
      "Review and update your dependents and beneficiaries.",
      "Compare medical plans using the cost estimator and your expected usage.",
      "Select medical, dental and vision coverage and a coverage tier.",
      "Elect your spending accounts. Remember they do not roll over automatically.",
      "Review life, disability and voluntary benefits.",
      "Submit your elections and save the confirmation statement.",
    ]],
    ["h2", "Qualifying life events"],
    ["p", `Because your premiums are paid on a pre-tax basis under Section 125 of the Internal Revenue Code, you may only change your elections outside of Open Enrollment if you have a qualifying life event and the change is consistent with that event. Changes must be requested within 30 days of the event (60 days for loss or gain of Medicaid or CHIP eligibility).`],
    ["table", ["Event", "Examples of documentation"], [
      ["Marriage, divorce or legal separation", "Certificate or decree"],
      ["Birth, adoption or placement for adoption", "Birth certificate or adoption papers"],
      ["Death of a covered dependent", "Death certificate"],
      ["Gain or loss of other coverage", "Letter from employer or insurer"],
      ["Change in work schedule affecting eligibility", "Department confirmation"],
      ["Relocation outside the plan's service area", "Proof of address"],
    ], [270, 230]],
  ];
}

export function paying(c) {
  return [
    ["h1", "Paying for Your Benefits"],
    ["p", `${c.short} employees are paid ${c.payWord}, for a total of ${c.payPeriods} pay periods per year. Unless otherwise noted, the employee costs shown in this guide are the amounts deducted from each paycheck${c.premiumNote ? `; ${c.premiumNote}` : ""}.`],
    ["p", "Medical, dental and vision premiums and contributions to Health Savings Accounts and Flexible Spending Accounts are taken before federal income tax, Social Security and Medicare taxes are calculated, and before state income tax in most states. Paying with pre-tax dollars lowers your taxable income, so every dollar you spend through these programs costs you less than a dollar of take-home pay."],
    ["p", "Supplemental life insurance, spouse and child life insurance and most voluntary benefits are deducted after taxes. If you cover a domestic partner who is not your tax dependent, the value of the partner's coverage is reported as imputed income."],
  ];
}

export function rx(c) {
  return [
    ["h1", "Prescription Drug Coverage"],
    ["p", `Prescription drug coverage is included with every medical plan and administered by ${c.vendors.rx}. Drugs are grouped into tiers based on cost and clinical effectiveness. Generic drugs offer the lowest cost and are equally effective as brand-name drugs in most cases. Preventive medications required under the Affordable Care Act, such as generic contraceptives and certain vaccines, are covered at no cost on all plans.`],
    ["table", ["Tier", "Retail (30-day)", "Mail order (90-day)"], [
      ["Generic", "$10 copay", "$20 copay"],
      ["Preferred brand", "$35 copay", "$70 copay"],
      ["Non-preferred brand", "$70 copay", "$140 copay"],
      ["Specialty", "20% up to $200", "Not available"],
    ], [180, 160, 160]],
    ["note", "On HSA-eligible plans, prescriptions (other than preventive drugs) are subject to the deductible first, then the copays above apply."],
    ["p", "Some medications require prior authorization or step therapy. Specialty drugs must be filled through the specialty pharmacy after the first fill. Maintenance medications can be filled for 90 days through home delivery, which usually costs two copays instead of three."],
  ];
}

export function dentalVision(c) {
  const d = c.dental, v = c.vision;
  return [
    ["h1", "Dental and Vision"],
    ["h2", "Dental"],
    ["p", `Dental coverage is provided by ${c.vendors.dental}. You may see any dentist, but in-network dentists have agreed to reduced fees and cannot balance bill you.`],
    ["table", ["", "Dental Base", "Dental Plus"], [
      ["Deductible (individual / family)", "$50 / $150", "$50 / $150"],
      ["Preventive care", "100%", "100%"],
      ["Basic services", "80% after deductible", "80% after deductible"],
      ["Major services", "50% after deductible", "60% after deductible"],
      ["Orthodontia", "Not covered", "50% to $1,500 lifetime"],
      ["Annual maximum", "$1,250", "$2,000"],
    ], [200, 150, 150]],
    ["table", ["Coverage tier", "Dental Base", "Dental Plus"], [
      ["Employee only", money(d[0]), money(d[4])],
      ["Employee + Spouse", money(d[1]), money(d[5])],
      ["Employee + Child(ren)", money(d[2]), money(d[6])],
      ["Employee + Family", money(d[3]), money(d[7])],
    ], [200, 150, 150]],
    ["h2", "Vision"],
    ["p", `Vision coverage is provided by ${c.vendors.vision} and includes an annual eye exam for a $10 copay, lenses for a $20 copay and a $160 allowance for frames or contact lenses every 12 months.`],
    ["table", ["Coverage tier", "Cost per paycheck"], [
      ["Employee only", money(v[0])], ["Employee + Spouse", money(v[1])], ["Employee + Child(ren)", money(v[2])], ["Employee + Family", money(v[3])],
    ], [250, 250]],
  ];
}

export function lifeDisability(c) {
  return [
    ["h1", "Life and Disability Insurance"],
    ["h2", "Basic life and AD&D"],
    ["p", `${c.short} provides basic life and accidental death and dismemberment insurance of ${c.basicLife} at no cost to you through ${c.vendors.life}. The value of employer-paid coverage above $50,000 is taxable and appears on your paystub as imputed income.`],
    ["h2", "Supplemental life"],
    ["p", "You may buy additional coverage for yourself in increments of one times salary up to five times salary ($1,000,000 maximum), and for your spouse ($10,000 increments to $200,000) and children ($10,000 or $20,000). Amounts above the guaranteed issue limit require evidence of insurability. Rates are age-banded and shown in the enrollment system."],
    ["h2", "Disability"],
    ["table", ["", "Short-term disability", "Long-term disability"], [
      ["Benefit", c.std, "60% of monthly earnings"],
      ["Waiting period", "7 days", "90 days"],
      ["Maximum", "26 weeks", "$12,000 per month"],
      ["Cost", c.stdCost, "Paid by employer"],
    ], [140, 180, 180]],
    ["p", "Disability benefits are coordinated with state disability programs, workers' compensation and Social Security. Pre-existing condition limitations may apply during the first 12 months of long-term disability coverage."],
    ["h2", "Voluntary benefits"],
    ["p", "Accident insurance, critical illness insurance, hospital indemnity insurance, identity theft protection, legal insurance upgrades, pet insurance and group auto and home insurance are available at group rates. These programs are paid entirely by you with after-tax payroll deductions, and benefits are paid directly to you. They are designed to supplement, not replace, your medical coverage."],
  ];
}

export function glossary() {
  return [
    ["h1", "Glossary"],
    ["table", ["Term", "Definition"], [
      ["Coinsurance", "Your percentage share of covered costs after the deductible."],
      ["Copay", "A flat fee for a service, such as $25 for an office visit."],
      ["Deductible", "What you pay each year before the plan begins to share costs."],
      ["Employer contribution", "Money your employer adds to an account or premium on your behalf."],
      ["FSA", "Flexible Spending Account: pre-tax money for eligible expenses, use it or lose it."],
      ["HDHP", "High-deductible health plan that qualifies you to contribute to an HSA."],
      ["HSA", "Health Savings Account you own; tax-free in, tax-free growth, tax-free out for medical costs."],
      ["In-network", "Providers contracted with the plan at negotiated rates."],
      ["Match", "Employer contribution to your retirement account based on what you contribute."],
      ["Out-of-pocket maximum", "The most you will pay for covered in-network services in a plan year."],
      ["Premium", "The amount you pay for coverage each pay period."],
      ["Vesting", "The schedule on which employer retirement contributions become yours."],
    ], [150, 350]],
  ];
}

export function notices(c) {
  return [
    ["h1", "Annual Legal Notices"],
    ["p", `Federal law requires ${c.name} to provide the following notices each year. Complete versions are available in ${c.portal}, and paper copies are available at no cost from the ${c.center}.`],
    ["h2", "Women's Health and Cancer Rights Act"],
    ["p", "The plans cover all stages of reconstruction of the breast on which a mastectomy was performed, surgery and reconstruction of the other breast to produce a symmetrical appearance, prostheses and treatment of physical complications of the mastectomy, including lymphedema, subject to the same deductibles and coinsurance as other benefits."],
    ["h2", "Newborns' and Mothers' Health Protection Act"],
    ["p", "Group health plans may not restrict hospital stays in connection with childbirth to less than 48 hours following a vaginal delivery or 96 hours following a cesarean section, unless the attending provider, after consulting with the mother, discharges the mother or newborn earlier."],
    ["h2", "HIPAA special enrollment rights"],
    ["p", "If you decline coverage because you have other coverage and later lose that coverage, or if you gain a new dependent through marriage, birth or adoption, you may enroll within 30 days of the event. If you or a dependent lose Medicaid or CHIP coverage or become eligible for premium assistance, you may enroll within 60 days."],
    ["h2", "Medicare Part D notice of creditable coverage"],
    ["p", "The prescription drug coverage offered under all medical plans is expected to pay out, on average, as much as standard Medicare prescription drug coverage and is considered creditable. You can keep this coverage and will not pay a late enrollment penalty if you later join a Medicare drug plan."],
    ["h2", "COBRA continuation coverage"],
    ["p", "If you or your dependents lose coverage because of a qualifying event such as termination of employment, reduction in hours, divorce or a child aging out, you may be able to continue coverage at your own cost for up to 18 or 36 months. You may also qualify for coverage through the Health Insurance Marketplace."],
    ["h2", "Privacy of health information"],
    ["p", "The group health plans protect the privacy of your health information as required by HIPAA and use or disclose it only as permitted by law, such as for treatment, payment and plan operations. You have the right to receive a copy of the full Notice of Privacy Practices."],
    ["h2", "Summary of Benefits and Coverage"],
    ["p", "A Summary of Benefits and Coverage for each medical plan is available online and on request. SBCs use a standard format so you can compare plans side by side."],
  ];
}

export function contacts(c, rows) {
  return [
    ["h1", "Contacts"],
    ["table", ["Benefit", "Provider", "Contact"], rows, [170, 170, 160]],
    ["p", `This guide summarizes benefits for eligible ${c.short} employees. Official plan documents govern in the event of any conflict. ${c.name} reserves the right to change or terminate any plan at any time, subject to applicable law and collective bargaining obligations.`],
    ["note", `${c.name} and every vendor named in this guide are fictional. This document was created for product demonstration and testing only and does not describe any real employer's benefits.`],
  ];
}
