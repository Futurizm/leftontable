// More sections found in real benefits guides: care options, how plans work, eligible expenses,
// leaves, financial basics and FAQ. Used to make the test guides as long as real ones.

export function careOptions() {
  return [
    ["h1", "Getting the Right Care"],
    ["p", "Where you go for care has a big effect on what you pay. Emergency rooms are the most expensive place to receive care and should be reserved for true emergencies. For everything else, there are faster and less expensive options available through every medical plan."],
    ["table", ["Where to go", "When to use it", "Typical wait"], [
      ["Virtual visit (phone or video)", "Colds, flu, rashes, pink eye, prescription refills, minor infections", "Under 15 minutes"],
      ["24/7 nurse line", "Not sure where to go; questions about symptoms or medications", "Immediate"],
      ["Primary care provider", "Preventive care, chronic conditions, non-urgent illness, referrals", "Same week"],
      ["Urgent care center", "Sprains, minor cuts needing stitches, fevers, ear infections after hours", "Under 1 hour"],
      ["Emergency room", "Chest pain, difficulty breathing, severe bleeding, signs of stroke", "Varies"],
    ], [150, 250, 100]],
    ["h2", "Preventive care"],
    ["p", "In-network preventive care is covered at 100% with no deductible on every plan. This includes annual physicals, well-child visits, immunizations, routine cancer screenings such as mammograms and colonoscopies, and screenings for blood pressure, cholesterol and diabetes. If a preventive visit turns into a diagnostic discussion about a new symptom, part of the visit may be billed as diagnostic care and subject to your deductible and coinsurance."],
    ["h2", "Behavioral health"],
    ["p", "Mental health and substance use treatment is covered on the same terms as medical care. Members can access in-network therapists, psychiatrists and intensive outpatient programs, as well as virtual therapy. You do not need a referral for behavioral health care on any plan."],
    ["h2", "Care management programs"],
    ["p", "Members with chronic conditions such as diabetes, asthma, heart disease or a high-risk pregnancy can work with a dedicated nurse care manager at no additional cost. Participation is voluntary and confidential."],
  ];
}

export function howPlansWork() {
  return [
    ["h1", "How Medical Plans Work"],
    ["p", "Every medical plan balances two kinds of costs: the premium you pay from each paycheck whether or not you use care, and the out-of-pocket costs you pay when you actually receive care. Plans with lower premiums usually have higher deductibles, and plans with higher premiums usually have lower deductibles and more copays. The right plan for you depends on which combination costs less for the amount of care you expect to use, and how much financial risk you are comfortable with."],
    ["h2", "The four numbers that matter"],
    ["ul", [
      "Premium: what you pay every paycheck for coverage.",
      "Deductible: what you pay for covered services each year before the plan starts sharing the cost.",
      "Coinsurance or copay: your share of the cost after the deductible, either a percentage or a flat fee.",
      "Out-of-pocket maximum: the most you will pay in a year for covered in-network care. After you reach it, the plan pays 100%.",
    ]],
    ["h2", "Illustration: how costs add up"],
    ["p", "Imagine a hypothetical plan with a 1,000 dollar deductible, 20 percent coinsurance and a 4,000 dollar out-of-pocket maximum. A member with 600 dollars of covered bills pays all of it, because the deductible has not been met. A member with 5,000 dollars of bills pays the first 1,000 and then 20 percent of the remaining 4,000, for a total of 1,800. A member with a 50,000 dollar surgery stops paying at the out-of-pocket maximum. This illustration is for explanation only and does not describe any specific plan in this guide."],
    ["h2", "Total cost of a plan"],
    ["p", "To compare plans fairly, add your annual premiums to the out-of-pocket costs you expect, then subtract any employer money deposited into an HSA or HRA and the tax savings from paying expenses with pre-tax dollars. The plan with the lowest total is usually the best financial choice, as long as you could afford the out-of-pocket maximum in a bad year."],
    ["h2", "In-network versus out-of-network"],
    ["p", "Providers in the network have agreed to discounted rates. Out-of-network providers have not, and they may bill you for the difference between their charge and what the plan allows. Always check whether a provider, lab or facility is in network before you receive non-emergency care."],
  ];
}

