import { copyHe } from "./he";

export const copyEn = {
  skip: "Skip to content",
  menuOpen: "Open menu",
  menuClose: "Close menu",
  navLabel: "Main",
  footerNavLabel: "Footer",
  call: "Call",
  callAria: "Call the clinic, {{phone}}",
  whatsapp: "WhatsApp",
  whatsappAria: "Send a WhatsApp message to the clinic",
  newTab: "Opens in a new window",
  footerFine:
    "Information on this site is general and is not medical advice. In an urgent situation, call the clinic or go to an emergency room.",
  rights: "All rights reserved",
  emergencyTitle: "A dental injury or an urgent problem",
  emergencyBody:
    "Call {{phone}} now. If nobody answers, there is significant bleeding or swelling, trouble swallowing or breathing, or you are worried — go to an emergency room or call MADA at 101.",
  emergencyCall: "Call now",
  readMore: "Read",
  backToTips: "Back to parent guides",
  related: "More for parents",
  minutes: "min read",
  updated: "Last updated",
  required: "required",
  homeLabel: "Home",
  articleDisclaimer:
    "This page is general information for parents. It is not a diagnosis, not personal advice, and not a substitute for an exam or urgent care.",
  nav: [
    { id: "home", path: "/", label: "Home" },
    { id: "about", path: "/about/", label: "About" },
    { id: "services", path: "/services/", label: "Care" },
    { id: "tips", path: "/tips/", label: "For parents" },
    { id: "faq", path: "/faq/", label: "FAQ" },
    { id: "contact", path: "/contact/", label: "Contact" },
  ],
  footerLinks: [
    { path: "/accessibility/", label: "Accessibility" },
    { path: "/privacy/", label: "Privacy" },
  ],
  meta: {
    home: {
      title: "Pediatric dentist in Jerusalem | {{doctor}}",
      description:
        "{{doctor}}, {{role}} in {{city}}. A first visit by age one, checkups, prevention, and guidance for parents. Call {{phone}}.",
    },
    about: {
      title: "About {{doctor}} | {{role}}",
      description:
        "Who {{doctor}} is, what a visit is like, and the link with the Hebrew University–Hadassah School of Dental Medicine.",
    },
    services: {
      title: "Care for children | {{doctor}}",
      description:
        "Checkups, cleaning and fluoride, sealants, fillings, dental injuries, and guidance for parents. Treatment is decided after an exam.",
    },
    tips: {
      title: "For parents | {{doctor}}",
      description: "Short guides: the first visit, brushing by age, and a child's dental injury: who to call right away.",
    },
    faq: {
      title: "FAQ | {{doctor}}",
      description:
        "Answers on hours, address, booking, the first visit, and urgent problems. The site assistant is not medical advice.",
    },
    contact: {
      title: "Contact and booking | {{doctor}}",
      description: "Phone {{phone}}, address {{address}}, and a short booking note. The site does not collect medical information.",
    },
    accessibility: {
      title: "Accessibility statement | {{doctor}}",
      description: "Accessibility statement for Israeli Standard 5568 and WCAG 2.1 level AA, and how to reach the clinic.",
    },
    privacy: {
      title: "Privacy policy | {{doctor}}",
      description: "What this website collects, what it does not store, and how to ask a privacy question.",
    },
  },
  home: {
    kicker: "{{doctor}} · {{role}}",
    title: "Pediatric dentist in Jerusalem",
    lede: "Care that starts with an explanation, and moves at your child's pace. From the first tooth: an exam, prevention, and a plan parents understand before anything is done.",
    primaryCta: "Call to book",
    secondaryCta: "Book on WhatsApp",
    trust: [
      { title: "By age one", text: "A first visit around the first tooth, even if nothing seems wrong." },
      { title: "Parents included", text: "You hear what was seen and which options exist, and decide together." },
      { title: "A child's pace", text: "If today does not work, we stop. A short introduction is a real visit." },
    ],
    whyKicker: "Why a children's clinic",
    whyTitle: "Children need a visit built for them",
    whyLede:
      "A pediatric dentist is used to explaining things to parents, working slowly, and putting prevention first — not only treating a tooth once it hurts.",
    why: [
      { title: "Made for this age", text: "The pace, the words, and the tools are for children and teenagers, not copied from adult care." },
      { title: "Prevention early", text: "Brushing, fluoride, drinks, and sealants come up before anyone waits for a cavity." },
      { title: "No mid-visit surprises", text: "What is planned is said before it starts. You can ask questions and ask for a pause." },
    ],
    servicesKicker: "At the clinic",
    servicesTitle: "Care that is decided after an exam",
    servicesLede: "This list says what the clinic offers. It does not say what your child needs.",
    allServices: "All services",
    visitKicker: "First visit",
    visitTitle: "What the first appointment is like",
    visitLede: "Treatment is not done at every first visit. Sometimes you only meet, look, and talk.",
    steps: [
      { title: "Before", text: "When you book, share the child's age and whether they are anxious. Don't write a medical history on the website." },
      { title: "Hello", text: "Your child sees the room and the chair at their pace. A parent stays part of it." },
      { title: "Exam", text: "We look according to how ready the child is. Treatment does not start before an explanation." },
      { title: "At home", text: "You leave with brushing guidance and a sense of the next visit. Timing depends on the exam." },
    ],
    visitLink: "Full guide to the first visit",
    tipsKicker: "For parents",
    tipsTitle: "Three things worth knowing first",
    tipsLede: "Short and practical. They do not replace a visit.",
    allTips: "All parent guides",
    faqKicker: "Before you call",
    faqTitle: "Questions that come up often",
    faqLink: "All questions",
    bandTitle: "Booking is a short conversation",
    bandText: "A name, a phone number, the child's age, and a time that suits you are enough. Keep medical details for the clinic itself.",
  },
  about: {
    kicker: "The clinic",
    title: "About {{doctor}}",
    lede: "{{doctor}}, {{role}}, sees children in {{city}}. Visits are built around a clear explanation for parents and a pace a child can manage.",
    factsTitle: "Questions about background",
    facts: "You are welcome to ask about training and experience when you call to book.",
    approachTitle: "How care is approached",
    approach: [
      { title: "Explain first", text: "What the exam shows, and what can be done, is said before anything starts." },
      { title: "The child's pace", text: "An introductory visit with no treatment is a reasonable outcome, not a failed appointment." },
      { title: "Prevention at home", text: "A lot of tooth care happens with brushing and habits, not only in the chair." },
      { title: "Decide with a parent", text: "Parents hear the options and decide together with the dentist, after an explanation." },
    ],
    affiliationKicker: "Teaching",
    affiliationTitle: "Academic link",
    licenseLabel: "License number",
  },
  servicesPage: {
    kicker: "Care",
    title: "What the clinic offers children",
    lede: "Each section is a general description. What is right for a particular child is decided at an exam, and explained before you decide.",
  },
  services: [
    {
      id: "checkup",
      title: "Checkups",
      summary: "A look at the teeth, gums, and how teeth are coming in, explained to parents.",
      body: [
        "A checkup looks at baby teeth and permanent teeth, the gums, and whether eruption fits the child's age.",
        "Afterwards you hear what was seen, whether any care is suggested, and when to return. A finding does not always mean treatment the same day.",
      ],
    },
    {
      id: "cleaning",
      title: "Cleaning and fluoride",
      summary: "Cleaning when it is useful, and fluoride as part of looking after the teeth.",
      body: [
        "Cleaning reaches plaque a home brush often misses. Fluoride is used according to age and the exam.",
        "It is prevention. It does not promise that decay will never happen, and brushing at home still matters most.",
      ],
    },
    {
      id: "sealants",
      title: "Sealants",
      summary: "A thin coating on the grooves of molar teeth, after an exam.",
      body: [
        "Molars have deep grooves that are hard to clean. A sealant covers them with a thin layer.",
        "They are often considered on new permanent teeth. A sealant does not replace brushing, and it is not right for every tooth.",
      ],
    },
    {
      id: "fillings",
      title: "Fillings for children",
      summary: "Care for decay when it is needed, after the findings and the options are explained.",
      body: [
        "If the exam shows decay, parents hear what was seen and which paths exist. A filling is one of them.",
        "What is planned is said before it starts. This site does not promise a result or a particular course.",
      ],
    },
    {
      id: "trauma",
      title: "Dental injuries and urgent visits",
      summary: "Help for a knock, a damaged tooth, or pain that should not wait.",
      body: [
        "After an injury, call right away. Time matters, especially if a permanent tooth has been knocked out.",
        "The website cannot assess this from a distance. If the clinic does not answer and there is bleeding, swelling, or you are worried — go to an emergency room or call MADA at 101.",
      ],
    },
    {
      id: "guidance",
      title: "Prevention guidance for parents",
      summary: "Brushing, soothers, bottles, sweet drinks, and what to watch at home.",
      body: [
        "Part of a visit is a conversation: who brushes, how much toothpaste, what happens with a night bottle, and how to talk with a worried child.",
        "Guidance is matched to age after the child is seen. The parent pages on this site are background only.",
      ],
    },
    {
      id: "first",
      title: "A first visit by age one",
      summary: "An introduction and exam around the first tooth, even without pain.",
      body: [
        "A first exam is usually recommended by age one, or when the first tooth erupts. There is no need to wait for pain.",
        "Sometimes the visit is only a hello and a short look. That can be enough to orient parents and see that the start looks fine.",
      ],
    },
  ],
  tipsPage: {
    kicker: "For parents",
    title: "Short notes before you come",
    lede: "Three starting guides. They do not replace a conversation with the clinic, and they are not for an emergency.",
  },
  faqPage: {
    kicker: "FAQ",
    title: "Short answers, not a diagnosis",
    lede: "You can also open the automated assistant at the corner of the screen. It uses this same list, and it does not give medical advice.",
    topics: {
      practical: "Getting here and booking",
      visit: "The visit",
      care: "Prevention and care",
      urgent: "Urgent problems",
    },
  },
  contact: {
    kicker: "Book a visit",
    title: "{{contactTitle}}",
    lede: "{{contactLede}}",
    phoneLabel: "Phone",
    addressLabel: "Address",
    addressHint: "The arrival time is arranged by phone.",
    hoursLabel: "Hours",
    fundsLabel: "Health funds",
    accessLabel: "Arrival and access",
    formTitle: "Details for booking",
    parentLabel: "Parent's name",
    phoneField: "Phone for a reply",
    ageLabel: "Child's age",
    agePlaceholder: "Choose an age range",
    ages: ["Under 1", "1–2", "3–5", "6–9", "10–12", "13 and over"],
    timeLabel: "Preferred time",
    timePlaceholder: "Choose a time",
    timeHint: "Please don't write any medical details here. We will talk about everything by phone.",
    times: ["Morning", "Midday", "Afternoon"],
    consent: "I agree to be contacted about booking a visit. {{formChannel}}",
    submit: "Send on WhatsApp",
    emailSubmit: "Send by email",
    error: "To send, fill in every field and tick the consent line.",
    template:
      "Hello, I would like to book a visit.\nParent's name: [[parent]]\nPhone: [[phone]]\nChild's age: [[age]]\nPreferred time: [[time]]",
    emailSubject: "Request to book a visit",
    mapButton: "Show the map",
    mapTitle: "Map of the clinic address",
    mapOpen: "Open in Google Maps",
    mapNote: "The map loads from Google only after you click.",
    genericWhatsapp: "Hello, I would like to book a visit at the clinic.",
  },
  navTo: {
    label: "Directions to the clinic",
    waze: "Navigate with Waze",
    wazeDesktop: "Send Waze to my phone",
    google: "Navigate with Google Maps",
  },
  navShare: {
    title: "Send Waze directions to a phone",
    lede: "Type an Israeli mobile number. WhatsApp or SMS will open on this computer with the clinic’s Waze link, ready to send.",
    ledeApi: "Type an Israeli mobile number. The link is sent through the messaging server configured for this site.",
    phoneLabel: "Mobile number",
    phoneHint: "For example 050-1234567. Israeli mobiles only.",
    whatsapp: "Send on WhatsApp",
    sms: "Send by SMS",
    privacy: "This number stays on this device. The site does not store it or send it to a server.",
    privacyApi: "This number is sent only to the messaging server configured for the site, so it can deliver the directions link. The site does not keep a copy.",
    more: "Other options: copy the link or scan a code",
    openWaze: "Open the Waze link here",
    copy: "Copy link",
    copied: "The Waze link was copied.",
    copyFailed: "Automatic copy did not work. The link is selected so you can copy it.",
    qrLabel: "QR code of the Waze link to the clinic",
    qrCaption: "Scan with the phone camera to open Waze.",
    close: "Close",
    errorEmpty: "Type a mobile number.",
    errorInvalid: "That is not an Israeli mobile number. For example: 050-1234567.",
    errorApi: "The message could not be sent. Copy the link, or try again.",
    errorEndpoint: "A messaging server is not configured.",
    openedWhatsapp: "WhatsApp opened with the link. If no window opened, allow pop-ups or copy the link.",
    openedSms: "The SMS app opened with the link. If it did not open, copy the link.",
    openedApi: "The request was sent to the messaging server.",
    popupBlocked: "The window was blocked. Allow pop-ups, or copy the link below.",
    message: "Directions to the clinic ({{address}}):\n{{wazeUrl}}",
  },
  review: {
    title: "A Google review",
    text: "If you have visited the clinic, you are welcome to tell Google how it went, in your own words. Writing is optional, and there is no reward or incentive. If something was uncomfortable, you can also call {{phone}}.",
    button: "Write a Google review",
  },
  a11y: {
    kicker: "Accessibility",
    title: "Accessibility statement",
    lede: "The site is meant to be usable by parents, including people who use a keyboard, a screen reader, or larger text.",
    sections: [
      {
        heading: "The standard",
        paragraphs: [
          "We aim to meet Israeli Standard 5568, which is based on WCAG 2.1 level AA. That is the target for this website. It is not a claim that an outside auditor has certified every page.",
        ],
      },
      {
        heading: "What the site does",
        list: [
          "Headings, navigation, a main region, and a skip link.",
          "Hebrew pages are right to left and English pages are left to right, with a language set on each page.",
          "Color contrast for text and buttons, based on an internal check, and a visible keyboard focus.",
          "Forms have labels, and they do not ask for medical information.",
          "The automated assistant is a dialog that works from the keyboard, with topic buttons.",
          "Sending directions to a phone is a dialog with a labelled field, an error message, and keyboard close.",
          "Motion is reduced when the device asks for that.",
          "Decorative drawings are hidden from screen readers; meaningful content is text.",
        ],
      },
      {
        heading: "Known limits",
        list: [
          "The Google map is a third-party service and loads only after a click. It may be less accessible than this site. The address and a directions link work without the map.",
          "WhatsApp, Waze, and Google Maps are external apps. You can always book by phone, and the address is written on the site without them.",
          "Physical access details for the clinic building will be published here once they are confirmed. Until then, ask by phone.",
        ],
      },
      {
        heading: "Contact about accessibility",
        paragraphs: [
          "If something on the site is hard to use, or you need an adjustment for a visit, call {{phone}}. We will try to fix it or offer another way.",
        ],
      },
    ],
  },
  privacy: {
    kicker: "Privacy",
    title: "Privacy policy",
    lede: "The site gives information and opens a way to book. It is not a store of medical records.",
    sections: [
      {
        heading: "Who is responsible",
        paragraphs: ["This website represents the clinic of {{doctor}} at {{address}}. Privacy questions: {{phone}}."],
      },
      {
        heading: "What the site does not collect",
        paragraphs: [
          "There is no user account, no clinic database behind the site, and no advertising or analytics tool. The form is not submitted to this website's server.",
        ],
      },
      {
        heading: "Sending directions from a computer",
        paragraphs: [
          "On a computer you can type a mobile number to open WhatsApp or SMS with a Waze link to the clinic. By default the number stays on your device: the site does not store it or send it to a server. If a messaging server is switched on later, the number is sent only there so it can deliver the link, and the site still does not keep a copy.",
        ],
      },
      {
        heading: "The booking form",
        paragraphs: [
          "The fields are a parent's name, a phone number, the child's age, and a preferred time. There is no field for a complaint, a diagnosis, or medicines. {{formPrivacy}}",
          "Please don't write medical details in the message. What the dentist needs to know is said by phone or at the clinic.",
        ],
      },
      {
        heading: "Map",
        paragraphs: [
          "The address is shown as text. A Google map loads only if you choose “Show the map”. Google may then receive an IP address and technical data under its own policy.",
        ],
      },
      {
        heading: "Hosting",
        paragraphs: [
          "The site is hosted on GitHub Pages. The hosting provider may keep short technical logs (for example an IP address) as part of operating the service. The details are in [GitHub's privacy statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement). The site does not set marketing cookies.",
        ],
      },
      {
        heading: "Children",
        paragraphs: ["The site speaks to parents and adults who look after children. It does not ask children to submit details."],
      },
      {
        heading: "Requests",
        paragraphs: [
          "To ask about access, correction, or deletion of information you gave the clinic directly (by phone, WhatsApp, or email), call {{phone}}. The website itself does not keep a copy of the booking form.",
        ],
      },
    ],
  },
  articles: [
    {
      slug: "first-visit",
      title: "The first visit to a pediatric dentist",
      description: "When to come, how to prepare a child, and what usually happens.",
      minutes: 4,
      blocks: [
        {
          type: "p",
          text: "A first exam is usually recommended by age one, or around the time the first tooth comes in. There is no need to wait for pain, and there do not need to be “enough teeth” yet.",
        },
        {
          type: "p",
          text: "Even if nothing looks wrong, the visit is for meeting, checking that the start looks as expected, and giving parents something practical for home.",
        },
        { type: "h2", text: "Getting ready at home" },
        {
          type: "ul",
          items: [
            "Keep the words simple: “we're going to count teeth” or “the dentist will look at your smile”.",
            "Don't promise that nothing will be felt, and don't retell frightening stories from adult treatment.",
            "Come when your child is awake, has eaten, and is not missing a nap.",
            "A comfort object is welcome if you have one.",
          ],
        },
        { type: "h2", text: "What usually happens" },
        {
          type: "p",
          text: "We start by talking. Then your child meets the chair and the tools at their pace. The exam follows how ready they are. Treatment is not done at every first visit, and sometimes the appointment is only an introduction.",
        },
        { type: "h2", text: "What you leave with" },
        {
          type: "ul",
          items: [
            "A plain-language account of what was seen.",
            "Direction on brushing, soothers, bottles, and sweet drinks.",
            "A decision about whether and when to return. That is made at the clinic, not in advance on the site.",
          ],
        },
        {
          type: "note",
          text: "To book, call {{phone}}. If there is an injury or severe pain, don't wait for a guide — call now.",
        },
      ],
    },
    {
      slug: "brushing-by-age",
      title: "Brushing by age",
      description: "Who brushes, how much toothpaste, and when to start — without a battle.",
      minutes: 4,
      blocks: [
        {
          type: "p",
          text: "Before any teeth are through, you can wipe the gums once a day with a clean, damp cloth so a baby gets used to touch around the mouth.",
        },
        {
          type: "p",
          text: "As soon as the first tooth erupts, brush twice a day, morning and night, with a fluoride toothpaste.",
        },
        { type: "h2", text: "Who brushes, and how much paste" },
        {
          type: "ul",
          items: [
            "Until about age 3: a parent brushes. Use a smear of toothpaste.",
            "Ages 3 to 6: a pea-sized amount. The child can start, and a parent finishes.",
            "From about age 6: two minutes, twice a day. Keep supervising until the brushing is actually thorough.",
          ],
        },
        { type: "h2", text: "Why the amount is small" },
        {
          type: "p",
          text: "Children swallow some toothpaste. A smear or a pea gives fluoride on the tooth without a large amount to swallow. Spit after brushing, without a big rinse, so a thin film stays. If that does not work at home, ask at the clinic and adjust.",
        },
        { type: "h2", text: "Habits that help" },
        {
          type: "ul",
          items: [
            "A small, soft brush, replaced when the bristles splay.",
            "Move toward a cup by about age one. Don't fall asleep with a bottle of anything other than water.",
            "Sweet or sticky snacks are better inside a meal than spread through the day.",
            "When two teeth touch, start flossing with a parent's help.",
          ],
        },
        {
          type: "note",
          text: "These amounts follow common pediatric dental guidance. The clinic will match them to your child. This is not a personal prescription.",
        },
      ],
    },
    {
      slug: "knocked-out-tooth",
      title: "A child's dental injury: who to call right away",
      description: "A child injured a tooth? Who to call right away, and when to go to an emergency room.",
      minutes: 1,
      blocks: [
        {
          type: "note",
          text: "This is general information only and is not medical advice. It does not replace a call to the clinic or a visit to an emergency room.",
        },
        { type: "h2", text: "Call right away" },
        {
          type: "ul",
          items: [
            "After any injury to the teeth, including a tooth that was knocked out, broken, or loosened, call the clinic right away: {{phone}}.",
            "If nobody answers, or there is bleeding, swelling, trouble breathing or swallowing, a head injury, confusion, or vomiting, go to an emergency room or call MADA at 101.",
            "The website cannot assess this from a distance, so it does not give care instructions.",
          ],
        },
      ],
    },
  ],
  notFound: {
    title: "Page not found",
    text: "This link does not lead to a page on the site. You can go home or call the clinic.",
    home: "Home",
    english: "עברית",
  },
} satisfies typeof copyHe;