export function eligibleExpenses() {
  return [
    ["h1", "Eligible Expenses for Tax-Advantaged Accounts"],
    ["p", "The IRS determines which expenses can be paid with HSA and FSA dollars. The lists below are common examples and are not all-inclusive. Keep itemized receipts for every purchase; you may be asked to substantiate claims."],
    ["h2", "Health care expenses (HSA, Health Care FSA)"],
    ["ul", [
      "Deductibles, copays and coinsurance for medical, dental and vision care",
      "Prescription drugs and insulin",
      "Over-the-counter medicines and menstrual care products",
      "Eyeglasses, contact lenses, solution and corrective eye surgery",
      "Dental cleanings, fillings, crowns, dentures and orthodontia",
      "Hearing exams, hearing aids and batteries",
      "Chiropractic care, acupuncture and physical therapy",
      "Psychotherapy and psychiatric care",
      "Medical equipment such as crutches, blood pressure monitors and CPAP supplies",
      "Sunscreen SPF 15 or higher, first aid kits and bandages",
    ]],
    ["h2", "Dependent care expenses (Dependent Care FSA)"],
    ["ul", [
      "Licensed day care centers and family day care homes",
      "Preschool and nursery school (not kindergarten tuition)",
      "Before- and after-school programs",
      "Summer day camps (not overnight camps)",
      "Care for a disabled spouse or adult dependent who lives with you",
      "Nannies and au pairs, if you pay payroll taxes on their wages",
    ]],
    ["h2", "Not eligible"],
    ["ul", [
      "Cosmetic procedures and teeth whitening",
      "Health club dues, unless prescribed for a specific medical condition",
      "Insurance premiums, except certain HSA exceptions such as COBRA",
      "Expenses reimbursed by another plan",
      "Child care provided by your spouse or by your child under age 19",
    ]],
  ];
}

export function leaves(c) {
  return [
    ["h1", "Leaves of Absence"],
    ["p", `${c.short} complies with the Family and Medical Leave Act (FMLA) and applicable state leave laws. Eligible employees may take up to 12 weeks of job-protected leave in a 12-month period for their own serious health condition, to care for a family member with a serious health condition, or to bond with a new child. Health coverage continues during FMLA leave, and you continue to pay your share of premiums.`],
    ["h2", "Other leaves"],
    ["ul", [
      "Military leave in accordance with USERRA.",
      "Jury duty and witness leave.",
      "Bereavement leave of up to five days for the death of an immediate family member.",
      "Voting time as required by state law.",
      "Personal leave of absence with manager and HR approval.",
    ]],
    ["p", "If you are on an unpaid leave, you will be billed directly for your share of benefit premiums. Failure to pay premiums may result in loss of coverage. Contact the benefits team at least 30 days before a planned leave so your benefits and pay can be coordinated."],
  ];
}

export function financialBasics(c) {
  return [
    ["h1", "Financial Well-Being"],
    ["p", "Small decisions made early can make a large difference over a career. The information below is general education and not personal financial advice."],
    ["h2", "Start with the free money"],
    ["p", "If your employer offers a matching contribution, contributing enough to receive the full match is one of the highest-return financial moves available. A match is an immediate return on every dollar you contribute, before any investment growth."],
    ["h2", "Pre-tax versus Roth"],
    ["p", "Pre-tax contributions lower your taxable income today, and you pay income tax when you withdraw the money in retirement. Roth contributions are made with after-tax dollars, but qualified withdrawals in retirement, including earnings, are tax-free. Many people use a mix of both."],
    ["h2", "Emergency savings"],
    ["p", "Financial planners commonly suggest keeping three to six months of essential expenses in an easily accessible savings account. If you choose a high-deductible health plan, consider keeping at least the amount of your deductible available in your HSA or savings."],
    ["h2", "Beneficiaries"],
    ["p", "Review the beneficiaries on your retirement accounts and life insurance at least once a year and after any life event such as marriage, divorce or the birth of a child. Beneficiary designations generally override instructions in a will."],
    ["h2", "Free help"],
    ["p", `${c.short} employees can schedule free sessions with financial coaches through the Employee Assistance Program to discuss budgeting, debt, saving for college and retirement planning.`],
  ];
}

export function faq(c) {
  return [
    ["h1", "Frequently Asked Questions"],
    ["h3", "Do I need to do anything during Open Enrollment?"],
    ["p", "If you want to keep your current medical, dental and vision coverage, those elections roll over. However, you must re-elect your Health Care FSA and Dependent Care FSA every year, and Open Enrollment is your only chance to change medical plans without a qualifying life event."],
    ["h3", "Can I change my retirement contribution at any time?"],
    ["p", "Yes. Retirement plan contributions can be changed at any time, and changes usually take effect within one or two pay periods."],
    ["h3", "Can I change my HSA contribution during the year?"],
    ["p", "Yes. HSA contributions can be started, stopped or changed at any time without a qualifying life event."],
    ["h3", "What happens to my HSA if I leave?"],
    ["p", "Your HSA belongs to you. You keep the account and all of the money in it, including employer contributions, if you change plans or leave."],
    ["h3", "What happens to unused FSA money?"],
    ["p", "Health Care FSA balances above the carryover amount, and all unused Dependent Care FSA balances, are forfeited at the end of the plan year after the claims deadline."],
    ["h3", "How do I add a newborn to my coverage?"],
    ["p", "Add your baby within 30 days of birth through the enrollment system and upload the birth certificate when available. Coverage is effective on the date of birth."],
    ["h3", "Where can I see what I currently have?"],
    ["p", `Your current elections and per-paycheck costs are shown in ${c.portal} and on your paystub.`],
    ["h3", "Who can help me decide?"],
    ["p", `Call the ${c.center} at ${c.phone}. Counselors can compare plans with you based on your expected use of care.`],
  ];
}
